"""Knowledge graph services – build, query, visualise.

Uses NetworkX (in-process, zero-dependency) for dev. Optional Neo4j backend for prod.
"""
from __future__ import annotations
import json
import logging
from collections import defaultdict
import networkx as nx
from django.db import transaction
from django.utils import timezone

from backend.apps.papers.models import Paper
from backend.apps.extraction.models import Entity, Relation
from .models import Material, GraphSnapshot

log = logging.getLogger(__name__)


def build_graph_from_papers(paper_ids: list[int] | None = None, save_snapshot: bool = True) -> nx.MultiDiGraph:
    """Build a NetworkX MultiDiGraph from entities + relations across papers.

    Nodes: entities (with type, paper count, normalized text).
    Edges: relations (with type, confidence, evidence, paper_id).
    """
    G = nx.MultiDiGraph()
    qs = Entity.objects.all()
    if paper_ids:
        qs = qs.filter(paper_id__in=paper_ids)

    # add nodes
    for e in qs.values("id", "text", "normalized", "entity_type", "paper_id", "confidence"):
        node_id = e["normalized"] or e["text"]
        if not G.has_node(node_id):
            G.add_node(
                node_id,
                label=e["text"],
                type=e["entity_type"],
                papers=set(),
                mention_count=0,
            )
        G.nodes[node_id]["papers"].add(e["paper_id"])
        G.nodes[node_id]["mention_count"] += 1

    # add edges
    rel_qs = Relation.objects.all()
    if paper_ids:
        rel_qs = rel_qs.filter(paper_id__in=paper_ids)

    for r in rel_qs.values("id", "subject_id", "obj_id", "relation_type", "confidence", "evidence", "paper_id"):
        try:
            subj = Entity.objects.get(pk=r["subject_id"])
            obj = Entity.objects.get(pk=r["obj_id"])
        except Entity.DoesNotExist:
            continue
        s_id = subj.normalized or subj.text
        o_id = obj.normalized or obj.text
        G.add_edge(
            s_id, o_id,
            relation=r["relation_type"],
            confidence=r["confidence"],
            evidence=r["evidence"],
            paper_id=r["paper_id"],
        )

    # convert sets to lists for JSON serialization
    for n, d in G.nodes(data=True):
        d["papers"] = list(d.get("papers", []))

    if save_snapshot:
        snapshot = GraphSnapshot.objects.create(
            node_count=G.number_of_nodes(),
            edge_count=G.number_of_edges(),
            graph_json=graph_to_json(G),
            triggered_by=f"build_from_papers({len(paper_ids) if paper_ids else 'all'})",
        )
        log.info("Saved KG snapshot #%s: %dN / %dE", snapshot.id, snapshot.node_count, snapshot.edge_count)

    # Also aggregate into Material rows
    _sync_materials_from_graph(G)

    return G


def graph_to_json(G: nx.MultiDiGraph) -> dict:
    """Serialize graph to a JSON-friendly dict (for the template / API)."""
    nodes = []
    for n, d in G.nodes(data=True):
        nodes.append({
            "id": n,
            "label": d.get("label", n),
            "type": d.get("type", "MATERIAL"),
            "mention_count": d.get("mention_count", 1),
            "papers": d.get("papers", []),
        })
    edges = []
    for u, v, k, d in G.edges(data=True, keys=True):
        edges.append({
            "source": u, "target": v, "key": k,
            "relation": d.get("relation", "RELATED"),
            "confidence": d.get("confidence", 0.0),
            "paper_id": d.get("paper_id"),
        })
    return {"nodes": nodes, "edges": edges}


def query_neighbors(G: nx.MultiDiGraph, node: str, max_depth: int = 2) -> nx.MultiDiGraph:
    """Return the subgraph around `node` within max_depth hops."""
    if node not in G:
        return nx.MultiDiGraph()
    nodes = {node}
    frontier = {node}
    for _ in range(max_depth):
        next_frontier = set()
        for n in frontier:
            next_frontier.update(G.successors(n))
            next_frontier.update(G.predecessors(n))
        nodes.update(next_frontier)
        frontier = next_frontier
    return G.subgraph(nodes).copy()


def recommend_materials(G: nx.MultiDiGraph, target_property: str, top_k: int = 10) -> list[dict]:
    """Rank materials by how strongly they co-occur with `target_property`."""
    target = target_property.lower()
    # find nodes whose label mentions target_property
    property_nodes = [
        n for n, d in G.nodes(data=True)
        if d.get("type") in ("PROPERTY", "METRIC") and target in n.lower()
    ]
    scores: dict[str, float] = defaultdict(float)
    for pn in property_nodes:
        for material_node in G.predecessors(pn):
            for k, d in G.get_edge_data(material_node, pn).items():
                scores[material_node] += d.get("confidence", 0.5)
        for material_node in G.successors(pn):
            for k, d in G.get_edge_data(pn, material_node).items():
                scores[material_node] += d.get("confidence", 0.5)

    ranked = sorted(scores.items(), key=lambda x: -x[1])[:top_k]
    return [
        {
            "material": n,
            "label": G.nodes[n].get("label", n),
            "type": G.nodes[n].get("type"),
            "score": round(s, 3),
            "mention_count": G.nodes[n].get("mention_count", 0),
        }
        for n, s in ranked
    ]


def _sync_materials_from_graph(G: nx.MultiDiGraph):
    """Upsert Material rows for each MATERIAL/CHEMICAL_FORMULA node."""
    for n, d in G.nodes(data=True):
        if d.get("type") not in ("MATERIAL", "CHEMICAL_FORMULA"):
            continue
        name = d.get("label", n)
        if not name:
            continue
        try:
            with transaction.atomic():
                material, _ = Material.objects.update_or_create(
                    name=name,
                    defaults={
                        "formula": name,
                        "domain": "battery",
                    },
                )
                paper_ids = d.get("papers", [])
                if paper_ids:
                    papers = Paper.objects.filter(id__in=paper_ids)
                    material.mentioned_in.add(*papers)
        except Exception as e:
            log.warning("Failed to upsert Material %s: %s", name, e)


def get_latest_graph() -> nx.MultiDiGraph | None:
    """Return the latest persisted graph snapshot as a NetworkX graph."""
    snap = GraphSnapshot.objects.order_by("-created_at").first()
    if not snap:
        return None
    return json_to_graph(snap.graph_json)


def json_to_graph(data: dict) -> nx.MultiDiGraph:
    G = nx.MultiDiGraph()
    for n in data.get("nodes", []):
        G.add_node(n["id"], **{k: v for k, v in n.items() if k != "id"})
    for e in data.get("edges", []):
        G.add_edge(e["source"], e["target"], **{
            k: v for k, v in e.items() if k not in ("source", "target")
        })
    return G

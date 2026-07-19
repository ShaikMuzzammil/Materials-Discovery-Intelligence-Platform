"""Materials Project API client + caching layer.

API docs: https://api.materialsproject.org/
Requires MATERIALS_PROJECT_API_KEY in env.
"""
from __future__ import annotations
import logging
import requests
from django.conf import settings
from .models import MaterialRecord

log = logging.getLogger(__name__)
MP_BASE_URL = "https://api.materialsproject.org/materials"


def fetch_material_from_mp(formula_or_id: str) -> MaterialRecord | None:
    """Fetch material by formula or MP ID (e.g. 'LiFePO4' or 'mp-1101')."""
    api_key = settings.EXTERNAL_APIS.get("MATERIALS_PROJECT_API_KEY", "")
    if not api_key:
        log.warning("MATERIALS_PROJECT_API_KEY not set – cannot fetch from MP")
        return None

    headers = {"X-API-KEY": api_key}
    try:
        # search by formula
        url = f"{MP_BASE_URL}/search"
        params = {"formula": formula_or_id, "_limit": 5}
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        if resp.status_code != 200:
            log.warning("MP search returned %s: %s", resp.status_code, resp.text[:300])
            return None
        data = resp.json().get("data", [])
        if not data:
            return None
        return _persist_mp_material(data[0])
    except Exception as e:
        log.exception("MP fetch failed: %s", e)
        return None


def _persist_mp_material(payload: dict) -> MaterialRecord:
    """Convert MP API response into a MaterialRecord."""
    mp_id = payload.get("material_id", "")
    formula = payload.get("formula_pretty") or payload.get("formula_anonymous") or ""
    elements = payload.get("elements", [])
    props = payload.get("properties", {}) or {}

    record, _ = MaterialRecord.objects.update_or_create(
        source="materials_project", source_id=mp_id,
        defaults={
            "formula": payload.get("formula_anonymous") or formula,
            "formula_pretty": formula,
            "elements": elements,
            "structure": payload.get("structure", {}) or {},
            "band_gap": props.get("band_gap") or payload.get("band_gap"),
            "density": props.get("density") or payload.get("density"),
            "formation_energy_per_atom": props.get("formation_energy_per_atom") or payload.get("formation_energy_per_atom"),
            "is_stable": bool(payload.get("is_stable", False)),
            "theoretical_capacity": payload.get("theoretical_capacity"),
            "average_voltage": payload.get("average_voltage"),
            "energy_density": payload.get("energy_density"),
        },
    )
    return record


def compare_materials(formulas: list[str]) -> list[dict]:
    """Fetch / cache multiple materials and return comparison-ready dicts."""
    out: list[dict] = []
    for f in formulas:
        rec = MaterialRecord.objects.filter(formula_pretty__iexact=f).first()
        if not rec:
            rec = MaterialRecord.objects.filter(formula__iexact=f).first()
        if not rec:
            rec = fetch_material_from_mp(f)
        if rec:
            out.append({
                "formula": rec.formula_pretty or rec.formula,
                "mp_id": rec.source_id,
                "band_gap": rec.band_gap,
                "density": rec.density,
                "formation_energy": rec.formation_energy_per_atom,
                "theoretical_capacity": rec.theoretical_capacity,
                "average_voltage": rec.average_voltage,
                "energy_density": rec.energy_density,
                "is_stable": rec.is_stable,
                "elements": rec.elements,
            })
    return out

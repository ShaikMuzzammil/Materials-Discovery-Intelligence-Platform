"""Seed script – populates sample data: papers + battery materials CSV."""
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

import csv
import json
from pathlib import Path
from django.conf import settings
from backend.apps.papers.models import Paper
from backend.apps.extraction.models import Entity, Relation
from backend.apps.knowledge_graph.models import Material
from backend.apps.materials.models import MaterialRecord


SAMPLE_PAPERS = [
    {
        "title": "High-capacity Li-rich cathode Li1.2Mn0.6Ni0.2O2 with improved cycling stability via surface modification",
        "abstract": "Lithium-rich layered oxides (LLOs) such as Li1.2Mn0.6Ni0.2O2 are promising cathode materials for next-generation lithium-ion batteries due to their high specific capacity of over 250 mAh/g and energy density exceeding 900 Wh/kg. However, voltage decay and poor cycle life limit commercial application. In this work, we synthesize Li1.2Mn0.6Ni0.2O2 via co-precipitation method at 800°C and apply Al2O3 surface coating. XRD and XPS characterization confirm the layered structure. The modified cathode achieves a capacity retention of 92% after 200 cycles at 1C rate, with an average voltage of 3.5 V.",
        "source": "manual",
        "doi": "10.1016/j.jpowsour.2023.123456",
        "domains": ["battery", "cathode"],
        "keywords": ["Li-rich", "cathode", "surface modification", "cycle life"],
    },
    {
        "title": "Sol-gel synthesis of LiFePO4/C composite cathode with enhanced rate capability for lithium-ion batteries",
        "abstract": "LiFePO4 (LFP) is a widely used cathode material known for its excellent safety, long cycle life exceeding 2000 cycles, and low cost of approximately 15 USD/kg. However, its low theoretical capacity of 170 mAh/g and moderate energy density of 580 Wh/kg limit high-power applications. We report a sol-gel synthesis route at 700°C combined with in-situ carbon coating, achieving an electronic conductivity of 10^-2 S/cm. The resulting LiFePO4/C composite delivers a discharge capacity of 165 mAh/g at 0.1C and 130 mAh/g at 10C, demonstrating excellent rate capability.",
        "source": "manual",
        "doi": "10.1021/jacs.2023.078901",
        "domains": ["battery", "cathode"],
        "keywords": ["LiFePO4", "sol-gel", "rate capability", "carbon coating"],
    },
    {
        "title": "Si anode with PANI binder achieving 3000 mAh/g capacity and 500 cycle stability",
        "abstract": "Silicon anodes offer a theoretical capacity of 4200 mAh/g, more than 10x that of graphite. However, severe volume expansion (~300%) during lithiation leads to rapid capacity fade. We engineer a polyaniline (PANI) conducting polymer binder that accommodates volume changes while maintaining electronic contact. The Si-PANI anode achieves a reversible capacity of 3000 mAh/g at 0.5C with 80% capacity retention after 500 cycles. EIS measurements confirm stable SEI formation. The synthesis involves ball milling of nano-Si (50 nm) with PANI at room temperature, followed by slurry casting on copper current collector.",
        "source": "manual",
        "doi": "10.1038/nenergy.2023.045678",
        "domains": ["battery", "anode"],
        "keywords": ["silicon anode", "PANI binder", "cycle life", "volume expansion"],
    },
    {
        "title": "Solid-state electrolyte Li7La3Zr2O12 (LLZO) doped with Ta for dendrite suppression",
        "abstract": "Garnet-type Li7La3Zr2O12 (LLZO) is a leading solid-state electrolyte due to its high ionic conductivity of 10^-4 S/cm at room temperature and wide electrochemical stability window of 0-6V vs Li/Li+. Ta doping at the Zr site (Li6.4La3Zr1.4Ta0.6O12) increases ionic conductivity to 8×10^-4 S/cm. The synthesis employs solid-state reaction at 1100°C for 12 hours. Pellets sintered at 1180°C achieve 96% relative density. Galvanostatic cycling demonstrates stable plating/stripping for over 1000 hours at 0.5 mA/cm² without dendrite penetration, enabling safe lithium metal anodes.",
        "source": "manual",
        "doi": "10.1002/aenm.2023001234",
        "domains": ["battery", "solid-state", "electrolyte"],
        "keywords": ["LLZO", "solid-state", "Ta doping", "dendrite"],
    },
    {
        "title": "Na-ion battery cathode Na3V2(PO4)2F3 with 500 Wh/kg energy density for grid storage",
        "abstract": "Sodium-ion batteries are emerging as low-cost alternatives to Li-ion for stationary storage. NASICON-type Na3V2(PO4)2F3 (NVPF) cathode delivers a specific capacity of 128 mAh/g at an average voltage of 3.9 V, yielding an energy density of 500 Wh/kg. Hydrothermal synthesis at 180°C produces nanorod morphology with high surface area of 35 m²/g. CV measurements reveal two redox couples at 3.7V and 4.2V corresponding to V3+/V4+ transitions. The material retains 95% capacity after 1000 cycles at 5C rate, with cost estimated at 8 USD/kg, making it attractive for grid-scale applications.",
        "source": "manual",
        "doi": "10.1016/j.ensm.2023.103045",
        "domains": ["battery", "sodium-ion", "cathode"],
        "keywords": ["Na3V2(PO4)2F3", "sodium-ion", "grid storage", "NASICON"],
    },
    {
        "title": "MoS2/reduced graphene oxide composite anode for high-rate lithium storage",
        "abstract": "Molybdenum disulfide (MoS2) is a layered transition metal dichalcogenide with theoretical capacity of 670 mAh/g as a lithium-ion anode. We synthesize MoS2/reduced graphene oxide (rGO) composites via hydrothermal method at 200°C followed by thermal reduction at 500°C under Ar/H2 atmosphere. The composite delivers a reversible capacity of 1100 mAh/g at 0.1C and 600 mAh/g at 5C, attributed to synergistic lithium storage in MoS2 layers and rGO conductive network. TEM and Raman spectroscopy confirm few-layer MoS2 nanosheets anchored on rGO. The anode exhibits 88% capacity retention after 800 cycles at 2C rate.",
        "source": "manual",
        "doi": "10.1021/acs.nanolett.2023.045678",
        "domains": ["battery", "anode", "2D materials"],
        "keywords": ["MoS2", "graphene", "anode", "hydrothermal"],
    },
    {
        "title": "LiNi0.8Co0.1Mn0.1O2 (NCM811) cathode with Zr doping for enhanced thermal stability",
        "abstract": "Nickel-rich LiNi0.8Co0.1Mn0.1O2 (NCM811) is a high-energy cathode delivering 200 mAh/g at average voltage of 3.7V, yielding energy density of 740 Wh/kg. However, thermal runaway above 200°C and capacity fade limit safety. We introduce 2 mol% Zr doping via co-precipitation, which substitutes at the transition metal site and stabilizes the layered structure. DSC analysis shows exothermic peak shifted from 210°C to 250°C. The Zr-doped NCM811 retains 89% capacity after 500 cycles at 1C rate, compared to 72% for the undoped material. Synthesis at 750°C for 15h in oxygen atmosphere yields primary particle size of 200 nm.",
        "source": "manual",
        "doi": "10.1016/j.jpowsour.2023.234567",
        "domains": ["battery", "cathode"],
        "keywords": ["NCM811", "Zr doping", "thermal stability", "nickel-rich"],
    },
    {
        "title": "Lithium-sulfur battery with Co-N-C catalyst achieving 1200 Wh/kg cell energy density",
        "abstract": "Lithium-sulfur batteries promise theoretical energy density of 2600 Wh/kg based on sulfur cathode (1675 mAh/g) and lithium metal anode (3860 mAh/g). Practical cells suffer from polysulfide shuttling. We design a cobalt-nitrogen-doped carbon (Co-N-C) catalyst hosted in mesoporous carbon (KB) that chemically traps polysulfides. The Co-N-C/KB/S cathode delivers 1100 mAh/g at 0.2C and 700 mAh/g at 2C. Full cell with Li metal anode achieves 1200 Wh/kg at cell level. EIS confirms low charge transfer resistance of 25 Ω. Synthesis involves pyrolysis of Co-porphyrin precursor at 900°C under Ar atmosphere.",
        "source": "manual",
        "doi": "10.1038/s41560-023-01234-5",
        "domains": ["battery", "lithium-sulfur", "catalyst"],
        "keywords": ["Li-S", "Co-N-C", "polysulfide", "catalyst"],
    },
]


def seed_papers():
    print("Seeding sample papers...")
    for p in SAMPLE_PAPERS:
        paper, created = Paper.objects.update_or_create(
            doi=p["doi"],
            defaults={
                "title": p["title"],
                "abstract": p["abstract"],
                "source": p["source"],
                "domains": p["domains"],
                "keywords": p["keywords"],
                "status": "fetched",
            },
        )
        print(f"  {'created' if created else 'updated'} paper #{paper.id}: {paper.title[:60]}...")
    print(f"Total papers: {Paper.objects.count()}")


def seed_battery_csv():
    """Generate the battery materials sample dataset CSV if missing."""
    csv_path = Path(settings.ML_SETTINGS["DATA_DIR"]) / "battery_materials_sample.csv"
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    if csv_path.exists():
        print(f"CSV already exists: {csv_path}")
        return

    rows = [
        # formula, synthesis_method, synthesis_temp_c, capacity_mah_g, cycle_life, voltage_v, energy_density_wh_kg, safety_score, cost_usd_kg
        ("LiFePO4", "sol-gel", 700, 165, 2000, 3.45, 580, 0.95, 15),
        ("LiFePO4", "solid-state", 750, 160, 1800, 3.4, 550, 0.95, 16),
        ("LiFePO4", "hydrothermal", 200, 150, 1500, 3.4, 520, 0.93, 18),
        ("LiCoO2", "solid-state", 850, 140, 800, 3.9, 560, 0.65, 45),
        ("LiCoO2", "co-precipitation", 800, 145, 1000, 3.9, 580, 0.65, 42),
        ("LiMn2O4", "sol-gel", 600, 120, 1200, 4.0, 480, 0.85, 12),
        ("LiMn2O4", "solid-state", 700, 110, 1000, 4.0, 440, 0.85, 13),
        ("LiNi0.8Co0.1Mn0.1O2", "co-precipitation", 750, 200, 500, 3.7, 740, 0.7, 35),
        ("LiNi0.8Co0.1Mn0.1O2", "sol-gel", 770, 195, 600, 3.7, 720, 0.7, 38),
        ("LiNi0.6Co0.2Mn0.2O2", "co-precipitation", 780, 175, 1000, 3.7, 650, 0.78, 30),
        ("LiNi0.5Co0.2Mn0.3O2", "co-precipitation", 800, 165, 1500, 3.7, 610, 0.82, 28),
        ("Li1.2Mn0.6Ni0.2O2", "co-precipitation", 800, 250, 200, 3.5, 875, 0.6, 40),
        ("Li1.2Mn0.6Ni0.2O2", "sol-gel", 820, 240, 250, 3.5, 840, 0.6, 42),
        ("Li4Ti5O12", "solid-state", 850, 175, 3000, 1.5, 260, 0.98, 20),
        ("Li4Ti5O12", "sol-gel", 800, 170, 5000, 1.5, 250, 0.98, 22),
        ("Si", "ball-milling", 25, 3000, 500, 0.4, 1200, 0.6, 25),
        ("Si-C composite", "ball-milling", 600, 1500, 800, 0.5, 750, 0.7, 30),
        ("Graphite", "solid-state", 3000, 372, 2000, 0.15, 56, 0.9, 8),
        ("Hard carbon", "pyrolysis", 1200, 300, 1500, 0.2, 60, 0.9, 10),
        ("Li metal", "evaporation", 25, 3860, 200, 0.0, 0, 0.4, 80),
        ("SnO2", "hydrothermal", 180, 780, 300, 0.6, 470, 0.65, 35),
        ("MoS2", "hydrothermal", 200, 900, 600, 0.7, 630, 0.7, 50),
        ("MoS2-rGO", "hydrothermal", 500, 1100, 800, 0.7, 770, 0.75, 60),
        ("PANI-S", "in-situ polymerization", 150, 1100, 400, 2.1, 2310, 0.7, 45),
        ("S-KB", "ball-milling", 155, 1000, 300, 2.1, 2100, 0.7, 18),
        ("Co-N-C/S", "pyrolysis", 900, 1100, 500, 2.1, 2310, 0.7, 55),
        ("Na3V2(PO4)2F3", "hydrothermal", 180, 128, 1000, 3.9, 500, 0.85, 8),
        ("Na3V2(PO4)3", "sol-gel", 700, 110, 1500, 3.4, 374, 0.88, 7),
        ("Na0.7Fe0.4Mn0.6O2", "solid-state", 800, 120, 600, 3.0, 360, 0.75, 6),
        ("Hard carbon (Na)", "pyrolysis", 1300, 280, 1200, 0.2, 56, 0.9, 10),
        ("Li7La3Zr2O12", "solid-state", 1100, 0, 0, 0, 0, 0.95, 80),
        ("Li6.4La3Zr1.4Ta0.6O12", "solid-state", 1180, 0, 0, 0, 0, 0.95, 90),
        ("Li2S-P2S5 glass", "ball-milling", 25, 0, 0, 0, 0, 0.85, 100),
        ("Li3InCl6", "mechanochemical", 25, 0, 0, 0, 0, 0.8, 200),
        ("LiTi2(PO4)3", "sol-gel", 700, 130, 2000, 2.5, 325, 0.92, 15),
        ("V2O5", "hydrothermal", 180, 280, 400, 2.6, 728, 0.7, 40),
        ("V2O5-rGO", "hydrothermal", 500, 320, 600, 2.6, 832, 0.75, 55),
        ("LiV3O8", "solid-state", 580, 280, 500, 2.5, 700, 0.78, 38),
        ("TiO2 (anatase)", "hydrothermal", 180, 200, 1000, 1.8, 360, 0.9, 12),
        ("TiO2 (B)", "hydrothermal", 200, 230, 1500, 1.8, 414, 0.92, 14),
    ]
    with open(csv_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow([
            "formula", "synthesis_method", "synthesis_temp_c",
            "capacity_mah_g", "cycle_life", "voltage_v",
            "energy_density_wh_kg", "safety_score", "cost_usd_kg",
        ])
        w.writerows(rows)
    print(f"Wrote {len(rows)} rows to {csv_path}")


def seed_material_records():
    """Seed MaterialRecord rows for the most common cathode/anode materials."""
    print("Seeding MaterialRecord rows...")
    common = [
        ("LiFePO4", "Lithium Iron Phosphate", 3.45, 170, 580, True),
        ("LiCoO2", "Lithium Cobalt Oxide", 3.9, 140, 560, True),
        ("LiMn2O4", "Lithium Manganese Oxide", 4.0, 120, 480, True),
        ("LiNi0.8Co0.1Mn0.1O2", "NCM 811", 3.7, 200, 740, True),
        ("Li4Ti5O12", "Lithium Titanate", 1.5, 175, 260, True),
        ("Graphite", "Graphite anode", 0.15, 372, 56, True),
    ]
    for formula, pretty, voltage, capacity, edensity, stable in common:
        rec, created = MaterialRecord.objects.update_or_create(
            source="manual", source_id=formula,
            defaults={
                "formula": formula, "formula_pretty": pretty,
                "average_voltage": voltage, "theoretical_capacity": capacity,
                "energy_density": edensity, "is_stable": stable,
            },
        )
        if created:
            print(f"  created: {rec}")


if __name__ == "__main__":
    seed_papers()
    seed_battery_csv()
    seed_material_records()
    print("\nSeed complete. Next steps:")
    print("  1. python manage.py extract_all  # extract entities from seeded papers")
    print("  2. python manage.py build_kg     # build knowledge graph")
    print("  3. python -m ml.models.train_property_predictor  # train ML models")

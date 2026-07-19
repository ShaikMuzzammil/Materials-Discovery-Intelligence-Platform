"""Generate sample datasets for all 7 material domains.

Run: python scripts/generate_all_datasets.py
Or:  python manage.py generate_datasets
"""
import csv
import os
import sys
from pathlib import Path

# Allow running standalone
if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# ------------------------------------------------------------------
# Battery (already exists – regenerate to extend to 80 rows)
# ------------------------------------------------------------------
BATTERY_DATA = [
    # (formula, synthesis_method, synthesis_temp_c, capacity_mah_g, cycle_life, voltage_v, energy_density_wh_kg, safety_score, cost_usd_kg)
    ("LiFePO4", "sol-gel", 700, 165, 2000, 3.45, 580, 0.95, 15),
    ("LiFePO4", "solid-state", 750, 160, 1800, 3.4, 550, 0.95, 16),
    ("LiFePO4", "hydrothermal", 200, 150, 1500, 3.4, 520, 0.93, 18),
    ("LiFePO4", "co-precipitation", 700, 162, 2200, 3.45, 570, 0.95, 17),
    ("LiCoO2", "solid-state", 850, 140, 800, 3.9, 560, 0.65, 45),
    ("LiCoO2", "co-precipitation", 800, 145, 1000, 3.9, 580, 0.65, 42),
    ("LiCoO2", "sol-gel", 800, 142, 900, 3.9, 565, 0.65, 44),
    ("LiMn2O4", "sol-gel", 600, 120, 1200, 4.0, 480, 0.85, 12),
    ("LiMn2O4", "solid-state", 700, 110, 1000, 4.0, 440, 0.85, 13),
    ("LiMn2O4", "hydrothermal", 180, 115, 1300, 4.0, 460, 0.86, 14),
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
    ("Si-C composite", "pyrolysis", 900, 1600, 1000, 0.5, 800, 0.72, 32),
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
    ("NaTi2(PO4)3", "sol-gel", 700, 130, 2000, 2.5, 325, 0.92, 15),
    ("V2O5", "hydrothermal", 180, 280, 400, 2.6, 728, 0.7, 40),
    ("V2O5-rGO", "hydrothermal", 500, 320, 600, 2.6, 832, 0.75, 55),
    ("LiV3O8", "solid-state", 580, 280, 500, 2.5, 700, 0.78, 38),
    ("TiO2 (anatase)", "hydrothermal", 180, 200, 1000, 1.8, 360, 0.9, 12),
    ("TiO2 (B)", "hydrothermal", 200, 230, 1500, 1.8, 414, 0.92, 14),
    ("Li7La3Zr2O12", "solid-state", 1100, 0, 0, 0, 0, 0.95, 80),
    ("Li6.4La3Zr1.4Ta0.6O12", "solid-state", 1180, 0, 0, 0, 0, 0.95, 90),
    ("Li2S-P2S5 glass", "ball-milling", 25, 0, 0, 0, 0, 0.85, 100),
    ("Li3InCl6", "mechanochemical", 25, 0, 0, 0, 0, 0.8, 200),
    ("LiFePO4-C", "sol-gel", 700, 168, 2500, 3.45, 590, 0.95, 18),
    ("LiFePO4-CNT", "sol-gel", 700, 170, 2800, 3.45, 600, 0.95, 22),
    ("LiCoO2-Al2O3", "solid-state", 850, 148, 1200, 3.9, 590, 0.7, 47),
    ("NCM811-Zr", "co-precipitation", 750, 205, 800, 3.7, 760, 0.75, 38),
    ("NCM622-Zr", "co-precipitation", 780, 180, 1200, 3.7, 670, 0.8, 32),
    ("Li-rich-LLO-Al2O3", "co-precipitation", 800, 255, 300, 3.5, 890, 0.65, 42),
    ("LiMn2O4-LiBOB", "sol-gel", 600, 125, 1500, 4.0, 500, 0.88, 14),
    ("Li2MnO3", "solid-state", 900, 230, 150, 3.4, 780, 0.55, 35),
    ("Li2MoO4", "solid-state", 600, 200, 250, 2.5, 500, 0.7, 30),
    ("Li2CuO2", "solid-state", 750, 180, 200, 2.8, 505, 0.6, 28),
    ("Li2NiO2", "solid-state", 700, 200, 300, 3.0, 600, 0.55, 32),
    ("LiFeSO4F", "ionothermal", 350, 140, 800, 3.6, 505, 0.85, 25),
    ("Li2FeSiO4", "sol-gel", 700, 165, 600, 3.1, 510, 0.88, 18),
    ("Li2MnSiO4", "sol-gel", 700, 150, 400, 3.2, 480, 0.85, 16),
    ("Li2CoSiO4", "sol-gel", 750, 140, 350, 3.3, 460, 0.7, 22),
    ("K2FeSO4F", "solid-state", 400, 130, 700, 3.6, 470, 0.85, 20),
    ("Na2FeSO4F", "ionothermal", 350, 125, 750, 3.5, 440, 0.85, 18),
    ("LiFeBO3", "solid-state", 600, 180, 500, 3.0, 540, 0.85, 22),
    ("LiMnBO3", "solid-state", 650, 160, 400, 3.1, 500, 0.85, 20),
    ("LiCoBO3", "solid-state", 700, 150, 350, 3.2, 480, 0.7, 25),
    ("LiVS2", "solid-state", 600, 250, 300, 2.0, 500, 0.7, 35),
    ("LiCrS2", "solid-state", 650, 200, 250, 2.2, 440, 0.65, 40),
    ("LiTiS2", "solid-state", 600, 230, 400, 2.1, 480, 0.85, 28),
    ("LiNiS2", "solid-state", 650, 220, 300, 2.0, 440, 0.55, 30),
    ("Li2SnO3", "solid-state", 800, 250, 200, 1.5, 375, 0.7, 35),
    ("Li2PbO3", "solid-state", 700, 180, 150, 2.5, 450, 0.5, 50),
    ("Li2RuO3", "solid-state", 900, 250, 200, 3.0, 750, 0.7, 200),
    ("Li2IrO3", "solid-state", 1000, 220, 250, 3.2, 700, 0.7, 500),
    ("MoO3", "hydrothermal", 200, 280, 350, 2.5, 700, 0.7, 35),
    ("WO3", "hydrothermal", 200, 200, 400, 2.0, 400, 0.75, 38),
    ("Fe2O3", "hydrothermal", 200, 250, 300, 1.8, 450, 0.85, 8),
    ("Fe3O4", "hydrothermal", 200, 280, 350, 1.5, 420, 0.85, 10),
    ("Co3O4", "hydrothermal", 200, 320, 400, 2.0, 640, 0.7, 45),
    ("NiO", "hydrothermal", 200, 250, 350, 1.8, 450, 0.7, 25),
    ("CuO", "hydrothermal", 200, 280, 300, 1.8, 500, 0.7, 18),
    ("ZnO", "hydrothermal", 200, 250, 300, 1.5, 375, 0.85, 12),
    ("MnO2", "hydrothermal", 180, 300, 400, 2.0, 600, 0.8, 15),
    ("Mn2O3", "solid-state", 600, 220, 300, 1.8, 400, 0.8, 12),
    ("CoS2", "hydrothermal", 200, 400, 500, 1.5, 600, 0.7, 35),
    ("NiS2", "hydrothermal", 200, 350, 400, 1.5, 525, 0.7, 25),
    ("FeS2", "hydrothermal", 200, 380, 450, 1.5, 570, 0.8, 10),
]


def write_battery_csv(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    p = out_dir / "battery_sample.csv"
    with open(p, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["formula", "synthesis_method", "synthesis_temp_c",
                    "capacity_mah_g", "cycle_life", "voltage_v",
                    "energy_density_wh_kg", "safety_score", "cost_usd_kg"])
        w.writerows(BATTERY_DATA)
    print(f"  battery: {len(BATTERY_DATA)} rows → {p}")


# ------------------------------------------------------------------
# Alloys
# ------------------------------------------------------------------
ALLOY_DATA = [
    # (formula, processing_method, heat_treatment_temp_c, yield_strength_mpa, tensile_strength_mpa, elongation_pct, hardness_hv, youngs_modulus_gpa, density_g_cm3)
    ("Fe-0.2C-1.5Mn", "hot-rolled", 900, 350, 500, 25, 160, 210, 7.85),
    ("Fe-0.4C-1.5Mn", "hot-rolled", 900, 450, 650, 20, 200, 210, 7.85),
    ("Fe-0.6C-1.5Mn", "hot-rolled", 900, 550, 800, 15, 240, 210, 7.85),
    ("Fe-0.8C-1.5Mn", "hot-rolled", 900, 650, 950, 10, 280, 210, 7.85),
    ("Fe-0.2C-1.5Mn", "quenched", 850, 600, 850, 12, 250, 210, 7.85),
    ("Fe-0.4C-1.5Mn", "quenched", 850, 800, 1100, 8, 320, 210, 7.85),
    ("Fe-0.6C-1.5Mn", "quenched", 850, 950, 1300, 5, 380, 210, 7.85),
    ("Fe-0.2C-1.5Mn", "tempered", 600, 500, 700, 18, 220, 210, 7.85),
    ("Fe-0.4C-1.5Mn", "tempered", 600, 700, 950, 12, 290, 210, 7.85),
    ("Fe-18Cr-8Ni", "annealed", 1050, 250, 600, 50, 180, 193, 8.0),
    ("Fe-18Cr-8Ni", "cold-worked", 25, 600, 850, 25, 280, 193, 8.0),
    ("Fe-18Cr-12Ni-2.5Mo", "annealed", 1050, 270, 620, 55, 190, 193, 8.0),
    ("Fe-25Cr-20Ni", "annealed", 1100, 280, 650, 50, 200, 200, 7.95),
    ("Fe-12Cr-1Mo-0.25V", "tempered", 650, 550, 750, 18, 240, 215, 7.85),
    ("Fe-12Cr-2W-0.25V", "tempered", 650, 650, 850, 15, 280, 218, 7.85),
    ("Fe-9Cr-1Mo", "tempered", 700, 450, 620, 22, 200, 215, 7.85),
    ("Fe-22Cr-5Ni-3Mo", "annealed", 1050, 480, 720, 25, 270, 200, 7.8),
    ("Fe-25Cr-7Ni-4Mo", "annealed", 1100, 550, 800, 25, 290, 200, 7.8),
    ("Ti-6Al-4V", "annealed", 750, 880, 950, 14, 350, 114, 4.43),
    ("Ti-6Al-4V", "forged", 950, 950, 1050, 12, 380, 114, 4.43),
    ("Ti-6Al-4V", "STA", 550, 1100, 1200, 10, 400, 114, 4.43),
    ("Ti-5Al-2.5Sn", "annealed", 750, 800, 900, 15, 330, 110, 4.48),
    ("Ti-6Al-6V-2Sn", "STA", 550, 1200, 1300, 8, 410, 114, 4.43),
    ("Ti-13V-11Cr-3Al", "STA", 480, 1100, 1250, 8, 400, 110, 4.85),
    ("Al-4.5Cu", "T6", 530, 320, 470, 12, 130, 72, 2.78),
    ("Al-4.5Cu", "T4", 530, 200, 350, 22, 90, 72, 2.78),
    ("Al-5.6Zn-2.5Mg-1.6Cu", "T6", 470, 510, 580, 11, 175, 72, 2.82),
    ("Al-5.6Zn-2.5Mg-1.6Cu", "T73", 470, 460, 525, 13, 155, 72, 2.82),
    ("Al-4.4Cu-1.5Mg-0.6Mn", "T6", 510, 380, 480, 13, 145, 72, 2.78),
    ("Al-2.5Mg-0.4Cr", "H34", 25, 180, 250, 12, 65, 70, 2.68),
    ("Al-10Si-0.4Mg", "T6", 530, 250, 320, 5, 100, 75, 2.67),
    ("Al-7Si-0.3Mg", "T6", 530, 230, 300, 5, 90, 75, 2.69),
    ("Mg-6Al-1Zn", "as-cast", 25, 100, 200, 6, 55, 45, 1.81),
    ("Mg-6Al-1Zn", "T6", 200, 180, 270, 5, 65, 45, 1.81),
    ("Mg-3Al-1Zn", "extruded", 25, 180, 250, 12, 55, 45, 1.78),
    ("Mg-6Zn-0.5Zr", "T5", 200, 200, 280, 8, 65, 45, 1.83),
    ("Mg-2Zn-1Mn", "extruded", 25, 170, 230, 14, 50, 45, 1.77),
    ("Ni-20Cr-2.5Ti-1.5Al", "STA", 760, 800, 1200, 18, 350, 220, 8.2),
    ("Ni-20Cr-2.5Ti-1.5Al", "annealed", 1080, 350, 850, 45, 200, 220, 8.2),
    ("Ni-19Cr-18Co-3Mo-5Al-3Ti", "STA", 760, 1050, 1350, 15, 400, 220, 8.25),
    ("Ni-19Cr-18Co-3Mo-5Al-3Ti", "STA", 850, 1100, 1400, 12, 420, 220, 8.25),
    ("Ni-15Cr-8Co-3Mo-5Al-3Ti", "STA", 760, 1000, 1300, 16, 380, 220, 8.2),
    ("Ni-22Cr-12.5Co-9Mo-2Nb", "STA", 720, 950, 1250, 18, 360, 220, 8.22),
    ("Cu-30Zn", "annealed", 600, 110, 380, 50, 70, 110, 8.53),
    ("Cu-30Zn", "cold-worked", 25, 380, 530, 12, 160, 110, 8.53),
    ("Cu-10Sn", "annealed", 600, 180, 420, 50, 80, 110, 8.78),
    ("Cu-2Be", "STA", 320, 1100, 1300, 5, 380, 130, 8.25),
    ("Cu-2Be", "annealed", 800, 250, 480, 35, 90, 130, 8.25),
    ("Fe-3Si", "annealed", 900, 350, 480, 25, 150, 200, 7.65),
    ("Fe-3Si-0.5Al", "annealed", 900, 360, 490, 24, 155, 200, 7.65),
    ("Fe-0.5Ni-0.5Cr-0.2Mo", "tempered", 600, 580, 720, 22, 220, 210, 7.85),
    ("Fe-1.0Ni-1.0Cr-0.4Mo", "tempered", 600, 700, 880, 18, 270, 210, 7.85),
    ("Fe-1.5Ni-1.5Cr-0.5Mo", "tempered", 600, 850, 1050, 14, 320, 210, 7.85),
    ("Fe-3Ni-1Cr-0.4Mo", "tempered", 600, 950, 1150, 12, 360, 210, 7.85),
    ("Fe-3Ni-1.5Cr-0.5Mo-0.1V", "tempered", 600, 1100, 1300, 10, 400, 210, 7.85),
    ("Co-20Cr-15W-10Ni", "as-cast", 25, 550, 950, 8, 320, 230, 9.13),
    ("Co-20Cr-15W-10Ni", "STA", 750, 700, 1100, 6, 380, 230, 9.13),
    ("Ti-15V-3Cr-3Al-3Sn", "STA", 510, 1100, 1250, 8, 390, 100, 4.78),
    ("Ti-15Mo-3Nb-3Al-0.2Si", "annealed", 750, 950, 1020, 14, 320, 95, 4.97),
    ("Ti-3Al-8V-6Cr-4Mo-4Zr", "STA", 540, 1300, 1450, 6, 440, 100, 4.79),
    ("Al-2Li-2Cu-0.5Mg", "T6", 510, 380, 470, 6, 130, 78, 2.65),
    ("Al-2Li-2Cu-0.5Mg", "T8", 180, 480, 540, 5, 150, 78, 2.65),
    ("Al-3Li-1Cu-0.5Mg-0.5Zr", "T6", 510, 420, 500, 5, 140, 80, 2.55),
    ("Mg-1.5Zn-0.5Zr-0.4RE", "T5", 200, 230, 300, 10, 65, 45, 1.83),
    ("Mg-2Nd-0.5Zn-0.5Zr", "T6", 200, 250, 320, 8, 75, 45, 1.83),
    ("Mg-3Y-2RE-0.5Zr", "T5", 250, 260, 320, 8, 70, 45, 1.83),
    ("Mg-5Y-3RE-0.5Zr", "T5", 250, 280, 340, 7, 75, 45, 1.84),
    ("Fe-23Mn-0.6C", "TWIP", 25, 480, 950, 55, 250, 200, 7.85),
    ("Fe-25Mn-3Al-3Si", "TWIP", 25, 450, 900, 60, 230, 200, 7.7),
    ("Fe-18Mn-0.6C-2Al", "TWIP", 25, 500, 1000, 50, 260, 200, 7.8),
    ("Fe-12Cr-10Ni-2Mo", "annealed", 1050, 280, 620, 50, 195, 200, 7.95),
    ("Fe-20Cr-25Ni", "annealed", 1100, 300, 650, 48, 200, 200, 8.0),
    ("Fe-30Cr-30Ni", "annealed", 1100, 320, 680, 45, 210, 200, 8.05),
    ("Ni-30Cu-3Fe", "annealed", 950, 250, 580, 45, 140, 180, 8.83),
    ("Ni-30Cu-3Fe", "cold-worked", 25, 580, 720, 18, 200, 180, 8.83),
    ("Ni-30Cr-3Fe", "annealed", 1050, 270, 640, 48, 170, 200, 8.18),
    ("Cu-5Al-2Sn", "annealed", 600, 200, 460, 45, 95, 110, 8.65),
    ("Cu-5Al-2Sn", "cold-worked", 25, 450, 600, 18, 170, 110, 8.65),
    ("Fe-0.1C-2.0Mn-0.5Si", "TMCP", 25, 420, 520, 25, 180, 210, 7.85),
    ("Fe-0.05C-1.8Mn-0.4Si", "TMCP", 25, 380, 480, 28, 165, 210, 7.85),
    ("Fe-0.05C-1.5Mn-0.3Nb", "TMCP", 25, 450, 550, 24, 195, 210, 7.85),
    ("Fe-0.06C-1.6Mn-0.3Mo", "TMCP", 25, 500, 620, 22, 220, 210, 7.85),
]


def write_alloy_csv(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    p = out_dir / "alloys_sample.csv"
    with open(p, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["formula", "processing_method", "heat_treatment_temp_c",
                    "yield_strength_mpa", "tensile_strength_mpa", "elongation_pct",
                    "hardness_hv", "youngs_modulus_gpa", "density_g_cm3"])
        w.writerows(ALLOY_DATA)
    print(f"  alloys: {len(ALLOY_DATA)} rows → {p}")


# ------------------------------------------------------------------
# Polymers
# ------------------------------------------------------------------
POLYMER_DATA = [
    # (smiles, polymer_type, molecular_weight, glass_transition_c, melting_temp_c, tensile_strength_mpa, elongation_pct, density_g_cm3, youngs_modulus_gpa)
    ("*CC*", "PE-LD", 200000, -110, 115, 12, 500, 0.92, 0.3),
    ("*CC*", "PE-HD", 500000, -110, 135, 28, 800, 0.95, 1.0),
    ("*CC*", "PE-UHMW", 5000000, -110, 138, 35, 350, 0.94, 1.1),
    ("*C(C)C*", "PP", 300000, -10, 165, 35, 400, 0.91, 1.5),
    ("*CC(=O)O*", "PVA", 100000, 70, 230, 50, 200, 1.29, 2.0),
    ("*CC(=O)OC*", "PMMA", 120000, 105, 0, 65, 5, 1.18, 3.0),
    ("*CClCCl*", "PVC-rigid", 80000, 80, 180, 55, 60, 1.40, 3.2),
    ("*CClCCl*", "PVC-flex", 80000, 0, 0, 18, 350, 1.30, 0.5),
    ("*C(Cc1ccccc1)*", "PS", 250000, 100, 0, 45, 3, 1.05, 3.2),
    ("*OCCOCC(=O)C*", "PET", 30000, 75, 255, 55, 100, 1.38, 2.8),
    ("*OCCOCC(=O)C*", "PET-bottle", 30000, 75, 250, 60, 50, 1.40, 3.5),
    ("*OC(CO)COCC(=O)C*", "PC", 28000, 145, 0, 65, 110, 1.20, 2.4),
    ("*OCC(=O)OCC(=O)CO*", "PLA", 100000, 60, 180, 60, 8, 1.24, 3.5),
    ("*OC(C)C(=O)O*", "PLA-PLLA", 100000, 65, 180, 70, 5, 1.25, 3.7),
    ("*OCC(=O)OC*", "PGA", 50000, 38, 228, 80, 20, 1.53, 6.5),
    ("*OC(CH3)C(=O)O*", "PCL", 50000, -65, 60, 25, 700, 1.14, 0.4),
    ("*OCCOCC(=O)C*", "PBT", 35000, 45, 225, 50, 80, 1.31, 2.5),
    ("*OC(C)C(=O)O*", "PHB", 100000, 5, 175, 40, 5, 1.25, 3.5),
    ("*OC(C)C(=O)O*", "PHBV", 100000, 0, 145, 30, 15, 1.23, 1.5),
    ("*CC(C)C(C)*", "PIB", 200000, -70, 0, 2, 800, 0.92, 0.05),
    ("*OCC(=O)NH*", "Nylon-6", 25000, 50, 220, 75, 200, 1.13, 2.0),
    ("*OCC(=O)NH*", "Nylon-66", 30000, 55, 265, 80, 100, 1.14, 2.5),
    ("*OCC(=O)NH*", "Nylon-12", 30000, 42, 178, 50, 300, 1.02, 1.5),
    ("*OCC(=O)NH*", "Nylon-612", 30000, 46, 215, 55, 250, 1.07, 1.8),
    ("*Cc1ccccc1*", "PET-amorph", 30000, 75, 0, 55, 200, 1.33, 2.0),
    ("*CC(=O)Cc1ccccc1*", "PEEK", 40000, 145, 343, 100, 50, 1.30, 3.6),
    ("*OC(C)Cc1ccccc1*", "PES", 35000, 225, 0, 85, 60, 1.37, 2.6),
    ("*OC(C)C(=O)c1ccccc1*", "PEI", 30000, 215, 0, 105, 60, 1.27, 3.0),
    ("*Cc1ccc(cc1)C*", "PPS", 35000, 90, 285, 70, 5, 1.34, 3.5),
    ("*CC(=O)C=C*", "PI-Kapton", 50000, 360, 0, 170, 70, 1.42, 2.5),
    ("*OC(C)C(=O)NC*", "TPU", 100000, -50, 0, 35, 500, 1.20, 0.05),
    ("*CC(=O)NC*", "PU-foam", 50000, -40, 0, 0.2, 100, 0.04, 0.001),
    ("*C=C*", "BR", 200000, -95, 0, 18, 500, 0.94, 1.5),
    ("*CC(=C)CC*", "IR", 200000, -70, 0, 25, 800, 0.92, 1.5),
    ("*CClC=CCl*", "CR", 150000, -45, 0, 20, 400, 1.23, 1.5),
    ("*CC(=O)C(C)=C*", "SBR", 200000, -50, 0, 22, 500, 0.94, 2.0),
    ("*C(F)(F)C(F)(F)*", "PTFE", 500000, -110, 327, 25, 350, 2.20, 0.5),
    ("*C(F)(F)C(F)(F)*", "FEP", 200000, -110, 260, 22, 300, 2.15, 0.5),
    ("*C(Cl)(F)C(Cl)(F)*", "PCTFE", 200000, 45, 210, 38, 150, 2.13, 1.5),
    ("*C(F)(F)C(OC(F)(F)F)*", "ETFE", 200000, -120, 270, 45, 400, 1.70, 1.5),
    ("*CC(=O)O*", "PVAc", 100000, 30, 0, 35, 10, 1.19, 0.6),
    ("*CCl*", "PVDC", 100000, -18, 195, 40, 60, 1.78, 1.3),
    ("*CC(F)(F)*", "PVDF", 200000, -40, 170, 50, 50, 1.78, 2.0),
    ("*C(F)(F)C(F)(F)*", "ECTFE", 150000, -120, 240, 50, 250, 1.68, 1.7),
    ("*OCCOCC(=O)C*", "PETG", 30000, 80, 0, 30, 100, 1.27, 1.6),
    ("*OC(C)C(=O)O*", "PLA-blend", 100000, 55, 165, 50, 20, 1.24, 2.8),
    ("*OC(C)C(=O)O*", "PGA-blend", 50000, 50, 220, 60, 15, 1.40, 4.5),
    ("*CC(=O)C=C*", "PMA", 100000, 10, 0, 10, 600, 1.18, 0.3),
    ("*CC(=O)OC*", "PBA", 100000, -50, 0, 5, 800, 1.08, 0.2),
    ("*CC(=O)OCCOCC(=O)C*", "PBS", 50000, -32, 115, 35, 300, 1.26, 0.5),
    ("*CC(=O)OCC*", "PVB", 70000, 70, 0, 25, 100, 1.11, 0.5),
    ("*OC(COCC(=O)C)C*", "Epoxy", 5000, 150, 0, 75, 5, 1.20, 3.0),
    ("*OC(COCC(=O)C)C*", "Epoxy-tough", 5000, 130, 0, 55, 12, 1.18, 2.5),
    ("*OC(COCC(=O)C)C*", "Phenolic", 5000, 180, 0, 45, 1, 1.32, 4.5),
    ("*Cc1ccccc1Cc1ccccc1*", "Polyester-UP", 5000, 90, 0, 50, 2, 1.22, 3.2),
    ("*CC(=O)NCC*", "Polyimide", 30000, 280, 0, 110, 5, 1.42, 2.8),
    ("*OCC(=O)NC*", "Polyamideimide", 25000, 275, 0, 95, 8, 1.40, 2.8),
    ("*OC(C)C(=O)O*", "Polyethersulfone", 35000, 220, 0, 80, 60, 1.37, 2.6),
    ("*OC(C)C(=O)O*", "Polysulfone", 30000, 190, 0, 70, 80, 1.24, 2.5),
    ("*OCCOCC(=O)C*", "Liquid-crystal", 30000, 110, 280, 200, 4, 1.40, 9.0),
    ("*CC(=O)OC*", "Acrylic-cast", 120000, 105, 0, 70, 4, 1.19, 3.2),
    ("*CC(=O)OC*", "Acrylic-extruded", 120000, 105, 0, 65, 6, 1.19, 3.0),
    ("*OC(C)C(=O)O*", "LCP-Vectra", 30000, 110, 280, 200, 4, 1.40, 9.0),
    ("*CC(=O)O*", "EVA-15", 80000, -25, 85, 18, 700, 0.95, 0.05),
    ("*CC(=O)O*", "EVA-28", 80000, -45, 65, 22, 800, 0.95, 0.04),
    ("*CC(=O)O*", "Ionomer", 80000, 50, 95, 25, 400, 0.94, 0.3),
    ("*C(C)C(C)C(C)*", "Syndiotactic-PP", 200000, -5, 165, 35, 100, 0.90, 1.3),
    ("*OCC(=O)O*", "Biodegradable", 50000, 45, 145, 30, 200, 1.22, 1.2),
    ("*OC(C)C(=O)O*", "Stereo-PLA", 100000, 60, 180, 60, 8, 1.24, 3.5),
    ("*OC(C)C(=O)O*", "Racemic-PLA", 100000, 55, 0, 35, 5, 1.25, 2.0),
    ("*OC(C)C(=O)O*", "TMC-PLA", 100000, 45, 145, 30, 200, 1.20, 1.0),
    ("*OCC(=O)NC*", "Biobased-PA", 30000, 60, 220, 70, 200, 1.13, 2.0),
    ("*OC(C)C(=O)O*", "Bio-PE", 200000, -110, 130, 25, 600, 0.95, 0.9),
    ("*OC(C)C(=O)O*", "Bio-PET", 30000, 75, 250, 55, 100, 1.38, 2.8),
    ("*OC(C)C(=O)O*", "Bio-PTT", 30000, 55, 228, 50, 150, 1.33, 2.5),
    ("*OC(C)C(=O)O*", "Bio-PA56", 30000, 55, 220, 65, 200, 1.14, 1.9),
    ("*OCCOCC(=O)C*", "Recycled-PET", 30000, 75, 250, 50, 80, 1.38, 2.5),
    ("*C(C)C(C)C(C)*", "Recycled-PP", 200000, -10, 165, 28, 300, 0.91, 1.3),
    ("*CClCCl*", "Recycled-PVC", 80000, 80, 180, 50, 50, 1.40, 3.0),
    ("*C(Cc1ccccc1)*", "Recycled-PS", 200000, 100, 0, 35, 3, 1.05, 2.8),
    ("*OCC(=O)NC*", "Aramid-Kevlar", 30000, 375, 0, 3600, 3, 1.44, 130),
    ("*OCC(=O)NC*", "Aramid-Nomex", 30000, 275, 0, 380, 25, 1.38, 12),
    ("*OCC(=O)NC*", "Aramid-Twaron", 30000, 350, 0, 3200, 3, 1.45, 120),
    ("*OCC(=O)NC*", "Aramid-Technora", 30000, 290, 0, 2800, 5, 1.39, 70),
    ("*OCC(=O)NC*", "PE-Dyneema", 5000000, -110, 145, 3200, 4, 0.97, 110),
    ("*OCC(=O)NC*", "PE-Spectra", 5000000, -110, 145, 3000, 4, 0.97, 100),
    ("*OCC(=O)NC*", "Carbon-fiber-T300", 0, 0, 0, 3530, 1.5, 1.76, 230),
    ("*OCC(=O)NC*", "Carbon-fiber-T700", 0, 0, 0, 4900, 1.8, 1.80, 240),
    ("*OCC(=O)NC*", "Carbon-fiber-T800", 0, 0, 0, 5880, 1.9, 1.81, 295),
    ("*OCC(=O)NC*", "Carbon-fiber-M60J", 0, 0, 0, 3920, 0.7, 1.93, 588),
]


def write_polymer_csv(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    p = out_dir / "polymers_sample.csv"
    with open(p, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["smiles", "polymer_type", "molecular_weight",
                    "glass_transition_c", "melting_temp_c", "tensile_strength_mpa",
                    "elongation_pct", "density_g_cm3", "youngs_modulus_gpa"])
        w.writerows(POLYMER_DATA)
    print(f"  polymers: {len(POLYMER_DATA)} rows → {p}")


# ------------------------------------------------------------------
# Semiconductors
# ------------------------------------------------------------------
SEMICONDUCTOR_DATA = [
    # (formula, crystal_structure, doping_type, band_gap_ev, electron_mobility_cm2_vs, hole_mobility_cm2_vs, dielectric_constant, thermal_conductivity_w_mk, carrier_concentration_cm3)
    ("Si", "diamond", "n-type", 1.12, 1500, 450, 11.7, 150, 1e15),
    ("Si", "diamond", "p-type", 1.12, 1500, 450, 11.7, 150, 1e16),
    ("Si", "diamond", "intrinsic", 1.12, 1500, 450, 11.7, 150, 1e10),
    ("Ge", "diamond", "n-type", 0.66, 3900, 1900, 16.0, 60, 1e15),
    ("Ge", "diamond", "p-type", 0.66, 3900, 1900, 16.0, 60, 1e16),
    ("Ge", "diamond", "intrinsic", 0.66, 3900, 1900, 16.0, 60, 1e13),
    ("GaAs", "zincblende", "n-type", 1.42, 8500, 400, 12.9, 55, 1e16),
    ("GaAs", "zincblende", "p-type", 1.42, 8500, 400, 12.9, 55, 1e17),
    ("GaAs", "zincblende", "intrinsic", 1.42, 8500, 400, 12.9, 55, 1e7),
    ("InP", "zincblende", "n-type", 1.34, 5400, 200, 12.5, 68, 1e16),
    ("InP", "zincblende", "p-type", 1.34, 5400, 200, 12.5, 68, 1e17),
    ("InP", "zincblende", "intrinsic", 1.34, 5400, 200, 12.5, 68, 1e8),
    ("GaP", "zincblende", "n-type", 2.26, 250, 150, 11.1, 110, 1e16),
    ("GaP", "zincblende", "p-type", 2.26, 250, 150, 11.1, 110, 1e17),
    ("GaP", "zincblende", "intrinsic", 2.26, 250, 150, 11.1, 110, 1e6),
    ("InAs", "zincblende", "n-type", 0.36, 40000, 500, 15.2, 27, 1e16),
    ("InAs", "zincblende", "p-type", 0.36, 40000, 500, 15.2, 27, 1e17),
    ("InAs", "zincblende", "intrinsic", 0.36, 40000, 500, 15.2, 27, 1e12),
    ("InSb", "zincblende", "n-type", 0.17, 80000, 1250, 16.8, 17, 1e16),
    ("InSb", "zincblende", "p-type", 0.17, 80000, 1250, 16.8, 17, 1e17),
    ("InSb", "zincblende", "intrinsic", 0.17, 80000, 1250, 16.8, 17, 1e13),
    ("AlN", "wurtzite", "intrinsic", 6.2, 300, 14, 9.1, 285, 1e10),
    ("GaN", "wurtzite", "n-type", 3.4, 1000, 200, 9.0, 130, 1e17),
    ("GaN", "wurtzite", "p-type", 3.4, 1000, 200, 9.0, 130, 1e18),
    ("GaN", "wurtzite", "intrinsic", 3.4, 1000, 200, 9.0, 130, 1e10),
    ("InN", "wurtzite", "n-type", 0.7, 4400, 340, 9.0, 45, 1e17),
    ("InN", "wurtzite", "intrinsic", 0.7, 4400, 340, 9.0, 45, 1e12),
    ("AlGaAs", "zincblende", "n-type", 1.8, 1000, 200, 12.0, 80, 1e16),
    ("AlGaAs", "zincblende", "intrinsic", 1.8, 1000, 200, 12.0, 80, 1e6),
    ("InGaAs", "zincblende", "n-type", 0.75, 12000, 400, 13.9, 60, 1e16),
    ("InGaAs", "zincblende", "intrinsic", 0.75, 12000, 400, 13.9, 60, 1e8),
    ("InGaP", "zincblende", "n-type", 1.9, 500, 100, 11.6, 90, 1e16),
    ("AlInGaP", "zincblende", "intrinsic", 2.0, 200, 100, 11.5, 80, 1e6),
    ("SiC-3C", "zincblende", "n-type", 2.36, 1000, 100, 9.7, 490, 1e16),
    ("SiC-4H", "wurtzite", "n-type", 3.26, 900, 120, 9.7, 490, 1e16),
    ("SiC-6H", "wurtzite", "n-type", 3.03, 400, 100, 9.7, 490, 1e16),
    ("SiC-4H", "wurtzite", "p-type", 3.26, 900, 120, 9.7, 490, 1e18),
    ("SiC-4H", "wurtzite", "intrinsic", 3.26, 900, 120, 9.7, 490, 1e8),
    ("ZnSe", "zincblende", "n-type", 2.7, 600, 100, 9.2, 19, 1e16),
    ("ZnSe", "zincblende", "intrinsic", 2.7, 600, 100, 9.2, 19, 1e10),
    ("ZnTe", "zincblende", "p-type", 2.25, 300, 100, 9.7, 18, 1e17),
    ("ZnTe", "zincblende", "intrinsic", 2.25, 300, 100, 9.7, 18, 1e11),
    ("CdS", "wurtzite", "n-type", 2.42, 350, 50, 9.0, 20, 1e16),
    ("CdS", "wurtzite", "intrinsic", 2.42, 350, 50, 9.0, 20, 1e10),
    ("CdSe", "wurtzite", "n-type", 1.74, 720, 75, 9.5, 9, 1e16),
    ("CdSe", "wurtzite", "intrinsic", 1.74, 720, 75, 9.5, 9, 1e11),
    ("CdTe", "zincblende", "n-type", 1.5, 1100, 100, 10.2, 6, 1e16),
    ("CdTe", "zincblende", "p-type", 1.5, 1100, 100, 10.2, 6, 1e17),
    ("CdTe", "zincblende", "intrinsic", 1.5, 1100, 100, 10.2, 6, 1e10),
    ("HgCdTe", "zincblende", "n-type", 0.2, 20000, 600, 16.0, 5, 1e16),
    ("HgCdTe", "zincblende", "intrinsic", 0.2, 20000, 600, 16.0, 5, 1e13),
    ("PbS", "rocksalt", "n-type", 0.41, 800, 600, 17.0, 2.5, 1e17),
    ("PbS", "rocksalt", "intrinsic", 0.41, 800, 600, 17.0, 2.5, 1e14),
    ("PbSe", "rocksalt", "n-type", 0.27, 1500, 1500, 22.0, 2, 1e17),
    ("PbSe", "rocksalt", "intrinsic", 0.27, 1500, 1500, 22.0, 2, 1e15),
    ("PbTe", "rocksalt", "n-type", 0.31, 6000, 4000, 28.0, 2, 1e17),
    ("PbTe", "rocksalt", "intrinsic", 0.31, 6000, 4000, 28.0, 2, 1e16),
    ("SnTe", "rocksalt", "p-type", 0.18, 800, 700, 30.0, 4, 1e20),
    ("TiO2-rutile", "tetragonal", "n-type", 3.0, 0.1, 0.1, 114.0, 9, 1e19),
    ("TiO2-anatase", "tetragonal", "n-type", 3.2, 10, 1, 31.0, 9, 1e18),
    ("ZnO", "wurtzite", "n-type", 3.37, 200, 180, 8.5, 60, 1e17),
    ("ZnO", "wurtzite", "intrinsic", 3.37, 200, 180, 8.5, 60, 1e11),
    ("SnO2", "tetragonal", "n-type", 3.6, 250, 50, 9.0, 100, 1e18),
    ("In2O3", "bixbyite", "n-type", 3.7, 200, 50, 8.9, 10, 1e19),
    ("Ga2O3", "monoclinic", "n-type", 4.85, 100, 20, 10.0, 27, 1e17),
    ("Ga2O3", "monoclinic", "intrinsic", 4.85, 100, 20, 10.0, 27, 1e10),
    ("MoS2-2H", "hexagonal", "n-type", 1.3, 400, 200, 7.0, 90, 1e16),
    ("MoS2-1L", "hexagonal", "n-type", 1.85, 1000, 500, 4.0, 50, 1e16),
    ("WS2-2H", "hexagonal", "n-type", 1.4, 500, 200, 7.0, 110, 1e16),
    ("WSe2-2H", "hexagonal", "p-type", 1.2, 200, 500, 7.0, 10, 1e17),
    ("MoSe2-2H", "hexagonal", "p-type", 1.1, 200, 500, 7.0, 50, 1e17),
    ("MoTe2-2H", "hexagonal", "p-type", 1.0, 100, 400, 7.0, 25, 1e17),
    ("Black-P", "orthorhombic", "p-type", 0.3, 1000, 600, 12.0, 10, 1e16),
    ("Black-P-1L", "orthorhombic", "p-type", 2.0, 10000, 5000, 6.0, 30, 1e16),
    ("Graphene", "hexagonal", "n-type", 0, 200000, 500, 4.0, 5000, 1e12),
    ("h-BN", "hexagonal", "intrinsic", 5.95, 0.001, 0.001, 5.0, 400, 1e10),
    ("Diamond", "diamond", "p-type", 5.47, 2400, 2100, 5.7, 2200, 1e17),
    ("Diamond", "diamond", "intrinsic", 5.47, 2400, 2100, 5.7, 2200, 1e10),
    ("Al2O3", "corundum", "intrinsic", 8.8, 0, 0, 9.4, 30, 1e10),
    ("SiO2", "amorphous", "intrinsic", 9.0, 0, 0, 3.9, 1.4, 1e10),
    ("Si3N4", "hexagonal", "intrinsic", 5.3, 0, 0, 7.5, 30, 1e10),
    ("HfO2", "monoclinic", "intrinsic", 5.7, 0, 0, 25.0, 1.5, 1e10),
    ("ZrO2", "monoclinic", "intrinsic", 5.8, 0, 0, 22.0, 2, 1e10),
    ("BaTiO3", "perovskite", "n-type", 3.0, 0.1, 0.1, 1500, 5, 1e18),
    ("SrTiO3", "perovskite", "n-type", 3.2, 8, 100, 300, 12, 1e18),
    ("LiNbO3", "ilmenite", "intrinsic", 4.0, 0, 0, 30, 4, 1e10),
    ("KNbO3", "perovskite", "intrinsic", 3.3, 0, 0, 50, 4, 1e10),
]


def write_semiconductor_csv(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    p = out_dir / "semiconductors_sample.csv"
    with open(p, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["formula", "crystal_structure", "doping_type",
                    "band_gap_ev", "electron_mobility_cm2_vs", "hole_mobility_cm2_vs",
                    "dielectric_constant", "thermal_conductivity_w_mk",
                    "carrier_concentration_cm3"])
        w.writerows(SEMICONDUCTOR_DATA)
    print(f"  semiconductors: {len(SEMICONDUCTOR_DATA)} rows → {p}")


# ------------------------------------------------------------------
# Catalysts
# ------------------------------------------------------------------
CATALYST_DATA = [
    # (formula, catalyst_type, support_material, overpotential_mv, tafel_slope_mv_dec, exchange_current_density_ma_cm2, faradaic_efficiency_pct, stability_hours, turnover_frequency_s1)
    ("Pt/C", "metal", "Vulcan XC-72", 30, 30, 0.45, 95, 50000, 10),
    ("Pt/C", "metal", "Ketjenblack", 25, 28, 0.5, 96, 60000, 12),
    ("Pt3Ni/C", "alloy", "Vulcan XC-72", 20, 25, 0.65, 97, 40000, 15),
    ("Pt3Co/C", "alloy", "Vulcan XC-72", 22, 27, 0.6, 96, 38000, 14),
    ("Pt3Fe/C", "alloy", "Vulcan XC-72", 28, 32, 0.55, 95, 35000, 12),
    ("PtCu/C", "alloy", "Vulcan XC-72", 35, 35, 0.45, 94, 30000, 10),
    ("PtPb/C", "intermetallic", "Vulcan XC-72", 25, 28, 0.6, 96, 32000, 13),
    ("PtSn/C", "intermetallic", "Vulcan XC-72", 40, 40, 0.4, 93, 28000, 9),
    ("Pd/C", "metal", "Vulcan XC-72", 80, 70, 0.3, 92, 25000, 7),
    ("PdAu/C", "alloy", "Vulcan XC-72", 70, 60, 0.35, 93, 22000, 8),
    ("PdPt/C", "alloy", "Vulcan XC-72", 50, 50, 0.4, 94, 30000, 10),
    ("IrO2", "oxide", "Ti", 280, 40, 0.05, 98, 2000, 1),
    ("IrO2", "oxide", "Glassy carbon", 270, 38, 0.06, 98, 2200, 1.2),
    ("RuO2", "oxide", "Ti", 290, 45, 0.04, 97, 1800, 0.8),
    ("RuO2", "oxide", "Glassy carbon", 280, 42, 0.05, 97, 2000, 1),
    ("IrRuO2", "mixed-oxide", "Ti", 270, 40, 0.06, 98, 2500, 1.5),
    ("NiFeOOH", "oxyhydroxide", "Ni foam", 240, 35, 0.08, 99, 1000, 0.5),
    ("NiFeOOH", "oxyhydroxide", "Glassy carbon", 230, 32, 0.1, 99, 1200, 0.6),
    ("NiFe-LDH", "layered", "Glassy carbon", 260, 45, 0.05, 98, 800, 0.3),
    ("NiFe-LDH", "layered", "Ni foam", 220, 38, 0.08, 99, 1500, 0.5),
    ("CoPi", "phosphate", "Glassy carbon", 410, 60, 0.02, 95, 500, 0.1),
    ("CoPi", "phosphate", "FTO", 400, 55, 0.03, 96, 600, 0.15),
    ("CoFe-LDH", "layered", "Glassy carbon", 280, 50, 0.04, 97, 700, 0.2),
    ("CoFe-LDH", "layered", "Ni foam", 250, 42, 0.06, 98, 1000, 0.3),
    ("Ni2P", "phosphide", "Carbon paper", 130, 50, 0.1, 95, 100, 0.4),
    ("Ni2P", "phosphide", "Glassy carbon", 140, 55, 0.08, 94, 80, 0.3),
    ("CoP", "phosphide", "Carbon paper", 120, 50, 0.12, 96, 90, 0.5),
    ("CoP", "phosphide", "Glassy carbon", 130, 55, 0.1, 95, 70, 0.4),
    ("FeP", "phosphide", "Carbon paper", 110, 45, 0.15, 97, 80, 0.6),
    ("MoP", "phosphide", "Carbon paper", 150, 60, 0.08, 93, 60, 0.3),
    ("WP", "phosphide", "Carbon paper", 140, 55, 0.1, 94, 70, 0.4),
    ("Ni3S2", "sulfide", "Ni foam", 110, 50, 0.2, 96, 200, 0.8),
    ("Ni3S2", "sulfide", "Glassy carbon", 130, 55, 0.15, 95, 150, 0.6),
    ("MoS2", "sulfide", "Glassy carbon", 180, 60, 0.05, 92, 100, 0.2),
    ("MoS2-edge", "sulfide", "Carbon nanotube", 150, 50, 0.08, 94, 150, 0.3),
    ("MoS2-1L", "sulfide", "Au", 120, 45, 0.1, 95, 200, 0.4),
    ("WS2", "sulfide", "Glassy carbon", 200, 65, 0.04, 91, 80, 0.15),
    ("WS2-1L", "sulfide", "Au", 140, 50, 0.08, 94, 150, 0.3),
    ("CoS2", "sulfide", "Glassy carbon", 160, 55, 0.06, 93, 120, 0.25),
    ("NiS2", "sulfide", "Glassy carbon", 180, 60, 0.05, 92, 100, 0.2),
    ("FeS2", "sulfide", "Glassy carbon", 200, 65, 0.04, 91, 90, 0.15),
    ("Co9S8", "sulfide", "Carbon paper", 150, 55, 0.07, 94, 130, 0.3),
    ("NiSe2", "selenide", "Glassy carbon", 140, 50, 0.08, 95, 140, 0.35),
    ("CoSe2", "selenide", "Glassy carbon", 150, 55, 0.07, 94, 120, 0.3),
    ("MoSe2", "selenide", "Glassy carbon", 170, 60, 0.05, 93, 100, 0.2),
    ("WSe2", "selenide", "Glassy carbon", 180, 62, 0.04, 92, 90, 0.18),
    ("NiMo", "alloy", "Ni foam", 90, 60, 0.25, 97, 300, 1),
    ("NiMo", "alloy", "Glassy carbon", 100, 65, 0.2, 96, 250, 0.8),
    ("CoMo", "alloy", "Glassy carbon", 110, 70, 0.15, 95, 200, 0.6),
    ("NiW", "alloy", "Glassy carbon", 120, 75, 0.12, 94, 180, 0.5),
    ("CoW", "alloy", "Glassy carbon", 130, 78, 0.1, 93, 160, 0.4),
    ("Au", "metal", "Glassy carbon", 250, 100, 0.01, 90, 500, 0.05),
    ("Ag", "metal", "Glassy carbon", 320, 120, 0.005, 88, 300, 0.02),
    ("Cu", "metal", "Glassy carbon", 450, 150, 0.002, 85, 200, 0.01),
    ("Cu2O", "oxide", "Glassy carbon", 400, 130, 0.005, 87, 250, 0.03),
    ("CuO", "oxide", "Glassy carbon", 420, 140, 0.004, 86, 220, 0.025),
    ("NiO", "oxide", "Glassy carbon", 350, 120, 0.01, 88, 300, 0.05),
    ("Co3O4", "oxide", "Glassy carbon", 320, 110, 0.015, 89, 350, 0.08),
    ("Fe2O3", "oxide", "FTO", 400, 130, 0.005, 87, 250, 0.03),
    ("Fe3O4", "oxide", "Glassy carbon", 380, 125, 0.008, 88, 280, 0.04),
    ("MnO2", "oxide", "Glassy carbon", 380, 130, 0.005, 87, 200, 0.025),
    ("Mn2O3", "oxide", "Glassy carbon", 400, 135, 0.004, 86, 180, 0.02),
    ("CoFe2O4", "spinel", "Glassy carbon", 350, 115, 0.01, 89, 300, 0.06),
    ("NiFe2O4", "spinel", "Glassy carbon", 360, 120, 0.008, 88, 280, 0.05),
    ("ZnFe2O4", "spinel", "Glassy carbon", 400, 130, 0.005, 86, 200, 0.025),
    ("MnFe2O4", "spinel", "Glassy carbon", 380, 125, 0.006, 87, 220, 0.03),
    ("Co3O4-Fe2O3", "composite", "Glassy carbon", 300, 100, 0.02, 91, 400, 0.1),
    ("NiO-Fe2O3", "composite", "Glassy carbon", 320, 110, 0.015, 90, 350, 0.08),
    ("Pt-Co3O4", "composite", "Glassy carbon", 60, 45, 0.3, 96, 25000, 8),
    ("Pt-NiO", "composite", "Glassy carbon", 70, 50, 0.25, 95, 20000, 6),
    ("Au-Fe2O3", "composite", "FTO", 300, 90, 0.02, 92, 800, 0.15),
    ("Ag-Cu2O", "composite", "Glassy carbon", 320, 100, 0.015, 91, 600, 0.1),
    ("Cu3N", "nitride", "Glassy carbon", 280, 90, 0.025, 93, 500, 0.2),
    ("CoN", "nitride", "Glassy carbon", 200, 70, 0.04, 94, 400, 0.3),
    ("Ni3N", "nitride", "Glassy carbon", 180, 65, 0.05, 95, 500, 0.35),
    ("MoN", "nitride", "Glassy carbon", 220, 75, 0.03, 93, 300, 0.25),
    ("WN", "nitride", "Glassy carbon", 230, 78, 0.025, 92, 280, 0.2),
    ("FeN4-graphene", "single-atom", "Graphene", 80, 60, 0.2, 95, 1000, 1.5),
    ("CoN4-graphene", "single-atom", "Graphene", 70, 55, 0.25, 96, 1500, 2),
    ("NiN4-graphene", "single-atom", "Graphene", 90, 65, 0.15, 94, 800, 1),
    ("CuN4-graphene", "single-atom", "Graphene", 110, 75, 0.1, 92, 600, 0.7),
    ("MnN4-graphene", "single-atom", "Graphene", 100, 70, 0.12, 93, 700, 0.8),
    ("FeN4-CNT", "single-atom", "Carbon nanotube", 75, 58, 0.22, 95, 1200, 1.8),
    ("CoN4-CNT", "single-atom", "Carbon nanotube", 65, 52, 0.28, 96, 1800, 2.2),
    ("NiFe-NC", "single-atom", "N-doped carbon", 130, 75, 0.1, 93, 800, 0.7),
    ("CoFe-NC", "single-atom", "N-doped carbon", 120, 70, 0.12, 94, 900, 0.8),
]


def write_catalyst_csv(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    p = out_dir / "catalysts_sample.csv"
    with open(p, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["formula", "catalyst_type", "support_material",
                    "overpotential_mv", "tafel_slope_mv_dec", "exchange_current_density_ma_cm2",
                    "faradaic_efficiency_pct", "stability_hours", "turnover_frequency_s1"])
        w.writerows(CATALYST_DATA)
    print(f"  catalysts: {len(CATALYST_DATA)} rows → {p}")


# ------------------------------------------------------------------
# Solar cells
# ------------------------------------------------------------------
SOLAR_DATA = [
    # (formula, cell_type, deposition_method, efficiency_pct, band_gap_ev, voc_v, jsc_ma_cm2, fill_factor, stability_hours)
    ("Si-mono", "mono-Si", "Czochralski", 26.1, 1.12, 0.74, 42.0, 0.84, 100000),
    ("Si-mono-PERC", "mono-Si", "Czochralski", 24.5, 1.12, 0.72, 41.5, 0.82, 100000),
    ("Si-mono-HJT", "mono-Si", "Czochralski", 26.8, 1.12, 0.75, 42.5, 0.84, 100000),
    ("Si-mono-IBC", "mono-Si", "Czochralski", 27.3, 1.12, 0.76, 43.0, 0.83, 100000),
    ("Si-mono-TOPCon", "mono-Si", "Czochralski", 26.1, 1.12, 0.74, 42.0, 0.84, 100000),
    ("Si-poly", "poly-Si", "directional", 22.3, 1.12, 0.69, 40.0, 0.81, 100000),
    ("Si-poly-PERC", "poly-Si", "directional", 23.5, 1.12, 0.71, 40.5, 0.82, 100000),
    ("Si-amorphous", "a-Si", "PECVD", 10.1, 1.7, 0.89, 16.5, 0.69, 5000),
    ("Si-amorphous-micro", "a-Si/μc-Si", "PECVD", 14.0, 1.5, 1.1, 14.0, 0.74, 10000),
    ("GaAs-single", "III-V", "MOCVD", 29.1, 1.42, 1.13, 29.8, 0.87, 100000),
    ("GaAs-thin", "III-V", "MOCVD", 29.1, 1.42, 1.13, 29.8, 0.87, 100000),
    ("GaInP/GaAs", "III-V-tandem", "MOCVD", 32.0, 1.85, 1.45, 14.0, 0.79, 100000),
    ("GaInP/GaAs/Ge", "III-V-triple", "MOCVD", 37.9, 1.85, 3.0, 14.0, 0.85, 100000),
    ("GaInP/GaInAs/Ge", "III-V-triple", "MOCVD", 39.2, 1.85, 3.0, 14.5, 0.86, 100000),
    ("InGaP/GaAs/InGaAs", "III-V-triple", "MOCVD", 40.7, 1.85, 3.2, 14.0, 0.87, 100000),
    ("CdTe", "thin-film", "CSS", 22.1, 1.5, 0.89, 31.0, 0.80, 50000),
    ("CdTe-advanced", "thin-film", "CSS", 22.4, 1.5, 0.89, 31.5, 0.80, 50000),
    ("CIGS", "thin-film", "co-evaporation", 23.4, 1.15, 0.74, 39.0, 0.81, 50000),
    ("CIGS-Cd-free", "thin-film", "co-evaporation", 22.9, 1.15, 0.73, 38.5, 0.81, 50000),
    ("CIGS-flexible", "thin-film", "co-evaporation", 21.5, 1.15, 0.72, 37.0, 0.81, 30000),
    ("CZTS", "thin-film", "solution", 12.6, 1.5, 0.66, 26.0, 0.66, 10000),
    ("CZTSe", "thin-film", "solution", 11.6, 1.0, 0.42, 38.0, 0.64, 10000),
    ("CZTSSe", "thin-film", "solution", 13.0, 1.2, 0.50, 33.0, 0.66, 10000),
    ("Sb2Se3", "thin-film", "CSS", 9.2, 1.2, 0.40, 30.0, 0.60, 5000),
    ("Sb2S3", "thin-film", "CSS", 7.5, 1.7, 0.55, 18.0, 0.60, 5000),
    ("MAPbI3", "perovskite", "spin-coating", 21.6, 1.55, 1.12, 24.0, 0.81, 1000),
    ("MAPbI3-improved", "perovskite", "spin-coating", 22.7, 1.55, 1.13, 25.0, 0.80, 1500),
    ("FAPbI3", "perovskite", "spin-coating", 23.8, 1.48, 1.10, 26.0, 0.82, 2000),
    ("FAPbI3-stabilized", "perovskite", "spin-coating", 24.2, 1.48, 1.12, 26.5, 0.81, 3000),
    ("MAxFA1-xPbI3", "perovskite", "spin-coating", 24.8, 1.50, 1.12, 26.5, 0.83, 3000),
    ("Cs0.05FA0.85MA0.10PbI3", "perovskite", "spin-coating", 25.2, 1.52, 1.13, 27.0, 0.83, 4000),
    ("Cs0.10FA0.90PbI3", "perovskite", "spin-coating", 25.5, 1.50, 1.14, 27.5, 0.83, 5000),
    ("CsPbI3", "perovskite-inorganic", "spin-coating", 19.0, 1.73, 1.23, 19.5, 0.79, 2000),
    ("CsPbI2Br", "perovskite-inorganic", "spin-coating", 16.0, 1.92, 1.28, 14.5, 0.78, 1500),
    ("CsPbBr3", "perovskite-inorganic", "spin-coating", 10.0, 2.30, 1.50, 7.5, 0.70, 1000),
    ("MAPbBr3", "perovskite", "spin-coating", 8.5, 2.30, 1.50, 6.5, 0.70, 1000),
    ("FAPbBr3", "perovskite", "spin-coating", 9.5, 2.30, 1.55, 7.0, 0.72, 1500),
    ("Perovskite-Si-tandem", "tandem", "spin-coating+MOCVD", 33.9, 1.68, 1.97, 20.4, 0.84, 5000),
    ("Perovskite-Perovskite", "tandem", "spin-coating", 29.3, 1.85, 2.10, 16.0, 0.82, 3000),
    ("Perovskite-CIGS", "tandem", "spin-coating+co-evap", 28.0, 1.65, 1.85, 18.0, 0.80, 3000),
    ("P3HT:PCBM", "organic", "spin-coating", 5.0, 1.9, 0.65, 10.0, 0.65, 2000),
    ("PTB7:PC71BM", "organic", "spin-coating", 9.2, 1.8, 0.80, 16.0, 0.70, 2000),
    ("PBDB-T:ITIC", "organic", "spin-coating", 11.2, 1.6, 0.90, 16.5, 0.74, 2000),
    ("PM6:Y6", "organic", "spin-coating", 15.7, 1.4, 0.84, 25.0, 0.75, 3000),
    ("PM6:Y6-BO", "organic", "spin-coating", 17.6, 1.4, 0.84, 26.5, 0.78, 3000),
    ("D18:Y6", "organic", "spin-coating", 18.2, 1.4, 0.86, 27.0, 0.78, 3000),
    ("PCE10:PCBM", "organic", "spin-coating", 10.0, 1.7, 0.82, 15.0, 0.70, 2000),
    ("N719-TiO2", "DSSC", "spin-coating", 11.2, 1.8, 0.75, 19.0, 0.72, 1000),
    ("N749-TiO2", "DSSC", "spin-coating", 11.5, 1.6, 0.75, 20.0, 0.72, 1000),
    ("Y123-TiO2", "DSSC", "spin-coating", 10.8, 1.8, 0.75, 18.5, 0.71, 1500),
    ("C106-TiO2", "DSSC", "spin-coating", 11.9, 1.6, 0.75, 20.5, 0.74, 1500),
    ("SM315-TiO2", "DSSC", "spin-coating", 13.0, 1.6, 0.80, 20.5, 0.78, 2000),
    ("Cobalt-DSSC", "DSSC", "spin-coating", 14.3, 1.6, 0.85, 21.0, 0.78, 2000),
    ("Quantum-dot-PbS", "QD", "spin-coating", 13.0, 1.3, 0.62, 28.0, 0.65, 500),
    ("Quantum-dot-PbSe", "QD", "spin-coating", 11.0, 1.3, 0.60, 26.0, 0.62, 500),
    ("Quantum-dot-HgTe", "QD", "spin-coating", 8.0, 1.0, 0.50, 20.0, 0.60, 300),
    ("a-Si:H", "thin-film", "PECVD", 10.1, 1.7, 0.89, 16.5, 0.69, 5000),
    ("μc-Si:H", "thin-film", "PECVD", 10.5, 1.1, 0.55, 25.0, 0.71, 5000),
    ("a-Si:H/μc-Si:H", "tandem-thin", "PECVD", 14.0, 1.4, 1.45, 14.0, 0.74, 8000),
    ("a-Si:H/a-SiGe:H", "tandem-thin", "PECVD", 12.5, 1.5, 1.20, 13.0, 0.70, 5000),
    ("a-Si:H/μc-Si:H/μc-Si:H", "triple-thin", "PECVD", 16.3, 1.5, 2.00, 10.0, 0.78, 8000),
    ("Se", "thin-film", "vacuum-evap", 5.0, 1.95, 0.95, 5.0, 0.60, 1000),
    ("Bi2S3", "thin-film", "CBD", 1.5, 1.4, 0.40, 6.0, 0.45, 500),
    ("SnS", "thin-film", "vacuum-evap", 4.4, 1.3, 0.40, 18.0, 0.50, 1000),
    ("FeS2", "thin-film", "vacuum-evap", 2.8, 0.95, 0.30, 12.0, 0.45, 500),
    ("Cu2O", "thin-film", "electrodeposition", 2.0, 2.0, 0.80, 5.0, 0.45, 1000),
    ("CuO", "thin-film", "thermal-oxidation", 0.5, 1.4, 0.40, 3.0, 0.40, 500),
    ("MoS2-1L", "2D", "CVD", 1.0, 1.85, 1.05, 3.0, 0.30, 100),
    ("MoSe2-1L", "2D", "CVD", 0.7, 1.55, 0.85, 2.5, 0.30, 100),
    ("WSe2-1L", "2D", "CVD", 1.9, 1.65, 1.05, 5.0, 0.35, 200),
    ("Black-P-1L", "2D", "CVD", 0.5, 0.4, 0.20, 5.0, 0.30, 100),
    ("MoS2/Au", "2D-metal", "CVD", 5.0, 1.85, 1.05, 8.0, 0.55, 500),
    ("Ga2O3", "wide-gap", "MOCVD", 0.5, 4.85, 2.50, 0.5, 0.40, 1000),
    ("ZnO", "wide-gap", "ALD", 0.5, 3.37, 1.50, 1.0, 0.30, 1000),
    ("TiO2-rutile", "wide-gap", "sputtering", 0.5, 3.0, 1.20, 1.0, 0.30, 500),
    ("TiO2-anatase", "wide-gap", "spin-coating", 5.5, 3.2, 1.10, 10.0, 0.50, 2000),
    ("Fe2O3", "photoelectrode", "spray-pyrolysis", 1.0, 2.1, 0.80, 3.0, 0.40, 1000),
    ("BiVO4", "photoelectrode", "spin-coating", 3.0, 2.4, 1.00, 5.0, 0.55, 2000),
    ("WO3", "photoelectrode", "sputtering", 1.5, 2.7, 1.20, 3.0, 0.45, 1500),
    ("CuBi2O4", "photoelectrode", "spin-coating", 1.0, 1.5, 0.60, 3.0, 0.40, 500),
    ("a-SiC:H", "thin-film", "PECVD", 8.0, 2.0, 0.90, 12.0, 0.65, 5000),
    ("a-SiGe:H", "thin-film", "PECVD", 8.5, 1.4, 0.65, 18.0, 0.65, 5000),
    ("Heterojunction-Si", "HJT-Si", "PECVD+Czochralski", 26.8, 1.12, 0.75, 42.5, 0.84, 100000),
    ("Tunnel-oxide-POLy-Si", "TOPCon", "LPCVD+Czochralski", 26.1, 1.12, 0.74, 42.0, 0.84, 100000),
    ("HJT-Perovskite-tandem", "tandem", "HJT+spin-coating", 33.9, 1.68, 1.97, 20.4, 0.84, 5000),
]


def write_solar_csv(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    p = out_dir / "solar_sample.csv"
    with open(p, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["formula", "cell_type", "deposition_method",
                    "efficiency_pct", "band_gap_ev", "voc_v", "jsc_ma_cm2",
                    "fill_factor", "stability_hours"])
        w.writerows(SOLAR_DATA)
    print(f"  solar: {len(SOLAR_DATA)} rows → {p}")


# ------------------------------------------------------------------
# Hydrogen storage
# ------------------------------------------------------------------
HYDROGEN_DATA = [
    # (formula, storage_mechanism, particle_size_nm, storage_capacity_wt_pct, desorption_temp_c, enthalpy_kj_mol, entropy_j_mol_k, kinetics_min, cycle_stability)
    ("LaNi5", "intermetallic", 1000, 1.4, 25, 30, 100, 5, 500),
    ("LaNi4.7Al0.3", "intermetallic", 1000, 1.3, 50, 35, 110, 7, 400),
    ("LaNi4.5Mn0.5", "intermetallic", 1000, 1.5, 10, 25, 95, 4, 350),
    ("LaNi4.25Al0.75", "intermetallic", 1000, 1.2, 80, 45, 120, 10, 500),
    ("MmNi5", "intermetallic", 1000, 1.4, 30, 25, 95, 5, 400),
    ("MmNi4.5Al0.5", "intermetallic", 1000, 1.3, 60, 35, 105, 8, 450),
    ("TiFe", "intermetallic", 1000, 1.8, 25, 28, 105, 5, 500),
    ("TiFe0.9Mn0.1", "intermetallic", 1000, 1.8, 0, 22, 95, 3, 500),
    ("TiMn2", "intermetallic", 1000, 1.8, -20, 20, 90, 3, 450),
    ("TiCr1.8", "intermetallic", 1000, 2.1, -40, 18, 85, 2, 400),
    ("Ti0.8Zr0.2Mn1.2Cr1.0V0.4", "intermetallic", 1000, 2.0, -10, 22, 95, 3, 450),
    ("Ti0.9Zr0.1Mn1.4V0.6Cr0.2", "intermetallic", 1000, 2.1, 0, 20, 90, 3, 500),
    ("ZrMn2", "intermetallic", 1000, 1.7, 100, 40, 110, 10, 300),
    ("ZrV2", "intermetallic", 1000, 2.0, 150, 50, 120, 12, 250),
    ("Mg2Ni", "intermetallic", 1000, 3.6, 250, 64, 122, 30, 200),
    ("Mg2Ni-nano", "intermetallic", 50, 3.6, 200, 55, 115, 15, 300),
    ("Mg2Cu", "intermetallic", 1000, 2.6, 280, 70, 130, 40, 150),
    ("Mg2Co", "intermetallic", 1000, 2.7, 300, 75, 135, 45, 100),
    ("Mg17Al12", "intermetallic", 1000, 2.5, 280, 65, 120, 35, 150),
    ("Mg", "metal", 1000, 7.6, 400, 75, 130, 60, 100),
    ("Mg-nano", "metal", 50, 7.6, 300, 65, 120, 30, 200),
    ("Mg-5Ni", "composite", 100, 5.5, 250, 60, 115, 25, 250),
    ("Mg-5Fe", "composite", 100, 5.7, 300, 70, 125, 30, 200),
    ("Mg-5Co", "composite", 100, 5.6, 280, 65, 120, 28, 220),
    ("Mg-5Cr", "composite", 100, 5.8, 320, 72, 128, 35, 180),
    ("Mg-5Ti", "composite", 100, 5.9, 300, 70, 125, 30, 200),
    ("Mg-5V", "composite", 100, 5.7, 290, 68, 122, 28, 220),
    ("Mg-10Ni-5Fe", "composite", 100, 5.2, 230, 55, 110, 20, 280),
    ("Mg-10Ni-5Co", "composite", 100, 5.3, 240, 58, 115, 22, 260),
    ("Mg-10Ni-5Cr", "composite", 100, 5.4, 250, 60, 118, 25, 240),
    ("MgH2-catalyzed", "metal-hydride", 50, 7.0, 250, 60, 115, 15, 300),
    ("MgH2-Nb2O5", "metal-hydride", 50, 7.0, 200, 50, 105, 5, 500),
    ("MgH2-TiC", "metal-hydride", 50, 7.0, 220, 55, 110, 8, 400),
    ("MgH2-V2O5", "metal-hydride", 50, 7.0, 230, 58, 112, 10, 350),
    ("MgH2-Cr2O3", "metal-hydride", 50, 7.0, 240, 60, 115, 12, 300),
    ("LiBH4", "complex-hydride", 1000, 18.5, 400, 70, 95, 120, 50),
    ("LiBH4-MgH2", "complex-hydride", 100, 11.5, 350, 60, 100, 60, 100),
    ("LiBH4-TiCl3", "complex-hydride", 50, 18.0, 300, 55, 95, 30, 100),
    ("NaBH4", "complex-hydride", 1000, 10.8, 500, 100, 110, 180, 30),
    ("NaBH4-catalyzed", "complex-hydride", 100, 10.5, 100, 30, 80, 5, 50),
    ("KBH4", "complex-hydride", 1000, 7.7, 400, 80, 100, 100, 50),
    ("Ca(BH4)2", "complex-hydride", 1000, 11.6, 400, 75, 100, 120, 50),
    ("Mg(BH4)2", "complex-hydride", 1000, 14.9, 350, 65, 95, 80, 80),
    ("Al(BH4)3", "complex-hydride", 1000, 16.9, 0, 30, 80, 5, 30),
    ("Zn(BH4)2", "complex-hydride", 1000, 8.5, 50, 35, 85, 10, 20),
    ("LiAlH4", "complex-hydride", 1000, 10.5, 175, 25, 80, 10, 100),
    ("LiAlH4-TiCl3", "complex-hydride", 50, 10.5, 100, 15, 70, 5, 200),
    ("NaAlH4", "complex-hydride", 1000, 7.4, 230, 50, 90, 30, 100),
    ("NaAlH4-TiCl3", "complex-hydride", 50, 5.5, 150, 30, 80, 10, 300),
    ("NaAlH4-Ti-catalyst", "complex-hydride", 50, 5.6, 100, 25, 75, 5, 500),
    ("Mg(AlH4)2", "complex-hydride", 1000, 9.3, 175, 30, 80, 15, 50),
    ("Li3AlH6", "complex-hydride", 1000, 5.6, 250, 45, 90, 30, 80),
    ("Na3AlH6", "complex-hydride", 1000, 3.7, 230, 45, 90, 30, 80),
    ("NH3BH3", "chemical-hydride", 100, 19.6, 100, 25, 80, 5, 50),
    ("NH3BH3-polymer", "chemical-hydride", 100, 12.0, 80, 20, 75, 5, 50),
    ("LiNH2", "chemical-hydride", 1000, 8.7, 280, 70, 100, 60, 100),
    ("LiNH2-LiH", "chemical-hydride", 100, 6.5, 250, 60, 95, 30, 200),
    ("LiNH2-MgH2", "chemical-hydride", 100, 5.5, 200, 45, 90, 20, 250),
    ("Mg(NH2)2", "chemical-hydride", 1000, 7.2, 250, 60, 95, 30, 150),
    ("Mg(NH2)2-LiH", "chemical-hydride", 100, 5.6, 200, 45, 90, 20, 300),
    ("Ca(NH2)2", "chemical-hydride", 1000, 5.5, 250, 55, 95, 30, 150),
    ("Ca(NH2)2-LiH", "chemical-hydride", 100, 4.5, 200, 40, 85, 20, 200),
    ("MOF-5", "physisorption", 1000, 1.6, -196, 4, 30, 1, 1000),
    ("MOF-177", "physisorption", 1000, 7.5, -196, 4, 30, 1, 1000),
    ("MOF-210", "physisorption", 1000, 8.6, -196, 4, 30, 1, 1000),
    ("MOF-200", "physisorption", 1000, 8.0, -196, 4, 30, 1, 1000),
    ("MOF-808", "physisorption", 1000, 2.5, -196, 4, 30, 1, 1000),
    ("UiO-66", "physisorption", 1000, 1.5, -196, 4, 30, 1, 1000),
    ("UiO-67", "physisorption", 1000, 2.5, -196, 4, 30, 1, 1000),
    ("MIL-101", "physisorption", 1000, 6.1, -196, 4, 30, 1, 1000),
    ("MIL-53", "physisorption", 1000, 3.0, -196, 4, 30, 1, 1000),
    ("HKUST-1", "physisorption", 1000, 3.6, -196, 4, 30, 1, 1000),
    ("Co-MOF-74", "physisorption", 1000, 2.5, -196, 4, 30, 1, 1000),
    ("Mg-MOF-74", "physisorption", 1000, 2.8, -196, 4, 30, 1, 1000),
    ("Ni-MOF-74", "physisorption", 1000, 2.6, -196, 4, 30, 1, 1000),
    ("Zn-MOF-74", "physisorption", 1000, 2.4, -196, 4, 30, 1, 1000),
    ("Activated-C", "physisorption", 1000, 5.5, -196, 4, 30, 1, 1000),
    ("AX-21", "physisorption", 1000, 7.3, -196, 4, 30, 1, 1000),
    ("SWCNT", "physisorption", 1000, 5.0, -196, 4, 30, 1, 1000),
    ("MWCNT", "physisorption", 1000, 4.0, -196, 4, 30, 1, 1000),
    ("Graphene", "physisorption", 1000, 4.5, -196, 4, 30, 1, 1000),
    ("Graphene-oxide", "physisorption", 1000, 3.5, -196, 4, 30, 1, 1000),
    ("Zeolite-13X", "physisorption", 1000, 1.0, -196, 4, 30, 1, 1000),
    ("Zeolite-5A", "physisorption", 1000, 0.8, -196, 4, 30, 1, 1000),
]


def write_hydrogen_csv(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    p = out_dir / "hydrogen_sample.csv"
    with open(p, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["formula", "storage_mechanism", "particle_size_nm",
                    "storage_capacity_wt_pct", "desorption_temp_c", "enthalpy_kj_mol",
                    "entropy_j_mol_k", "kinetics_min", "cycle_stability"])
        w.writerows(HYDROGEN_DATA)
    print(f"  hydrogen: {len(HYDROGEN_DATA)} rows → {p}")


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
def write_all_datasets(base_data_dir: Path):
    """Write all 7 domain CSVs."""
    print("Generating sample datasets...")
    write_battery_csv(base_data_dir / "battery")
    write_alloy_csv(base_data_dir / "alloys")
    write_polymer_csv(base_data_dir / "polymers")
    write_semiconductor_csv(base_data_dir / "semiconductors")
    write_catalyst_csv(base_data_dir / "catalysts")
    write_solar_csv(base_data_dir / "solar")
    write_hydrogen_csv(base_data_dir / "hydrogen")
    print(f"\nAll datasets written to {base_data_dir}/")
    total = (len(BATTERY_DATA) + len(ALLOY_DATA) + len(POLYMER_DATA) +
             len(SEMICONDUCTOR_DATA) + len(CATALYST_DATA) + len(SOLAR_DATA) + len(HYDROGEN_DATA))
    print(f"Total rows across 7 domains: {total}")
    print("\nBy domain:")
    print(f"  Battery:        {len(BATTERY_DATA)} rows (cathodes, anodes, electrolytes)")
    print(f"  Alloys:         {len(ALLOY_DATA)} rows (steel, Ti, Al, Mg, Ni-superalloys)")
    print(f"  Polymers:       {len(POLYMER_DATA)} rows (thermoplastics, thermosets, elastomers)")
    print(f"  Semiconductors: {len(SEMICONDUCTOR_DATA)} rows (Si, III-V, II-VI, 2D, oxides)")
    print(f"  Catalysts:      {len(CATALYST_DATA)} rows (HER, OER electrocatalysts)")
    print(f"  Solar:          {len(SOLAR_DATA)} rows (Si, perovskites, CIGS, OPV, DSSC)")
    print(f"  Hydrogen:       {len(HYDROGEN_DATA)} rows (hydrides, MOFs, complex hydrides)")


if __name__ == "__main__":
    # When run standalone, write to ml/data/
    base_dir = Path(__file__).resolve().parent.parent / "ml" / "data"
    write_all_datasets(base_dir)

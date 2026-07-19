"""Universal featurizer for all 7 material domains.

Each domain has its own featurization logic, but they all return a flat dict
of features suitable for sklearn models.
"""
from __future__ import annotations
import re
import numpy as np
from typing import Any

# ------------------------------------------------------------------
# Periodic table data (extended)
# ------------------------------------------------------------------
ATOMIC_NUMBERS = {
    "H": 1, "He": 2, "Li": 3, "Be": 4, "B": 5, "C": 6, "N": 7, "O": 8, "F": 9, "Ne": 10,
    "Na": 11, "Mg": 12, "Al": 13, "Si": 14, "P": 15, "S": 16, "Cl": 17, "Ar": 18,
    "K": 19, "Ca": 20, "Sc": 21, "Ti": 22, "V": 23, "Cr": 24, "Mn": 25, "Fe": 26,
    "Co": 27, "Ni": 28, "Cu": 29, "Zn": 30, "Ga": 31, "Ge": 32, "As": 33, "Se": 34,
    "Br": 35, "Kr": 36, "Rb": 37, "Sr": 38, "Y": 39, "Zr": 40, "Nb": 41, "Mo": 42,
    "Tc": 43, "Ru": 44, "Rh": 45, "Pd": 46, "Ag": 47, "Cd": 48, "In": 49, "Sn": 50,
    "Sb": 51, "Te": 52, "I": 53, "Xe": 54, "Cs": 55, "Ba": 56, "La": 57, "Ce": 58,
    "Pr": 59, "Nd": 60, "Pm": 61, "Sm": 62, "Eu": 63, "Gd": 64, "Tb": 65, "Dy": 66,
    "Ho": 67, "Er": 68, "Tm": 69, "Yb": 70, "Lu": 71, "Hf": 72, "Ta": 73, "W": 74,
    "Re": 75, "Os": 76, "Ir": 77, "Pt": 78, "Au": 79, "Hg": 80, "Tl": 81, "Pb": 82,
    "Bi": 83, "Po": 84, "At": 85, "Rn": 86, "Fr": 87, "Ra": 88, "Ac": 89, "Th": 90,
    "Pa": 91, "U": 92,
}

ATOMIC_MASSES = {
    "H": 1.008, "He": 4.003, "Li": 6.94, "Be": 9.012, "B": 10.81, "C": 12.011,
    "N": 14.007, "O": 15.999, "F": 18.998, "Ne": 20.180, "Na": 22.990, "Mg": 24.305,
    "Al": 26.982, "Si": 28.085, "P": 30.974, "S": 32.06, "Cl": 35.45, "Ar": 39.948,
    "K": 39.098, "Ca": 40.078, "Sc": 44.956, "Ti": 47.867, "V": 50.942, "Cr": 51.996,
    "Mn": 54.938, "Fe": 55.845, "Co": 58.933, "Ni": 58.693, "Cu": 63.546, "Zn": 65.38,
    "Ga": 69.723, "Ge": 72.630, "As": 74.922, "Se": 78.971, "Br": 79.904, "Kr": 83.798,
    "Rb": 85.468, "Sr": 87.62, "Y": 88.906, "Zr": 91.224, "Nb": 92.906, "Mo": 95.95,
    "Tc": 98.0, "Ru": 101.07, "Rh": 102.906, "Pd": 106.42, "Ag": 107.868, "Cd": 112.414,
    "In": 114.818, "Sn": 118.710, "Sb": 121.760, "Te": 127.60, "I": 126.904, "Xe": 131.293,
    "Cs": 132.905, "Ba": 137.327, "La": 138.905, "Ce": 140.116, "Pr": 140.908, "Nd": 144.242,
    "Pm": 145.0, "Sm": 150.36, "Eu": 151.964, "Gd": 157.25, "Tb": 158.925, "Dy": 162.500,
    "Ho": 164.930, "Er": 167.259, "Tm": 168.934, "Yb": 173.045, "Lu": 174.967, "Hf": 178.49,
    "Ta": 180.948, "W": 183.84, "Re": 186.207, "Os": 190.23, "Ir": 192.217, "Pt": 195.084,
    "Au": 196.967, "Hg": 200.592, "Tl": 204.38, "Pb": 207.2, "Bi": 208.980, "Th": 232.038,
    "U": 238.029,
}

ELECTRONEGATIVITIES = {
    "H": 2.20, "He": 0, "Li": 0.98, "Be": 1.57, "B": 2.04, "C": 2.55, "N": 3.04,
    "O": 3.44, "F": 3.98, "Ne": 0, "Na": 0.93, "Mg": 1.31, "Al": 1.61, "Si": 1.90,
    "P": 2.19, "S": 2.58, "Cl": 3.16, "Ar": 0, "K": 0.82, "Ca": 1.00, "Sc": 1.36,
    "Ti": 1.54, "V": 1.63, "Cr": 1.66, "Mn": 1.55, "Fe": 1.83, "Co": 1.88, "Ni": 1.91,
    "Cu": 1.90, "Zn": 1.65, "Ga": 1.81, "Ge": 2.01, "As": 2.18, "Se": 2.55, "Br": 2.96,
    "Kr": 3.00, "Rb": 0.82, "Sr": 0.95, "Y": 1.22, "Zr": 1.33, "Nb": 1.6, "Mo": 2.16,
    "Tc": 1.9, "Ru": 2.2, "Rh": 2.28, "Pd": 2.20, "Ag": 1.93, "Cd": 1.69, "In": 1.78,
    "Sn": 1.96, "Sb": 2.05, "Te": 2.1, "I": 2.66, "Xe": 2.6, "Cs": 0.79, "Ba": 0.89,
    "La": 1.10, "Ce": 1.12, "Pr": 1.13, "Nd": 1.14, "Pm": 1.13, "Sm": 1.17, "Eu": 1.2,
    "Gd": 1.20, "Tb": 1.1, "Dy": 1.22, "Ho": 1.23, "Er": 1.24, "Tm": 1.25, "Yb": 1.1,
    "Lu": 1.27, "Hf": 1.3, "Ta": 1.5, "W": 2.36, "Re": 1.9, "Os": 2.2, "Ir": 2.20,
    "Pt": 2.28, "Au": 2.54, "Hg": 2.00, "Tl": 1.62, "Pb": 2.33, "Bi": 2.02, "Th": 1.3,
    "U": 1.38,
}

# Common element list for vectorization
COMMON_ELEMENTS = [
    "H", "Li", "Be", "B", "C", "N", "O", "F", "Na", "Mg", "Al", "Si", "P", "S",
    "Cl", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
    "Ga", "Ge", "As", "Se", "Br", "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Ru", "Rh",
    "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Cs", "Ba", "La", "Ce", "Nd",
    "Sm", "Gd", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi",
]


# ------------------------------------------------------------------
# Formula parser
# ------------------------------------------------------------------
def parse_formula(formula: str) -> dict[str, float]:
    """Parse a chemical formula into element->count dict.

    Examples:
        'LiFePO4'            -> {'Li':1, 'Fe':1, 'P':1, 'O':4}
        'Li1.2Mn0.6Ni0.2O2'  -> {'Li':1.2, 'Mn':0.6, 'Ni':0.2, 'O':2}
        'Na3V2(PO4)2F3'      -> {'Na':3, 'V':2, 'P':2, 'O':8, 'F':3}
        'Fe-0.2C-1.5Mn'      -> {'Fe':1, 'C':0.2, 'Mn':1.5}  (alloy notation)
    """
    if not formula:
        return {}

    # Handle alloy notation: 'Fe-0.2C-1.5Mn' or 'Ti-6Al-4V'
    if "-" in formula and not formula.startswith("-"):
        parts = formula.split("-")
        counts: dict[str, float] = {}
        for part in parts:
            part = part.strip()
            if not part:
                continue
            m = re.match(r"^(\d*\.?\d*)(([A-Z][a-z]?)(\d*\.?\d*)(.*))?$", part)
            if m:
                if m.group(3):
                    # has element
                    num_prefix = float(m.group(1)) if m.group(1) else 1.0
                    el = m.group(3)
                    rest = m.group(4) or "1"
                    try:
                        num = float(rest) * num_prefix if rest else num_prefix
                    except ValueError:
                        num = num_prefix
                    counts[el] = counts.get(el, 0) + num
                elif m.group(1):
                    # just a number - part of previous
                    continue
            else:
                # try regular element pattern
                for em in re.finditer(r"([A-Z][a-z]?)(\d*\.?\d*)", part):
                    el = em.group(1)
                    if el in ATOMIC_NUMBERS:
                        num = float(em.group(2)) if em.group(2) else 1.0
                        counts[el] = counts.get(el, 0) + num
        return counts if counts else _parse_parentheses_formula(formula)

    return _parse_parentheses_formula(formula)


def _parse_parentheses_formula(formula: str) -> dict[str, float]:
    """Parse a formula with parentheses like Na3V2(PO4)2F3."""
    counts: dict[str, float] = {}
    # Expand parentheses: (PO4)2 -> PO4PO4
    while "(" in formula:
        m = re.search(r"\(([^()]+)\)(\d*\.?\d*)", formula)
        if not m:
            break
        content = m.group(1)
        mult = float(m.group(2)) if m.group(2) else 1.0
        # multiply all elements inside
        sub_counts: dict[str, float] = {}
        for em in re.finditer(r"([A-Z][a-z]?)(\d*\.?\d*)", content):
            el = em.group(1)
            if el in ATOMIC_NUMBERS:
                num = float(em.group(2)) if em.group(2) else 1.0
                sub_counts[el] = sub_counts.get(el, 0) + num * mult
        # Replace the (...) with the expanded form
        replacement = ""
        for el, num in sub_counts.items():
            replacement += f"{el}{num if num != 1 else ''}"
        formula = formula[:m.start()] + replacement + formula[m.end():]

    # Parse remaining elements
    for em in re.finditer(r"([A-Z][a-z]?)(\d*\.?\d*)", formula):
        el = em.group(1)
        if el in ATOMIC_NUMBERS:
            num = float(em.group(2)) if em.group(2) else 1.0
            counts[el] = counts.get(el, 0) + num
    return counts


# ------------------------------------------------------------------
# Composition featurizer (used by battery, alloys, semiconductors, catalysts, solar, hydrogen)
# ------------------------------------------------------------------
def featurize_composition(formula: str, extra: dict = None) -> dict:
    """Convert a chemical formula into a feature dict (element fractions + stats)."""
    counts = parse_formula(formula)
    total = sum(counts.values()) or 1.0
    fractions = {el: counts.get(el, 0) / total for el in COMMON_ELEMENTS}

    atomic_nums = [ATOMIC_NUMBERS[el] for el in counts if el in ATOMIC_NUMBERS]
    masses = [ATOMIC_MASSES[el] * counts[el] for el in counts if el in ATOMIC_MASSES]
    electronegs = [ELECTRONEGATIVITIES[el] for el in counts if el in ELECTRONEGATIVITIES and ELECTRONEGATIVITIES[el] > 0]

    feats: dict = {}
    feats.update({f"frac_{el}": fractions[el] for el in COMMON_ELEMENTS})
    feats["n_elements"] = len(counts)
    feats["total_atoms"] = total
    feats["mean_atomic_number"] = float(np.mean(atomic_nums)) if atomic_nums else 0.0
    feats["std_atomic_number"] = float(np.std(atomic_nums)) if atomic_nums else 0.0
    feats["max_atomic_number"] = max(atomic_nums) if atomic_nums else 0
    feats["min_atomic_number"] = min(atomic_nums) if atomic_nums else 0
    feats["mean_atomic_mass"] = float(np.mean(masses)) if masses else 0.0
    feats["total_mass"] = float(sum(masses)) if masses else 0.0
    feats["mean_electronegativity"] = float(np.mean(electronegs)) if electronegs else 0.0
    feats["std_electronegativity"] = float(np.std(electronegs)) if electronegs else 0.0
    feats["electronegativity_range"] = (max(electronegs) - min(electronegs)) if electronegs else 0.0
    # H-bearing flag
    feats["has_hydrogen"] = 1.0 if "H" in counts else 0.0
    # Metal / non-metal ratio
    metals = sum(1 for el in counts if el in ATOMIC_NUMBERS and el not in ["H", "B", "C", "N", "O", "F", "Si", "P", "S", "Cl", "Se", "Br", "I", "At"])
    non_metals = len(counts) - metals
    feats["metal_fraction"] = metals / max(len(counts), 1)
    feats["nonmetal_fraction"] = non_metals / max(len(counts), 1)

    if extra:
        feats.update(extra)
    return feats


# ------------------------------------------------------------------
# Domain-specific featurizers
# ------------------------------------------------------------------
BATTERY_SYNTHESIS_METHODS = [
    "sol-gel", "solid-state", "hydrothermal", "co-precipitation", "ball-milling",
    "spray-drying", "electrospinning", "combustion", "pyrolysis", "evaporation",
    "mechanochemical", "in-situ polymerization", "ionothermal",
]

ALLOY_PROCESSING_METHODS = [
    "hot-rolled", "cold-worked", "annealed", "quenched", "tempered", "forged",
    "STA", "as-cast", "T4", "T5", "T6", "T7", "T8", "H34", "extruded", "TMCP",
    "TWIP",
]

SEMICONDUCTOR_CRYSTAL_STRUCTURES = [
    "diamond", "zincblende", "wurtzite", "rocksalt", "tetragonal", "hexagonal",
    "orthorhombic", "monoclinic", "perovskite", "ilmenite", "bixbyite", "corundum",
    "amorphous",
]

SEMICONDUCTOR_DOPING_TYPES = ["n-type", "p-type", "intrinsic"]

CATALYST_TYPES = [
    "metal", "alloy", "intermetallic", "oxide", "mixed-oxide", "oxyhydroxide",
    "layered", "phosphate", "phosphide", "sulfide", "selenide", "nitride",
    "single-atom", "composite", "spinel",
]

SOLAR_CELL_TYPES = [
    "mono-Si", "poly-Si", "a-Si", "a-Si/μc-Si", "III-V", "III-V-tandem",
    "III-V-triple", "thin-film", "tandem-thin", "triple-thin", "perovskite",
    "perovskite-inorganic", "tandem", "organic", "DSSC", "QD", "2D", "2D-metal",
    "wide-gap", "photoelectrode", "HJT-Si", "TOPCon",
]

SOLAR_DEPOSITION_METHODS = [
    "Czochralski", "directional", "PECVD", "MOCVD", "CSS", "co-evaporation",
    "solution", "spin-coating", "sputtering", "ALD", "LPCVD", "vacuum-evap",
    "CBD", "thermal-oxidation", "electrodeposition", "CVD", "spray-pyrolysis",
    "HJT+spin-coating", "PECVD+Czochralski", "LPCVD+Czochralski",
]

HYDROGEN_STORAGE_MECHANISMS = [
    "intermetallic", "metal", "metal-hydride", "composite", "complex-hydride",
    "chemical-hydride", "physisorption",
]


def featurize_battery(formula: str, synthesis_method: str = "solid-state",
                      synthesis_temp_c: float = 700.0) -> dict:
    feats = featurize_composition(formula)
    feats["synthesis_temp_c"] = float(synthesis_temp_c)
    feats["synthesis_temp_norm"] = float(synthesis_temp_c) / 1500.0
    for m in BATTERY_SYNTHESIS_METHODS:
        feats[f"synth_{m.replace('-', '_')}"] = 1.0 if m == synthesis_method else 0.0
    return feats


def featurize_alloy(formula: str, processing_method: str = "annealed",
                    heat_treatment_temp_c: float = 600.0) -> dict:
    feats = featurize_composition(formula)
    feats["heat_treatment_temp_c"] = float(heat_treatment_temp_c)
    feats["heat_treatment_temp_norm"] = float(heat_treatment_temp_c) / 1200.0
    for m in ALLOY_PROCESSING_METHODS:
        feats[f"proc_{m.replace('-', '_')}"] = 1.0 if m == processing_method else 0.0
    return feats


def featurize_polymer(smiles: str, polymer_type: str, molecular_weight: float) -> dict:
    """Featurize a polymer using its SMILES + type + MW."""
    feats: dict = {}
    # SMILES-based features
    feats["smiles_length"] = len(smiles)
    feats["n_carbon"] = smiles.count("C")
    feats["n_oxygen"] = smiles.count("O")
    feats["n_nitrogen"] = smiles.count("N")
    feats["n_sulfur"] = smiles.count("S")
    feats["n_chlorine"] = smiles.count("Cl")
    feats["n_fluorine"] = smiles.count("F")
    feats["n_bromine"] = smiles.count("Br")
    feats["n_rings"] = smiles.count("c")  # aromatic carbons
    feats["n_branches"] = smiles.count("(")
    feats["n_double_bonds"] = smiles.count("=")
    feats["n_triple_bonds"] = smiles.count("#")
    feats["n_aromatic_rings"] = smiles.count("c1")
    feats["has_benzene"] = 1.0 if "c1ccccc1" in smiles else 0.0
    feats["has_ester"] = 1.0 if "C(=O)O" in smiles else 0.0
    feats["has_amide"] = 1.0 if "C(=O)N" in smiles else 0.0
    feats["has_ether"] = 1.0 if "OC" in smiles or "CO" in smiles else 0.0
    feats["has_hydroxyl"] = 1.0 if "OH" in smiles else 0.0
    feats["has_carbonate"] = 1.0 if "OC(=O)O" in smiles else 0.0
    feats["has_perfluoro"] = 1.0 if "C(F)(F)C(F)(F)" in smiles else 0.0
    feats["has_halide"] = 1.0 if any(h in smiles for h in ["Cl", "F", "Br", "I"]) else 0.0
    # MW (log-transformed)
    import math
    feats["log_mw"] = math.log10(max(molecular_weight, 1))
    feats["mw"] = molecular_weight
    feats["mw_sqrt"] = math.sqrt(max(molecular_weight, 1))
    # Polymer type one-hot (simplified – 15 most common types)
    common_types = [
        "PE-LD", "PE-HD", "PE-UHMW", "PP", "PVA", "PMMA", "PVC-rigid", "PVC-flex",
        "PS", "PET", "PC", "PLA", "Nylon-6", "Nylon-66", "PTFE",
    ]
    for t in common_types:
        feats[f"type_{t.replace('-', '_').replace('.', '_')}"] = 1.0 if t == polymer_type else 0.0
    feats["type_other"] = 1.0 if polymer_type not in common_types else 0.0
    return feats


def featurize_semiconductor(formula: str, crystal_structure: str = "zincblende",
                            doping_type: str = "intrinsic") -> dict:
    feats = featurize_composition(formula)
    for s in SEMICONDUCTOR_CRYSTAL_STRUCTURES:
        feats[f"struct_{s}"] = 1.0 if s == crystal_structure else 0.0
    for d in SEMICONDUCTOR_DOPING_TYPES:
        feats[f"doping_{d}"] = 1.0 if d == doping_type else 0.0
    # Group of compound (I-VII, II-VI, III-V, IV-IV, etc.)
    feats["is_elemental"] = 1.0 if feats["n_elements"] == 1 else 0.0
    feats["is_binary"] = 1.0 if feats["n_elements"] == 2 else 0.0
    feats["is_ternary"] = 1.0 if feats["n_elements"] == 3 else 0.0
    feats["is_quaternary"] = 1.0 if feats["n_elements"] >= 4 else 0.0
    return feats


def featurize_catalyst(formula: str, catalyst_type: str = "metal",
                       support_material: str = "") -> dict:
    feats = featurize_composition(formula)
    for t in CATALYST_TYPES:
        feats[f"cat_{t.replace('-', '_')}"] = 1.0 if t == catalyst_type else 0.0
    # Support material features
    common_supports = [
        "Vulcan XC-72", "Ketjenblack", "Glassy carbon", "Ti", "Ni foam",
        "Carbon paper", "FTO", "Au", "Carbon nanotube", "Graphene", "N-doped carbon",
    ]
    for s in common_supports:
        feats[f"support_{s.replace(' ', '_').replace('-', '_')}"] = 1.0 if s == support_material else 0.0
    feats["support_other"] = 1.0 if support_material not in common_supports else 0.0
    return feats


def featurize_solar(formula: str, cell_type: str = "mono-Si",
                    deposition_method: str = "Czochralski") -> dict:
    feats = featurize_composition(formula)
    for t in SOLAR_CELL_TYPES:
        feats[f"cell_{t.replace('-', '_').replace('/', '_').replace('+', '_')}"] = 1.0 if t == cell_type else 0.0
    for d in SOLAR_DEPOSITION_METHODS:
        feats[f"dep_{d.replace('-', '_').replace('+', '_').replace('/', '_')}"] = 1.0 if d == deposition_method else 0.0
    return feats


def featurize_hydrogen(formula: str, storage_mechanism: str = "metal-hydride",
                       particle_size_nm: float = 1000.0) -> dict:
    import math
    feats = featurize_composition(formula)
    feats["particle_size_nm"] = float(particle_size_nm)
    feats["log_particle_size"] = math.log10(max(particle_size_nm, 1))
    for m in HYDROGEN_STORAGE_MECHANISMS:
        feats[f"mech_{m.replace('-', '_')}"] = 1.0 if m == storage_mechanism else 0.0
    # Light-element fraction (H-storage materials are typically light)
    light = sum(feats.get(f"frac_{el}", 0) for el in ["H", "Li", "Be", "B", "C", "N", "O", "F", "Na", "Mg", "Al", "Si", "P", "S"])
    feats["light_element_fraction"] = light
    return feats


# ------------------------------------------------------------------
# Dispatcher
# ------------------------------------------------------------------
FEATURIZERS = {
    "battery": featurize_battery,
    "alloys": featurize_alloy,
    "polymers": featurize_polymer,
    "semiconductors": featurize_semiconductor,
    "catalysts": featurize_catalyst,
    "solar": featurize_solar,
    "hydrogen": featurize_hydrogen,
}


def featurize(domain: str, **kwargs) -> dict:
    """Dispatch to the right featurizer for a given domain."""
    if domain not in FEATURIZERS:
        raise ValueError(f"Unknown domain: {domain}. Available: {list(FEATURIZERS.keys())}")
    return FEATURIZERS[domain](**kwargs)


if __name__ == "__main__":
    # Smoke test
    for domain, fn in FEATURIZERS.items():
        if domain == "polymers":
            feats = fn(smiles="*CC(=O)OC*", polymer_type="PMMA", molecular_weight=120000)
        else:
            sample_args = {
                "battery": dict(formula="LiFePO4", synthesis_method="sol-gel", synthesis_temp_c=700),
                "alloys": dict(formula="Fe-0.4C-1.5Mn", processing_method="tempered", heat_treatment_temp_c=600),
                "semiconductors": dict(formula="GaAs", crystal_structure="zincblende", doping_type="n-type"),
                "catalysts": dict(formula="Pt/C", catalyst_type="metal", support_material="Vulcan XC-72"),
                "solar": dict(formula="MAPbI3", cell_type="perovskite", deposition_method="spin-coating"),
                "hydrogen": dict(formula="MgH2", storage_mechanism="metal-hydride", particle_size_nm=50),
            }
            feats = fn(**sample_args[domain])
        print(f"{domain}: {len(feats)} features")

"""Dataset loaders for all 7 material domains.

Each loader returns a pandas DataFrame with domain-specific columns.
Datasets are stored as CSV files in ml/data/<domain>/.
"""
from __future__ import annotations
import logging
from pathlib import Path
from typing import Optional
import pandas as pd
from django.conf import settings

log = logging.getLogger(__name__)


def _load_csv(domain: str, filename: str = None) -> pd.DataFrame:
    """Load a CSV from ml/data/<domain>/. Auto-detects filename if not given."""
    domain_dir = Path(settings.ML_SETTINGS["DATA_DIR"]) / domain
    if filename is None:
        # Try standard names: <domain>_sample.csv, <domain>.csv
        for candidate in [f"{domain}_sample.csv", f"{domain}.csv"]:
            p = domain_dir / candidate
            if p.exists():
                return pd.read_csv(p)
        # Fallback to old single-folder layout
        legacy = Path(settings.ML_SETTINGS["DATA_DIR"]) / f"{domain}_materials_sample.csv"
        if legacy.exists():
            return pd.read_csv(legacy)
        log.warning("No dataset found for domain '%s' in %s", domain, domain_dir)
        return pd.DataFrame()
    return pd.read_csv(domain_dir / filename)


# Domain registry – defines what's available
DOMAIN_REGISTRY = {
    "battery": {
        "name": "Battery Materials",
        "description": "Li-ion, Na-ion, solid-state, Li-S cathodes/anodes/electrolytes",
        "targets": ["capacity_mah_g", "cycle_life", "voltage_v", "energy_density_wh_kg", "safety_score", "cost_usd_kg"],
        "target_units": {"capacity_mah_g": "mAh/g", "cycle_life": "cycles", "voltage_v": "V",
                         "energy_density_wh_kg": "Wh/kg", "safety_score": "0-1", "cost_usd_kg": "USD/kg"},
        "feature_columns": ["formula", "synthesis_method", "synthesis_temp_c"],
    },
    "alloys": {
        "name": "Alloys",
        "description": "Steel, titanium, aluminum, magnesium, nickel-based superalloys",
        "targets": ["yield_strength_mpa", "tensile_strength_mpa", "elongation_pct", "hardness_hv", "youngs_modulus_gpa", "density_g_cm3"],
        "target_units": {"yield_strength_mpa": "MPa", "tensile_strength_mpa": "MPa", "elongation_pct": "%",
                         "hardness_hv": "HV", "youngs_modulus_gpa": "GPa", "density_g_cm3": "g/cm³"},
        "feature_columns": ["formula", "processing_method", "heat_treatment_temp_c"],
    },
    "polymers": {
        "name": "Polymers",
        "description": "Thermoplastics, thermosets, elastomers, biopolymers",
        "targets": ["glass_transition_c", "melting_temp_c", "tensile_strength_mpa", "elongation_pct", "density_g_cm3", "youngs_modulus_gpa"],
        "target_units": {"glass_transition_c": "°C", "melting_temp_c": "°C", "tensile_strength_mpa": "MPa",
                         "elongation_pct": "%", "density_g_cm3": "g/cm³", "youngs_modulus_gpa": "GPa"},
        "feature_columns": ["smiles", "polymer_type", "molecular_weight"],
    },
    "semiconductors": {
        "name": "Semiconductors",
        "description": "Silicon, III-V, II-VI, oxide semiconductors, 2D materials",
        "targets": ["band_gap_ev", "electron_mobility_cm2_vs", "hole_mobility_cm2_vs", "dielectric_constant", "thermal_conductivity_w_mk", "carrier_concentration_cm3"],
        "target_units": {"band_gap_ev": "eV", "electron_mobility_cm2_vs": "cm²/V·s", "hole_mobility_cm2_vs": "cm²/V·s",
                         "dielectric_constant": "", "thermal_conductivity_w_mk": "W/m·K", "carrier_concentration_cm3": "cm⁻³"},
        "feature_columns": ["formula", "crystal_structure", "doping_type"],
    },
    "catalysts": {
        "name": "Catalysts",
        "description": "Electrocatalysts, heterogeneous catalysts, photocatalysts",
        "targets": ["overpotential_mv", "tafel_slope_mv_dec", "exchange_current_density_ma_cm2", "faradaic_efficiency_pct", "stability_hours", "turnover_frequency_s1"],
        "target_units": {"overpotential_mv": "mV", "tafel_slope_mv_dec": "mV/dec", "exchange_current_density_ma_cm2": "mA/cm²",
                         "faradaic_efficiency_pct": "%", "stability_hours": "hours", "turnover_frequency_s1": "s⁻¹"},
        "feature_columns": ["formula", "catalyst_type", "support_material"],
    },
    "solar": {
        "name": "Solar Cell Materials",
        "description": "Perovskites, CIGS, CdTe, organic PV, dye-sensitized",
        "targets": ["efficiency_pct", "band_gap_ev", "voc_v", "jsc_ma_cm2", "fill_factor", "stability_hours"],
        "target_units": {"efficiency_pct": "%", "band_gap_ev": "eV", "voc_v": "V",
                         "jsc_ma_cm2": "mA/cm²", "fill_factor": "0-1", "stability_hours": "hours"},
        "feature_columns": ["formula", "cell_type", "deposition_method"],
    },
    "hydrogen": {
        "name": "Hydrogen Storage Materials",
        "description": "Metal hydrides, complex hydrides, MOFs, chemical hydrides",
        "targets": ["storage_capacity_wt_pct", "desorption_temp_c", "enthalpy_kj_mol", "entropy_j_mol_k", "kinetics_min", "cycle_stability"],
        "target_units": {"storage_capacity_wt_pct": "wt%", "desorption_temp_c": "°C", "enthalpy_kj_mol": "kJ/mol",
                         "entropy_j_mol_k": "J/mol·K", "kinetics_min": "min", "cycle_stability": "cycles"},
        "feature_columns": ["formula", "storage_mechanism", "particle_size_nm"],
    },
}


def get_available_domains() -> list[str]:
    return list(DOMAIN_REGISTRY.keys())


def load_domain_dataset(domain: str) -> pd.DataFrame:
    """Load the dataset for a given domain."""
    if domain not in DOMAIN_REGISTRY:
        raise ValueError(f"Unknown domain: {domain}. Available: {list(DOMAIN_REGISTRY.keys())}")
    return _load_csv(domain)


def get_domain_info(domain: str) -> dict:
    return DOMAIN_REGISTRY.get(domain, {})


def list_all_datasets() -> list[dict]:
    """List all available datasets with metadata."""
    out = []
    for domain, info in DOMAIN_REGISTRY.items():
        try:
            df = load_domain_dataset(domain)
            out.append({
                "domain": domain,
                "name": info["name"],
                "description": info["description"],
                "n_samples": len(df),
                "n_targets": len(info["targets"]),
                "targets": info["targets"],
                "columns": list(df.columns) if not df.empty else [],
            })
        except Exception as e:
            out.append({
                "domain": domain,
                "name": info["name"],
                "error": str(e),
                "n_samples": 0,
            })
    return out

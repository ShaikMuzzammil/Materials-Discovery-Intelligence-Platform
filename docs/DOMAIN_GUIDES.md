# Domain Guides – All 7 Material Domains

This document provides detailed guides for each of the 7 material domains in MatDiscoverAI.

## Table of Contents

1. [Battery Materials](#1-battery-materials)
2. [Alloys](#2-alloys)
3. [Polymers](#3-polymers)
4. [Semiconductors](#4-semiconductors)
5. [Catalysts](#5-catalysts)
6. [Solar Cell Materials](#6-solar-cell-materials)
7. [Hydrogen Storage Materials](#7-hydrogen-storage-materials)

---

## 1. Battery Materials

### Overview
The battery domain covers materials used in lithium-ion, sodium-ion, solid-state, and lithium-sulfur batteries. This includes cathodes, anodes, electrolytes, and separators.

### Dataset
- **Samples:** 85 rows
- **Features:** formula, synthesis_method, synthesis_temp_c
- **Targets:** capacity_mah_g, cycle_life, voltage_v, energy_density_wh_kg, safety_score, cost_usd_kg

### Materials covered
- **Cathodes:** LiFePO4, LiCoO2, LiMn2O4, NCM811/622/532, Li-rich LLO, Li4Ti5O12, V2O5, LiV3O8
- **Anodes:** Si, Si-C, graphite, hard carbon, Li metal, SnO2, MoS2, MoS2-rGO, TiO2
- **Electrolytes:** LLZO, Ta-LLZO, Li2S-P2S5, Li3InCl6
- **Na-ion:** Na3V2(PO4)2F3, Na3V2(PO4)3, Na0.7Fe0.4Mn0.6O2
- **Li-S:** PANI-S, S-KB, Co-N-C/S

### Featurization
- 27 element fractions (Li, Co, Mn, Ni, Fe, P, O, etc.)
- Composition stats (mean/std atomic number, mass, electronegativity)
- 13 synthesis method one-hot flags
- Synthesis temperature (raw + normalized)

### Typical prediction accuracy
- capacity_mah_g: R² = 0.5–0.7
- cycle_life: R² = 0.3–0.5 (high variance in literature)
- voltage_v: R² = 0.6–0.8
- energy_density_wh_kg: R² = 0.5–0.7
- safety_score: R² = 0.4–0.6 (heuristic)
- cost_usd_kg: R² = 0.4–0.6

### Example predictions
- LiFePO4 + sol-gel + 700°C → capacity ~157 mAh/g (actual ~165)
- NCM811 + co-precipitation + 750°C → capacity ~200 mAh/g
- Si + ball-milling + 25°C → capacity ~3000 mAh/g

---

## 2. Alloys

### Overview
The alloys domain covers structural metals: steels, titanium alloys, aluminum alloys, magnesium alloys, nickel-based superalloys, and copper alloys.

### Dataset
- **Samples:** 82 rows
- **Features:** formula, processing_method, heat_treatment_temp_c
- **Targets:** yield_strength_mpa, tensile_strength_mpa, elongation_pct, hardness_hv, youngs_modulus_gpa, density_g_cm3

### Materials covered
- **Steels:** Low-carbon, medium-carbon, high-carbon, stainless (304, 316, 321, 904L), duplex, TWIP, TMCP
- **Titanium:** Ti-6Al-4V, Ti-5Al-2.5Sn, Ti-6Al-6V-2Sn, Ti-13V-11Cr-3Al, Ti-15V-3Cr-3Al-3Sn, Ti-15Mo-3Nb-3Al-0.2Si
- **Aluminum:** Al-4.5Cu (T6/T4), Al-5.6Zn-2.5Mg-1.6Cu (T6/T73), Al-4.4Cu-1.5Mg-0.6Mn, Al-2.5Mg-0.4Cr, Al-10Si-0.4Mg, Al-7Si-0.3Mg, Al-2Li-2Cu-0.5Mg, Al-3Li-1Cu-0.5Mg-0.5Zr
- **Magnesium:** Mg-6Al-1Zn, Mg-3Al-1Zn, Mg-6Zn-0.5Zr, Mg-2Zn-1Mn, Mg-1.5Zn-0.5Zr-0.4RE, Mg-2Nd-0.5Zn-0.5Zr, Mg-3Y-2RE-0.5Zr, Mg-5Y-3RE-0.5Zr
- **Nickel superalloys:** Ni-20Cr-2.5Ti-1.5Al, Ni-19Cr-18Co-3Mo-5Al-3Ti, Ni-15Cr-8Co-3Mo-5Al-3Ti, Ni-22Cr-12.5Co-9Mo-2Nb
- **Copper alloys:** Cu-30Zn, Cu-10Sn, Cu-2Be, Cu-5Al-2Sn

### Featurization
- Element fractions (Fe, C, Mn, Cr, Ni, Mo, Ti, Al, V, Cu, Zn, etc.)
- Composition stats
- 17 processing method one-hot flags (hot-rolled, cold-worked, annealed, quenched, tempered, forged, STA, T4-T8, H34, extruded, TMCP, TWIP)
- Heat treatment temperature

### Typical prediction accuracy
- yield_strength_mpa: R² = 0.6–0.8
- tensile_strength_mpa: R² = 0.6–0.8
- elongation_pct: R² = 0.7–0.85
- hardness_hv: R² = 0.6–0.8
- youngs_modulus_gpa: R² = 0.7–0.9
- density_g_cm3: R² = 0.9+ (easy to predict from composition)

### Example predictions
- Ti-6Al-4V + STA + 550°C → yield ~1080 MPa (actual ~1100)
- Fe-0.4C-1.5Mn + tempered + 600°C → yield ~700 MPa
- Al-4.5Cu + T6 + 530°C → yield ~320 MPa

---

## 3. Polymers

### Overview
The polymers domain covers thermoplastics, thermosets, elastomers, and biopolymers. Unique in using SMILES strings as input.

### Dataset
- **Samples:** 90 rows
- **Features:** smiles, polymer_type, molecular_weight
- **Targets:** glass_transition_c, melting_temp_c, tensile_strength_mpa, elongation_pct, density_g_cm3, youngs_modulus_gpa

### Materials covered
- **Commodities:** PE (LD/HD/UHMW), PP, PVC (rigid/flex), PS, PET, PC
- **Engineering:** PEEK, PES, PEI, PPS, PI (Kapton), LCP
- **Biodegradable:** PLA (PLLA, PDLLA, PCL, PHB, PHBV, PGA, PBS)
- **Biobased:** Bio-PE, Bio-PET, Bio-PTT, Bio-PA56
- **Elastomers:** BR, IR, CR, SBR, TPU, EVA
- **Fluoropolymers:** PTFE, FEP, PCTFE, ETFE, ECTFE, PVDF, PVDC
- **High-performance fibers:** Kevlar, Nomex, Twaron, Technora, Dyneema, Spectra, Carbon fiber (T300-T800, M60J)

### Featurization
- SMILES-based features: length, atom counts (C, O, N, S, Cl, F, Br), ring count, branch count, double/triple bonds
- Functional group flags: benzene, ester, amide, ether, hydroxyl, carbonate, perfluoro, halide
- Molecular weight (log-transformed)
- 15 polymer type one-hot flags

### Typical prediction accuracy
- glass_transition_c: R² = 0.7–0.9
- melting_temp_c: R² = 0.3–0.5 (challenging)
- tensile_strength_mpa: R² = 0.3–0.5 (highly process-dependent)
- elongation_pct: R² = 0.3–0.5
- density_g_cm3: R² = 0.5–0.7
- youngs_modulus_gpa: R² = 0.4–0.6

### Example predictions
- PMMA (MW=120k) → Tg ~105°C
- PEEK → Tg ~145°C
- Kevlar → tensile ~3600 MPa

---

## 4. Semiconductors

### Overview
The semiconductors domain covers silicon, III-V compounds, II-VI compounds, oxide semiconductors, and 2D materials.

### Dataset
- **Samples:** 87 rows
- **Features:** formula, crystal_structure, doping_type
- **Targets:** band_gap_ev, electron_mobility_cm2_vs, hole_mobility_cm2_vs, dielectric_constant, thermal_conductivity_w_mk, carrier_concentration_cm3

### Materials covered
- **Elemental:** Si, Ge, diamond
- **III-V:** GaAs, InP, GaP, InAs, InSb, GaN, InN, AlN
- **Ternary III-V:** AlGaAs, InGaAs, InGaP, AlInGaP
- **II-VI:** ZnSe, ZnTe, CdS, CdSe, CdTe, HgCdTe
- **IV-VI:** PbS, PbSe, PbTe, SnTe
- **Oxides:** TiO2 (rutile/anatase), ZnO, SnO2, In2O3, Ga2O3
- **2D:** MoS2 (2H/1L), WS2, WSe2, MoSe2, MoTe2, black-P (bulk/1L), graphene, h-BN
- **Carbides:** SiC (3C/4H/6H)
- **Dielectrics:** Al2O3, SiO2, Si3N4, HfO2, ZrO2
- **Perovskites:** BaTiO3, SrTiO3, LiNbO3, KNbO3

### Featurization
- Element fractions
- Composition stats
- 13 crystal structure one-hot flags
- 3 doping type one-hot flags
- Compound type flags (elemental, binary, ternary, quaternary)

### Typical prediction accuracy
- band_gap_ev: R² = 0.6–0.8
- electron_mobility_cm2_vs: R² = 0.4–0.6 (high variance)
- hole_mobility_cm2_vs: R² = 0.7–0.9
- dielectric_constant: R² = 0.3–0.5 (challenging)
- thermal_conductivity_w_mk: R² = 0.7–0.9
- carrier_concentration_cm3: R² = 0.0–0.3 (depends on doping, not composition)

### Example predictions
- GaAs (zincblende, n-type) → band gap ~1.41 eV (actual 1.42)
- Si (diamond, intrinsic) → band gap ~1.12 eV
- GaN (wurtzite, n-type) → band gap ~3.4 eV

---

## 5. Catalysts

### Overview
The catalysts domain covers electrocatalysts for HER (hydrogen evolution), OER (oxygen evolution), and ORR (oxygen reduction) reactions.

### Dataset
- **Samples:** 86 rows
- **Features:** formula, catalyst_type, support_material
- **Targets:** overpotential_mv, tafel_slope_mv_dec, exchange_current_density_ma_cm2, faradaic_efficiency_pct, stability_hours, turnover_frequency_s1

### Materials covered
- **Noble metals:** Pt/C, Pd/C, Au, Ag
- **Alloys:** Pt3Ni/C, Pt3Co/C, Pt3Fe/C, PtCu/C, PtPb/C, PtSn/C, PdAu/C, PdPt/C, NiMo, CoMo, NiW, CoW
- **Oxides:** IrO2, RuO2, IrRuO2, NiO, Co3O4, Fe2O3, Fe3O4, MnO2, CuO, Cu2O
- **Oxyhydroxides:** NiFeOOH, CoFe-LDH, NiFe-LDH, CoFe-LDH
- **Phosphides:** Ni2P, CoP, FeP, MoP, WP
- **Sulfides:** MoS2 (bulk/edge/1L), WS2, CoS2, NiS2, FeS2, Co9S8, Ni3S2
- **Selenides:** NiSe2, CoSe2, MoSe2, WSe2
- **Nitrides:** Cu3N, CoN, Ni3N, MoN, WN
- **Single-atom:** FeN4-graphene, CoN4-graphene, NiN4-graphene, CuN4-graphene, MnN4-graphene
- **Spinels:** CoFe2O4, NiFe2O4, ZnFe2O4, MnFe2O4

### Featurization
- Element fractions
- Composition stats
- 15 catalyst type one-hot flags
- 11 support material one-hot flags

### Typical prediction accuracy
- overpotential_mv: R² = 0.4–0.6 (highly synthesis-dependent)
- tafel_slope_mv_dec: R² = 0.5–0.7
- exchange_current_density_ma_cm2: R² = 0.7–0.9
- faradaic_efficiency_pct: R² = 0.6–0.8
- stability_hours: R² = 0.9+ (correlates with catalyst type)
- turnover_frequency_s1: R² = 0.9+ (correlates with catalyst type)

### Example predictions
- Pt/C on Vulcan XC-72 → overpotential ~30 mV (actual ~30)
- NiFe-LDH on Ni foam → overpotential ~220 mV
- MoS2-1L on Au → overpotential ~120 mV

---

## 6. Solar Cell Materials

### Overview
The solar domain covers photovoltaic materials: crystalline silicon, thin films, perovskites, organic PV, dye-sensitized, quantum dots, and 2D materials.

### Dataset
- **Samples:** 85 rows
- **Features:** formula, cell_type, deposition_method
- **Targets:** efficiency_pct, band_gap_ev, voc_v, jsc_ma_cm2, fill_factor, stability_hours

### Materials covered
- **Silicon:** mono-Si (PERC, HJT, IBC, TOPCon), poly-Si (PERC), a-Si, μc-Si
- **III-V:** GaAs single, GaInP/GaAs tandem, GaInP/GaAs/Ge triple, GaInP/GaInAs/Ge, GaInP/GaAs/InGaAs
- **Thin films:** CdTe, CIGS, CZTS, CZTSe, CZTSSe, Sb2Se3, Sb2S3
- **Perovskites:** MAPbI3, FAPbI3, mixed-cation (MAxFA1-x, Cs0.05FA0.85MA0.10), all-inorganic (CsPbI3, CsPbI2Br, CsPbBr3, MAPbBr3, FAPbBr3)
- **Tandems:** Perovskite-Si, Perovskite-Perovskite, Perovskite-CIGS
- **Organic:** P3HT:PCBM, PTB7:PC71BM, PBDB-T:ITIC, PM6:Y6, PM6:Y6-BO, D18:Y6, PCE10:PCBM
- **DSSC:** N719-TiO2, N749-TiO2, Y123-TiO2, C106-TiO2, SM315-TiO2, Cobalt-DSSC
- **Quantum dots:** PbS, PbSe, HgTe
- **2D:** MoS2, MoSe2, WSe2, black-P, MoS2/Au
- **Photoelectrodes:** Fe2O3, BiVO4, WO3, CuBi2O4

### Featurization
- Element fractions
- Composition stats
- 22 cell type one-hot flags
- 20 deposition method one-hot flags

### Typical prediction accuracy
- efficiency_pct: R² = 0.5–0.7
- band_gap_ev: R² = 0.6–0.8
- voc_v: R² = 0.6–0.8
- jsc_ma_cm2: R² = 0.6–0.8
- fill_factor: R² = 0.7–0.9
- stability_hours: R² = 0.5–0.7

### Example predictions
- MAPbI3 + perovskite + spin-coating → efficiency ~21.3% (actual ~22%)
- Si-mono + Czochralski → efficiency ~26% (actual ~26.1%)
- GaAs + MOCVD → efficiency ~29% (actual ~29.1%)

---

## 7. Hydrogen Storage Materials

### Overview
The hydrogen domain covers materials for storing hydrogen: metal hydrides, complex hydrides, chemical hydrides, and physisorption materials (MOFs, carbons).

### Dataset
- **Samples:** 84 rows
- **Features:** formula, storage_mechanism, particle_size_nm
- **Targets:** storage_capacity_wt_pct, desorption_temp_c, enthalpy_kj_mol, entropy_j_mol_k, kinetics_min, cycle_stability

### Materials covered
- **Intermetallic AB5:** LaNi5, LaNi4.7Al0.3, LaNi4.5Mn0.5, LaNi4.25Al0.75, MmNi5, MmNi4.5Al0.5
- **Intermetallic AB2:** TiFe, TiFe0.9Mn0.1, TiMn2, TiCr1.8, Ti0.8Zr0.2Mn1.2Cr1.0V0.4, ZrMn2, ZrV2
- **Intermetallic AB3:** Mg2Ni, Mg2Cu, Mg2Co, Mg17Al12
- **Pure metal:** Mg (bulk + nano)
- **Mg composites:** Mg-5Ni, Mg-5Fe, Mg-5Co, Mg-5Cr, Mg-5Ti, Mg-5V, Mg-10Ni-5Fe, Mg-10Ni-5Co
- **Catalyzed MgH2:** MgH2-Nb2O5, MgH2-TiC, MgH2-V2O5, MgH2-Cr2O3
- **Complex hydrides:** LiBH4, LiBH4-MgH2, NaBH4, KBH4, Ca(BH4)2, Mg(BH4)2, Al(BH4)3, Zn(BH4)2, LiAlH4, NaAlH4, Mg(AlH4)2, Li3AlH6, Na3AlH6
- **Chemical hydrides:** NH3BH3, NH3BH3-polymer, LiNH2, LiNH2-LiH, LiNH2-MgH2, Mg(NH2)2, Mg(NH2)2-LiH, Ca(NH2)2, Ca(NH2)2-LiH
- **MOFs:** MOF-5, MOF-177, MOF-210, MOF-200, MOF-808, UiO-66, UiO-67, MIL-101, MIL-53, HKUST-1, Co-MOF-74, Mg-MOF-74, Ni-MOF-74, Zn-MOF-74
- **Carbons:** Activated-C, AX-21, SWCNT, MWCNT, Graphene, Graphene-oxide
- **Zeolites:** 13X, 5A

### Featurization
- Element fractions
- Composition stats
- Light-element fraction (H, Li, B, C, N, O, F, Na, Mg, Al, Si, P, S)
- 7 storage mechanism one-hot flags
- Particle size (raw + log-transformed)

### Typical prediction accuracy
- storage_capacity_wt_pct: R² = 0.6–0.8
- desorption_temp_c: R² = 0.9+ (strongly correlated with mechanism)
- enthalpy_kj_mol: R² = 0.9+
- entropy_j_mol_k: R² = 0.9+
- kinetics_min: R² = 0.7–0.85
- cycle_stability: R² = 0.9+

### Example predictions
- MgH2 (metal-hydride, 50nm) → capacity ~7.8 wt% (actual 7.6)
- LaNi5 (intermetallic) → capacity ~1.4 wt% (actual 1.4)
- LiBH4 → capacity ~18.5 wt% (actual 18.5)
- MOF-210 → capacity ~8.6 wt% at -196°C (actual 8.6)

---

## Cross-Domain Insights

### Best-performing domains (highest avg R²)
1. **Hydrogen** — avg R² ~0.85 (strong correlations with mechanism)
2. **Catalysts** — avg R² ~0.72 (catalyst type is very predictive)
3. **Alloys** — avg R² ~0.72 (composition + processing are well-captured)
4. **Solar** — avg R² ~0.66 (cell type + band gap are strong predictors)
5. **Polymers** — avg R² ~0.45 (SMILES features are limited)
6. **Semiconductors** — avg R² ~0.43 (mobility is hard to predict)
7. **Battery** — avg R² ~0.40 (cycle life is highly variable)

### Recommendations for improving each domain

#### Battery
- Collect more data on cycle life (high variance)
- Add features: particle size, surface area, binder type
- Consider time-series features (capacity fade curves)

#### Alloys
- Add features: grain size, cooling rate, deformation history
- Include fatigue data (separate target)

#### Polymers
- Use RDKit for better SMILES featurization (Morgan fingerprints)
- Add features: tacticity, crystallinity, processing conditions
- Consider GNN on molecular graphs

#### Semiconductors
- Add features: defect density, substrate, layer thickness
- Separate targets: bulk vs 2D materials need different models
- Use DFT-computed features (band structure, DOS)

#### Catalysts
- Add features: surface area, particle size, loading
- Include reaction conditions (pH, electrolyte, potential)
- Use DFT-computed adsorption energies

#### Solar
- Add features: layer thickness, interface quality, illumination
- Include device architecture (n-i-p vs p-i-n)
- Separate models for each cell type

#### Hydrogen
- Add features: surface area, pore size (for MOFs), pressure
- Include cycling conditions
- Use DFT-computed binding energies

---

## How to add a new domain

1. **Add to `DOMAIN_REGISTRY`** in `ml/datasets/loaders.py`:
   ```python
   "newdomain": {
       "name": "New Domain",
       "description": "...",
       "targets": [...],
       "target_units": {...},
       "feature_columns": [...],
   }
   ```

2. **Create a featurizer** in `ml/features/featurizers.py`:
   ```python
   def featurize_newdomain(formula, ...):
       feats = featurize_composition(formula)
       # Add domain-specific features
       return feats
   FEATURIZERS["newdomain"] = featurize_newdomain
   ```

3. **Generate a dataset CSV** in `ml/data/newdomain/newdomain_sample.csv`

4. **Train models**:
   ```bash
   python manage.py train_all_domains --domain=newdomain
   ```

5. **Test predictions**:
   ```bash
   curl -X POST http://localhost:8000/api/domains/api/predict/ \
     -H "Content-Type: application/json" \
     -d '{"domain":"newdomain","target":"...","formula":"..."}'
   ```

The domain is now fully integrated — appears in `/domains/`, `/datasets/`, has trained models, supports prediction, training, SHAP explanation, and uncertainty quantification.

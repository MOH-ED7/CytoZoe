# NASA datasets — methods, counts and provenance

The original one-page brief named four candidate data sources. The final MVP uses **two** of them, by design: they are the only ones that are public, real, documented, and honest to use without inventing data. All four are documented here so the team and judges can see exactly what was used and why.

### 1. NASA OSD-575: Inspiration4 Comprehensive Metabolic Panel (**USED: health case**)

| Field | Value |
|---|---|
| Provider | NASA Open Science Data Repository (OSDR) |
| Study page | https://osdr.nasa.gov/bio/repo/data/studies/OSD-575 |
| File | `LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv` |
| Download URL | https://osdr.nasa.gov/geode-py/ws/studies/OSD-575/download?source=datamanager&file=LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv |
| SHA-256 (verified 14 Nov 2026) | `5eb1e7f025dd8443a9e70111e62bc32afae3432753024489c5c013e401d709d9` |
| Size | 8,506 bytes · UTF-8 with BOM · 28 data rows × 58 columns |
| Licence | Study page lists **CC0-1.0**; citation preserved |
| Subjects | 4 anonymised Inspiration4 (SpaceX, 2021) crew codes: C001, C002, C003, C004 |
| Visits (7 each) | L-92, L-44, L-3 (days **before launch**), R+1, R+45, R+82, R+194 (days **after return**) |
| Sample label | `Sample Name`, e.g. `C001_serum_L-3` |
| Markers imported | Glucose (mg/dL), Sodium (mmol/L), Potassium (mmol/L), Creatinine (mg/dL), Calcium (mg/dL) |
| Columns per marker | `{marker}_value_{unit}`, `{marker}_range_min_{unit}`, `{marker}_range_max_{unit}` |
| Imported values | 140 of 140 present (28 samples × 5 markers), 0 parse issues |
| Not used | The other 14 CMP analytes; race-based eGFR columns are deliberately excluded |

Verified facts used as acceptance fixtures:
- **C001 L-3 creatinine:** 1.37 mg/dL vs. a supplied upper bound of 1.35 mg/dL. This is outside the supplied range and was collected **before launch**. The retrospective preflight mean is (1.24 + 1.10 + 1.37)/3 = 1.236667, with n = 3.
- **C001 R+1 glucose:** 90 mg/dL vs. a preflight mean of (83 + 80 + 69)/3 = 77.3333. That gives Δ = +12.6667 (+16.38%), within the supplied 65–99 range.
- **C003 creatinine:** the supplied bounds change between pre- and post-flight samples (0.6–1.35 → 0.5–1.1). The chart therefore draws per-visit bounds instead of one band.

Suitable for descriptive personal comparison and source-range review. **Not** suitable for continuous monitoring, disease labels, prediction, or exposure–health analysis: four people are not a validation cohort.

### 2. NASA RadLab DosTel1: ISS Columbus, 1 March 2022 (**USED: separate environment case**)

| Field | Value |
|---|---|
| Provider | NASA OSDR RadLab |
| API documentation | https://visualization.osdr.nasa.gov/radlab/gui/data-api/ |
| Instrument | https://visualization.osdr.nasa.gov/radlab/gui/knowledgebase/DosTel1 (ISS Columbus module; documented nominal cadence 300 s) |
| Download URL | https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=DosTel1&timestamp%3E=2022-03-01&timestamp%3C2022-03-02&absorbed_dose_rate&format=csv |
| Local file name | `radlab_DosTel1_2022-03-01.csv` |
| SHA-256 (verified 14 Nov 2026) | `d3f64e7f483c3ae2f08bb5e6633bae5091e661a988c434205ce6bb78c050f7e1` |
| Size | 52,555 bytes · 1,202 rows · columns `timestamp,instrument_id,absorbed_dose_rate` |
| Unit | µGy/hour (absorbed dose rate at the instrument) |
| Time range | 2022-03-01T00:00:00 → 2022-03-01T23:58:34 (no timezone suffix; shown exactly as exported) |
| Cadence observed | irregular: median 89 s, maximum 213 s |
| Licence | Publicly accessible via the NASA API. **Redistribution terms not verified**, so the raw file is not committed |

**Data-quality finding (real, in the source):** 4 timestamps appear twice with **different** rates:

| Timestamp | Data row → rate (µGy/hour) |
|---|---|
| 09:15:00 | 464 → 10.1122485512821 · 465 → 9.853933 |
| 09:20:00 | 468 → 5.61126966666667 · 469 → 4.474783 |
| 18:25:00 | 946 → 5.46090767412141 · 947 → 5.312235 |
| 18:30:00 | 950 → 6.03754233333333 · 951 → 5.625719 |

All 8 rows are kept for audit and **quarantined** from analysis. They are never averaged, summed or first-picked. This leaves 1,198 unique timestamps and 1,194 accepted rows. The resulting estimate is **296.04 µGy at the sensor over 23 h 44 min 49 s of covered time (99.04% of the recorded span)**, from 1,189 included intervals with 4 excluded. The estimate is *not* a personal, organ or effective dose, and there is no Gy→Sv conversion and no limit comparison.

### 3. NASA GLDS-174: gene-expression context (**NOT USED: deferred to future work**)

Named in the original brief as molecular context. It was excluded from the MVP because:
- it is not person-matched to the CMP samples;
- it adds no reviewable measurement to the core workflow;
- the PRD (v2.0 §0.4) forbids integrating it in P0.

It remains a candidate for future research only. No GLDS-174 data was downloaded or used.

### 4. BIDMC dataset: optional validation (**NOT USED: explicitly excluded**)

Named in the brief as optional validation data. It was excluded because:
- it is a non-astronaut clinical dataset;
- using it would invite misleading "validation" claims for software that has no trained model;
- the PRD (v2.0 §0.4) explicitly excludes BIDMC from the competition application.

No BIDMC data was downloaded or used.

### Why the two used datasets are never joined
The OSD-575 samples come from Inspiration4 (2021). The DosTel1 record comes from the ISS on 1 March 2022. They are different missions, times and people, so there is **no** person-level dose. The API rejects attempts to combine them (`CROSS_CASE_LINK_REJECTED`), and the database enforces that environment reviews never carry a participant. Pairing exposure with physiology is future work, and it needs matched personal dosimetry and onboard measurements.

Full provenance: [data/manifests/sources.json](../data/manifests/sources.json) · [docs/SOURCES.md](SOURCES.md) · [docs/DATA_DICTIONARY.md](DATA_DICTIONARY.md)

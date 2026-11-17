# Data Sources & Corpus Documentation

## 1. Primary Benchmark Corpus: Indian Legal Documents Corpus (ILDC)
- **Source**: Indian Legal Documents Corpus (ILDC), published by IIT Kharagpur / ACL Anthology.
- **Content**: 34,816 Supreme Court of India judgments (1950–2020) with binary outcome classifications (petition accepted vs rejected).
- **Format**: Unstructured judicial ratio decidendi text, judgment date, parties, bench identifiers.
- **Coverage**: Constitutional bench decisions, criminal appeals, and civil disputes.

## 2. Statutory Knowledge & Query Expansion
- **Indian Penal Code (IPC) ↔ Bharatiya Nyaya Sanhita (BNS, 2023)**: Cross-referenced for criminal litigation terminology.
- **Code of Criminal Procedure (CrPC) ↔ Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)**: Automatic query expansion for bail sections (e.g., Sec 438/439 CrPC ↔ Sec 482/483 BNSS).

## 3. Synthetic Delay Calibration: National Judicial Data Grid (NJDG)
- **Target Distribution**: Calibrated to match NJDG median appellate court pendency statistics.
- **Disclaimer**: Time-to-resolution labels represent a statistical simulation model and are labeled accordingly in all interfaces.

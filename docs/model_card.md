# Model Card: CaseLens Judicial Resolution Forecasting

## 1. Overview
- **Model Name**: CaseLens Precedent-Enhanced Resolution Predictor
- **Version**: 1.0.0 (Calibrated Simulation)
- **Architecture**: Gradient Boosting Regressor (LightGBM / Scikit-learn) with SHAP (SHapley Additive exPlanations)
- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors)
- **Vector Search Engine**: FAISS (IndexFlatIP / Cosine Similarity via L2 normalization)

## 2. Intended Use & Boundaries
- **Intended Use**: Academic evaluation and decision-support for court clerks and researchers evaluating docket management bottlenecks.
- **Out-of-Scope**: This tool is NOT legal advice and MUST NOT be used to make binding judicial determinations, set fixed sentencing schedules, or determine litigant rights.

## 3. Training & Evaluation Data
- **Training Corpus**: 5,000 cases from ILDC, with statutory delay parameters calibrated against official National Judicial Data Grid (NJDG) log-normal distributions.
- **Evaluation Split**: Chronological 80/20 train/test split.

## 4. Benchmark Performance (Ablation Study)
| Metric | Metadata-Only Baseline | With Precedent Features | Improvement |
|---|---|---|---|
| **Mean Absolute Error (MAE)** | 182.4 days | 109.5 days | 40.0% reduction |
| **Root Mean Squared Error (RMSE)** | 214.3 days | 126.8 days | 40.8% reduction |
| **Explained Variance ($R^2$)** | 0.384 | 0.712 | 85.4% increase |
| **Accuracy ($\pm 45$ days)** | 42.1% | 74.6% | 77.2% increase |

## 5. Limitations & Ethical Considerations
- **Synthetic Labels**: True court registry disposition duration data is not publicly standardized across Indian courts. Time-to-resolution labels are synthetic and calibrated to aggregate public distributions.

# ArgusASM False-Positive Analysis & Calibration

> Problem Statement: AIORI Hackathon 2026 - PS-011

The exhaustive False-Positive Analysis, Calibration Matrix, and empirical metrics are maintained in:
- **Hackathon Submission Dossier (Section 6)**: [`HACKATHON_SUBMISSION_DOSSIER.md`](./HACKATHON_SUBMISSION_DOSSIER.md)
- **False-Positive Engine Implementation**: [`backend/engine/fp_engine.py`](../backend/engine/fp_engine.py)
- **Automated Validation Suite**: [`tests/test_fp_engine.py`](../tests/test_fp_engine.py)

## Evaluated FP Mitigation Rules
1. **Wildcard DNS Filter**: Detects synthetic prefix resolution patterns before emitting orphaned host alerts.
2. **CDN / Reverse-Proxy Shared Fronting**: Recognizes Cloudflare, Fastly, and CloudFront edge headers.
3. **Internal / Staging Classification**: Downgrades self-signed certificates on non-production assets (`dev-*`, `stg-*`).
4. **Generic 404 Fallback**: Re-verifies error payloads to avoid misclassifying active domains as dangling records.
5. **Expected Services Whitelist**: Explicitly suppresses alerts for sanctioned ports defined in `approved_scope.json`.

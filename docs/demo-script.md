# ArgusASM 3-Minute Live Demo & Evaluator Script

> Problem Statement: AIORI Hackathon 2026 - PS-011

The step-by-step evaluator testing flow and quick verification procedures are detailed in:
- **Interactive Evaluator Guide**: [`../TEST_FEATURES.md`](../TEST_FEATURES.md)
- **Deployment & Setup Guide**: [`../SETUP_GUIDE.md`](../SETUP_GUIDE.md)
- **Testing Checklist**: [`MANUAL_TESTING_CHECKLIST.md`](./MANUAL_TESTING_CHECKLIST.md)

## Summary Demo Walkthrough
1. **0:00 - 0:45: Authorization & Baseline ($T_0$)**:
   - Verify Scope Guardrail HUD (`AIORI-2026-PS011-AUTH-001`, strict caps: 20 domains, 10 hosts).
   - Clean baseline score: 100/100, 0 active findings.
2. **0:45 - 1:45: Seeded Exposure & Drift Detection ($T_1$)**:
   - Seeded scenario: Expired TLS (`legacy.aiori.lab`), Shadow Port 8080 (`dev-edge.aiori.lab`), Dangling S3 CNAME (`test-s3.aiori.lab`).
   - Perimeter Hygiene Score updates dynamically to 43/100.
3. **1:45 - 2:30: Merkle Tree Cryptographic Attestation**:
   - Verify SHA-256 Merkle root recalculation and canonical serialization invariance.
   - Run audit verification check via API or CLI (`argus verify`).
4. **2:30 - 3:00: Remediation & Resolution ($T_2$)**:
   - Inspect copy-paste remediation commands.
   - Re-scan to verify score restoration to 100/100.


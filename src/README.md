# ArgusASM Implementation Source Architecture

ArgusASM is organized into modular tiers fulfilling Problem Statement PS-011:

- **`backend/`**: Core Python FastAPI service, containing:
  - `backend/engine/scope_engine.py`: ScopeSafetyEnforcer (strict 20 domain / 10 host cap, non-exploitation lock).
  - `backend/engine/probes/`: The 4 documented ASM checks (RFC 1035 DNS, RFC 5280 TLS, permitted service ports [22, 53, 80, 443, 8080], dangling cloud DNS detection).
  - `backend/engine/drift_engine.py`: Stateful change detection comparing $T_0$ Baseline and $T_1$ Current snapshots.
  - `backend/engine/scoring_engine.py`: Perimeter Hygiene Scorer (0–100 CVSS-calibrated posture metric).
  - `backend/engine/merkle_audit.py`: SHA-256 Merkle tree calculation for snapshot integrity and tamper resistance.
  - `backend/engine/remediation.py`: Automated safe remediation script generator.
- **`frontend/`**: Interactive React 19 + TypeScript + Vite Attack-Surface Sentinel console.
- **`supabase/`**: PostgreSQL DDL and schemas for approved scope targets, inventory assets, baseline snapshots, drift events, and Merkle audit trail.
- **`testbed/`**: Isolated CoreDNS and target containers reproducing the 3 seeded vulnerabilities.
- **`tests/`**: Automated test suite and end-to-end seeded validation harness (`tests/seeded_validation.py`).

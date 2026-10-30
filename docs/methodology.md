# ArgusASM Methodology Specification

> Problem Statement: AIORI Hackathon 2026 - PS-011 (Cybersecurity & Infrastructure Resilience)

The full methodology, architectural specifications, and mathematical drift formulations are formally documented across:
- **Hackathon Submission Dossier (Section 2 & 4)**: [`HACKATHON_SUBMISSION_DOSSIER.md`](./HACKATHON_SUBMISSION_DOSSIER.md)
- **Master Plan Specification**: [`ARGUS_ASM_PS011_MASTER_PLAN.md`](./ARGUS_ASM_PS011_MASTER_PLAN.md)
- **Submission Document PDF**: [`../Proposed-structure-hackathon.pdf`](../Proposed-structure-hackathon.pdf)

## Core Inspection Engines (Passive & Safe)
1. **RFC 1035 DNS Inventory Probe**: [`backend/engine/dns_probe.py`](../backend/engine/dns_probe.py)
2. **RFC 5280 TLS Inspector**: [`backend/engine/tls_probe.py`](../backend/engine/tls_probe.py)
3. **Port & Service Auditor**: [`backend/engine/service_probe.py`](../backend/engine/service_probe.py)
4. **Dangling DNS Candidate Detector**: [`backend/engine/dangling_dns.py`](../backend/engine/dangling_dns.py)
5. **Merkle Attestation Engine**: [`backend/engine/merkle.py`](../backend/engine/merkle.py)
6. **Stateful Drift Engine**: [`backend/engine/drift.py`](../backend/engine/drift.py)


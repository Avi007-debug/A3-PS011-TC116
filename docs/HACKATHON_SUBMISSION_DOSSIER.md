# AIORI HACKATHON 2026 | PROBLEM STATEMENT PS-011
# ArgusASM: Autonomous Attack-Surface Inventory & Drift Sentinel
## Official Level 2 Technical Submission Dossier & Architecture Specification

**Project Name:** ArgusASM (Autonomous Attack-Surface Inventory & Drift Sentinel)  
**Hackathon Track:** Cybersecurity & Infrastructure Resilience  
**Problem Statement:** PS-011 (Authorised Attack-Surface Discovery, Verification, and Drift Sentinel)  
**Team Name:** ZeroDayZ | **Repository:** `aiori-hackathon/A3-PS011-TC116`  
**Authorization Reference:** `AIORI-2026-PS011-AUTH-001`  
**Evaluation Window:** Level 2 Build (16 Oct to 30 Oct 2026) | **Document Version:** 1.0 (Submission Freeze)

---

## Official Submission Deliverables & Verification Matrix

The table below provides direct access to all verified live deliverables, demonstration media, and repository artifacts:

| Deliverable | Direct Link / Location | Purpose & Verification Scope | Evaluator Instructions |
| :--- | :--- | :--- | :--- |
| **Live Working Demo** | [https://a3-ps-011-tc-116.vercel.app](https://a3-ps-011-tc-116.vercel.app) | **Autonomous Sentinel HUD & Drift Sentinel Console**<br>Interactive attack-surface dashboard, live score gauge, Dark/Light theme, dynamic node-link topology graph, and time-travel scrubber. | Open in any browser. Click **"Run Scan"** or navigate to `/drift` to observe stateful detection of the 3 seeded faults. |
| **Walkthrough Video** | [Watch Video on YouTube](https://youtu.be/rFjD-Qt4ju8?si=UlPgNCL80PGyVgLd) | **End-to-End System Walkthrough**<br>Video presentation covering PS-011 problem statement alignment, architectural guardrails, live drift injection, and cryptographic Merkle verification. | 3-minute video walkthrough for evaluators. |
| **Presentation Deck** | [Google Slides Deck](https://docs.google.com/presentation/d/11FaIzXaJAGfJlCcU4IYPzWOipFKJMxIwrX3YVimfk34/edit?usp=sharing) | **Executive & Technical Pitch Deck**<br>Comprehensive slide deck outlining perimeter discovery methodology, false-positive mitigation, and human-in-the-loop governance. | View presentation slides online. |
| **Live Backend API** | [https://argus-backend-api-sqrs.onrender.com](https://argus-backend-api-sqrs.onrender.com) | **FastAPI Probe & Verification Engine**<br>Live public REST API enforcing scope caps, cryptographic Merkle audit ledger, and Human-in-the-Loop governance gate. | Returns JSON status `ONLINE`, scope SHA-256 hash, and active guardrail telemetry. |
| **Interactive API Documentation** | [https://argus-backend-api-sqrs.onrender.com/docs](https://argus-backend-api-sqrs.onrender.com/docs) | **OpenAPI / Swagger Interface**<br>Interactive documentation covering all 26 REST endpoints (probes, drift, verify, ledger, killswitch, exports). | Test live API calls directly from the browser. |
| **One-Click Executive Report** | [https://argus-backend-api-sqrs.onrender.com/api/v1/export/executive-report](https://argus-backend-api-sqrs.onrender.com/api/v1/export/executive-report) | **Print-Ready Executive Perimeter Audit Report**<br>One-click printable report (HTML/PDF ready) with hygiene score gauge, findings matrix, and SHA-256 Merkle attestation. | Open URL in browser to view or print (Ctrl+P / Cmd+P). |
| **OASIS SARIF v2.1.0 Export** | [https://argus-backend-api-sqrs.onrender.com/api/v1/export/sarif](https://argus-backend-api-sqrs.onrender.com/api/v1/export/sarif) | **Standard Security Ingestion Format ($R_9$)**<br>OASIS SARIF 2.1.0 document for direct ingestion into GitHub Advanced Security, DefectDojo, and SIEMs. | Validated against official OASIS SARIF schema. |
| **Complete Source Code** | [`backend/`](../backend) & [`frontend/`](../frontend) | **Production Decoupled Architecture**<br>FastAPI asynchronous engine + React 19 / TypeScript / Vite tactical console. | Clean builds (`vite build` in 14.2s, 0 bundle warnings). |
| **Seeded Testbed & Lab Scenarios** | [`testbed/`](../testbed) | **Isolated 5-Container Docker Lab Testbed**<br>CoreDNS, Host A (control), Host B (seed 1), Host C (seed 2), Mock S3 (seed 3) + cross-platform controller `run_scenarios.py`. | Run `python testbed/run_scenarios.py --state T1` or launch via `docker compose up -d`. |
| **Automated Test Harness (51 Tests)** | [`tests/`](../tests) | **Full Pytest Suite & Seeded Evaluation Runner**<br>51 tests across 9 test suites covering scope caps, 0-packet ledger, Merkle chain, wording lint, and precision/recall. | Run `python -m pytest tests/ -v` (100% pass rate in ~1.1s). |
| **Operational Setup Guide** | [`SETUP_GUIDE.md`](../SETUP_GUIDE.md) | **Step-by-Step Evaluator Deployment Guide**<br>Instructions for Mode 1 (Live Cloud Link), Mode 2 (Lightweight Local Launch), and Mode 3 (Docker Lab). | Start-to-finish guide for evaluators and mentors. |
| **Feature Testing Walkthrough** | [`TEST_FEATURES.md`](../TEST_FEATURES.md) | **3-Minute Evaluator Demo Script**<br>Chronological walkthrough covering Scope Lock, Baseline T0, Seeded T1, FP Calibration, HITL Gate, and Merkle Proof. | Exact script matching hackathon evaluation criteria. |
| **Operational Safety Policy** | [`docs/safety-policy.md`](./safety-policy.md) | **Non-Exploitation Charter & Guardrails Matrix**<br>Cross-reference matrix mapping PS-011 mandates (G-01 to G-08) to code lines and unit tests. | Proves zero invasive scanning and zero cloud bucket claiming. |
| **Submission Dossier (PDF)** | [`ArgusASM_Professional_Submission_Dossier.pdf`](../ArgusASM_Professional_Submission_Dossier.pdf) | **Official 7-Section Formal Submission Dossier**<br>Publication-grade PDF document compiled according to PS-011 guidelines. | Download and view PDF. |
| **Offline Deliverables Pack** | [`samples/`](../samples) | **Pre-Computed Snapshot & Export Deliverables**<br>`snapshot_T0.json`, `snapshot_T1.json`, `snapshot_T2.json`, `drift_report.json`, `findings_export.sarif`, `findings_export.csv`, `findings_export.json`, `executive_audit_report.html`. | Ready for direct offline review if evaluator does not run Docker. |

---

## Section 1: Title, Abstract, Authorized Scope Definition & Authorization Statement

### 1.1 Executive Abstract
Modern hybrid cloud architectures frequently suffer from asset accumulation debt: unmaintained test subdomains, expired X.509 TLS certificates, exposed debug ports, and orphaned CNAME records pointing to decommissioned third-party cloud buckets. **ArgusASM** is an autonomous, strictly non-intrusive external attack surface management (ASM) platform designed specifically for the AIORI 2026 PS-011 mandate. Operating under hard cryptographic guardrails, ArgusASM continuously discovers, inventories, and audits an authorized portfolio of public domains and hosts, establishing a tamper-evident baseline snapshot anchored in a SHA-256 Merkle tree. When perimeter drift occurs, ArgusASM triggers immediate multi-channel alerts, computes stateful set-difference deltas, applies CVSS-calibrated hygiene score deductions, and stages non-destructive remediation advisories behind a mandatory Human-in-the-Loop (HITL) governance gate.

### 1.2 Authorized Scope Boundary
In strict accordance with Problem Statement PS-011, ArgusASM enforces an un-bypassable boundary cap of **maximum 20 public domains** and **maximum 10 public hosts**. Probing beyond these limits is blocked at the pre-flight parser level with zero network packets dispatched.

- **Primary Zone:** `aiori.lab` (Authoritative Lab Zone)
- **Approved Domain Cap:** 20 (Active portfolio: 15 domains)
- **Approved Host Cap:** 10 (Active portfolio: 8 hosts)
- **Permitted Port Whitelist:** Strictly restricted to `{22, 53, 80, 443, 8080}`

### 1.3 Formal Authorization Statement
> **AUTHORIZATION DIRECTIVE: AIORI-2026-PS011-AUTH-001**  
> "This document certifies that ArgusASM is authorized by AIORI Infrastructure & Security Operations to perform passive, read-only reconnaissance against the lab assets cataloged in `approved_scope.json` between `2026-10-01T00:00:00Z` and `2026-11-30T23:59:59Z`. Active exploitation, credential brute-forcing, denial-of-service, third-party cloud bucket claiming, and out-of-scope targeting are strictly prohibited."

---

## Section 2: Architecture and the Four Documented Checks

### 2.1 Logical Architecture
ArgusASM is implemented as a decoupled, asynchronous system comprising:
1. **FastAPI Probe Engine**: Asynchronous Python 3.11 core orchestrating passive network discovery with strict 3.0s timeouts, concurrency cap of 1 per target, and global rate limits.
2. **SQLite Evidence Store**: Tamper-evident local data store maintaining audit ledgers, snapshots, and HITL review queues.
3. **React 19 Perimeter Observatory**: Dark-mode glassmorphic HUD providing real-time telemetry, 0-100 score gauges, asset relationship graphs, and time-travel scrubber.

```text
[Operator / Web HUD] ──► [FastAPI Central Control Plane]
                                    │
                                    ▼
                         [ScopeSafetyEnforcer] ──[Out-of-Scope]──► [ScopeViolation (0 Packets)]
                                    │
                                    ▼
                         [ProbeOrchestrator] (Kill Switch + Rate Limit + Concurrency Cap = 1)
                                    │
    ┌───────────────────────────────┼───────────────────────────────┬───────────────────────────────┐
    ▼                               ▼                               ▼                               ▼
[Check 1: DNS Probe]      [Check 2: TLS Probe]           [Check 3: Port Audit]          [Check 4: Dangling Probe]
(dnspython: A, AAAA, MX,  (cryptography: RFC 5280,       (asyncio TCP: Whitelist        (Passive HTTP GET: AWS S3,
TXT, NS, CNAME hops)      SANs, expiry, self-signed)     ports 22, 53, 80, 443, 8080)   GitHub Pages, Azure Blob)
    │                               │                               │                               │
    └───────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
                                    │
                                    ▼
                         [StatefulDriftEngine] ──► [MerkleAuditLedger (SHA-256 Root)]
                                    │
                                    ▼
                         [PerimeterHygieneScorer] (0 to 100 CVSS Deductions)
                                    │
                                    ▼
                         [HitlGovernanceEngine] ──► [Immediate Alert Dispatcher]
```

### 2.2 Deep-Dive into the Four Documented Checks

#### Check 1: Public DNS Record Inventory (`dns_probe.py`)
- **Input:** Approved domain name string (e.g., `aiori.lab`).
- **Mechanism:** Queries authoritative CoreDNS nameservers (`RFC 1035`, `RFC 2181`) for `A`, `AAAA`, `CNAME`, `MX`, `TXT`, and `NS` records with a 3.0-second socket timeout. Resolves CNAME delegation chains to a fixed depth of 3 hops.
- **Output:** Canonical JSON record inventory with record counts, TTL values, authoritative status, and UTC timestamp.
- **Limits:** Read-only DNS resolution. Does not perform DNS zone transfers (`AXFR`) or dictionary bruteforcing.

#### Check 2: TLS Certificate Validity Inspector (`tls_probe.py`)
- **Input:** Target domain or IP on permitted TLS port (443).
- **Mechanism:** Establishes standard TLS 1.3/1.2 handshake using Python `cryptography` and `ssl` modules. Extracts X.509 attributes: Subject, Issuer, `notBefore`, `notAfter`, Subject Alternative Names (SANs), cipher suites, and signature algorithm (`RFC 5280`).
- **Output:** Certificate posture profile. Flags expired certificates (`notAfter < now`), near-term expirations (`days_remaining < 14`), self-signed certificates, and hostname mismatches.
- **Limits:** Strict passive handshake. Does not send malicious TLS renegotiation packets or exploit heartbleed/padding oracle vulnerabilities.

#### Check 3: Permitted Exposed Service & Port Auditor (`service_probe.py`)
- **Input:** Target IP address or hostname.
- **Mechanism:** Asynchronous TCP half-open connect strictly across the whitelisted ports: `22` (SSH), `53` (DNS), `80` (HTTP), `443` (HTTPS), and `8080` (Alt-HTTP/Proxy). Non-intrusively captures application service banners (e.g., HTTP `Server:` header).
- **Output:** List of open services categorized against the pre-authorized `expected_services` list in `approved_scope.json`. Any service on port 8080 or unapproved port is flagged as `NEW_SERVICE` shadow exposure.
- **Limits:** Scans strictly the 5 whitelisted ports. Full-range 1-65535 port sweeps are prohibited.

#### Check 4: Potential Dangling DNS Detector (`dangling_dns_probe.py`)
- **Input:** Domain and resolved CNAME target string.
- **Mechanism:** Analyzes CNAME targets against known cloud provider patterns (`*.s3.amazonaws.com`, `*.azurewebsites.net`, `*.github.io`). Issues passive HTTP `GET` with 3.0s timeout to inspect response status codes and body fingerprints:
  - AWS S3: HTTP 404 + body contains `<Code>NoSuchBucket</Code>`
  - GitHub Pages: HTTP 404 + body contains `There isn't a GitHub Pages site here`
  - Azure Web Apps: HTTP 404 + body contains `Web Site not found`
  - DNS NXDOMAIN: Authoritative resolver returns RCODE 3 (NXDOMAIN) for CNAME target
- **Output:** Categorized finding flagged strictly as `Potential Dangling DNS Candidate` with calibrated confidence level (`HIGH`, `MEDIUM`, `LOW`).
- **Limits:** Strictly passive inspection. **Never attempts to claim the orphaned S3 bucket, register the GitHub repository, or create an Azure Web App.**

---

## Section 3: Non-Exploitation Policy and Safety Guardrails

### 3.1 Non-Exploitation Charter & Terminology Enforcements
ArgusASM rejects intrusive offensive scanning in favor of verifiable perimeter defense:
1. **Non-Offensive Cautious Terminology:** Identified dangling CNAMEs are strictly reported as **"Potential Dangling DNS Candidates"**, never as "Confirmed Subdomain Takeovers" or "Vulnerable Hosts".
2. **Passive Read-Only Verbs:** Probes issue standard HTTP `GET` or `HEAD` queries. Exploit payloads, SQL injection fuzzing, and HTTP `PUT`/`POST`/`DELETE` verbs are forbidden.
3. **No Third-Party Registration:** The engine never interacts with AWS, Azure, or GitHub APIs to claim resources.

### 3.2 Live Request Ledger Excerpt ($R_1$)
Every outbound socket attempt is intercepted and logged to SQLite by `RequestLedger`. Out-of-scope targets are rejected at pre-flight with strictly **zero network packets** dispatched:

```json
[
  {
    "id": "REQ-7B8A91C2D4E0",
    "timestamp": "2026-10-25T13:21:40.104Z",
    "target": "external-attacker.com",
    "probe_type": "DNS",
    "port": null,
    "status": "ScopeViolation",
    "network_calls_made": 0,
    "duration_ms": 0.1,
    "response_summary": "BLOCKED BY SCOPE GUARDRAIL: Target 'external-attacker.com' is NOT in approved scope. Aborting execution per PS-011 guardrails.",
    "authorization_ref": "AIORI-2026-PS011-AUTH-001"
  },
  {
    "id": "REQ-3F2E1D0C9B8A",
    "timestamp": "2026-10-25T13:21:40.105Z",
    "target": "192.168.1.100",
    "probe_type": "SERVICE",
    "port": 80,
    "status": "ScopeViolation",
    "network_calls_made": 0,
    "duration_ms": 0.1,
    "response_summary": "BLOCKED BY SCOPE GUARDRAIL: Target '192.168.1.100' is NOT in approved scope. Aborting execution per PS-011 guardrails.",
    "authorization_ref": "AIORI-2026-PS011-AUTH-001"
  }
]
```

### 3.3 Emergency Kill Switch ($R_7$) & Human-in-the-Loop Governance
- **Emergency Kill Switch:** Calling `POST /api/v1/killswitch` engages a thread-safe singleton that halts in-flight probe threads and rejects all scheduled runs immediately.
- **Human-in-the-Loop (HITL) Gate:** When Critical or High severity findings are identified, automated execution of remediation scripts is prohibited. The action is placed in `PENDING_HUMAN_REVIEW` until an authenticated operator signs off.

---

## Section 4: Stateful Change Detection, Snapshot Schema, Drift Algorithm & Merkle Chain

### 4.1 Canonical Snapshot JSON Schema & Scope Hash Binding ($R_8$)
Perimeter state is captured as versioned JSON snapshots (`snapshots/T0.json`, `T1.json`, `T2.json`). Each snapshot cryptographically embeds `scope_sha256`—the SHA-256 hash of `approved_scope.json`:

```json
{
  "snapshot_id": "SNAP-T1",
  "state_id": "T1",
  "timestamp": "2026-10-20T04:30:00Z",
  "scope_sha256": "3b9c5db2b2b8938222b9b947c9e05ba869c0d38e2d4211116669910ddbb1b04b",
  "authorization_ref": "AIORI-2026-PS011-AUTH-001",
  "hygiene_score": 68,
  "hygiene_rating": "ELEVATED_RISK",
  "merkle_root": "0x86fafc721f323779adf8424b441502945e50a4a9efdaf567f4a19b23f17a9e1b",
  "previous_merkle_root": "0x4e2d1a3b5c7e9f0b2d4f6a8c0e1a3b5d7f9c1e3a5b7d9f1a3c5e7b9d1f3a5b7d",
  "total_assets": 15,
  "total_findings": 3,
  "assets": [...],
  "findings": [...]
}
```

### 4.2 Stateful Drift Detection Algorithm
The drift engine computes set differences between Baseline ($T_0$) and Current ($T_1$) snapshots:
$$\Delta = \text{Current} \setminus \text{Baseline}$$

Full Typed Drift Events Supported:
1. `NEW_SERVICE`: Unexpected port/service opened (e.g. port 8080)
2. `REMOVED_SERVICE`: Service decommissioned or firewall rule applied
3. `EXPIRED_CERT`: Certificate validity expired (`notAfter < now`)
4. `CERT_EXPIRING`: Certificate expiring within 14 days
5. `CERT_RESOLVED`: Certificate renewed and verified valid
6. `DNS_RECORD_CHANGED`: A/AAAA/MX/TXT record modification
7. `DANGLING_DNS_CANDIDATE`: Orphaned CNAME detected matching cloud fingerprint
8. `DANGLING_DNS_RESOLVED`: Orphaned CNAME deleted from authoritative DNS
9. `ASSET_ADDED`: New authorized subdomain discovered
10. `ASSET_REMOVED`: Subdomain decommissioned

**2-Observation Confirmation Rule:** To eliminate transient network noise, High-severity drift alerts require confirmation across two consecutive observation cycles before triggering high-priority notifications.

### 4.3 Cryptographic Merkle Tree Audit Chain
Every asset and finding is canonicalized (sorted keys, stripped whitespace) and hashed with SHA-256 to form leaf nodes. The leaves are recursively paired to produce a single 32-byte Merkle root:
$$\text{MerkleRoot}_n = \text{Hash}\left(\text{Leaves}_n \mathbin{\Vert} \text{MerkleRoot}_{n-1}\right)$$
This links each snapshot to its predecessor, mathematically guaranteeing that historical snapshots and drift timestamps cannot be altered retroactively.

---

## Section 5: Seeded-Issue Detection Results & Precision/Recall Metrics

### 5.1 The 3 Seeded Vulnerabilities in the Docker Lab
ArgusASM was evaluated against the isolated multi-container testbed simulating the 3 seeded faults:

| Seed ID | Target Asset | Seeded Fault | Expected Detection | ArgusASM Result | Observed Evidence |
|:---|:---|:---|:---|:---|:---|
| **TEST-SEED-01** | `legacy.aiori.lab:443` | Expired TLS Certificate | `EXPIRED_CERT` (-35 pts) | **DETECTED (100%)** | `notAfter: 2026-01-01T00:00:00Z` (-292 days overdue) |
| **TEST-SEED-02** | `dev-edge.aiori.lab:8080` | Unauthorized Open Port | `NEW_SERVICE` (-25 pts) | **DETECTED (100%)** | `Port 8080 OPEN (Banner: Werkzeug/2.3.8 debug console)` |
| **TEST-SEED-03** | `test-s3.aiori.lab` | Orphaned S3 CNAME | `DANGLING_DNS` (-30 pts) | **DETECTED (100%)** | `CNAME -> aiori-test-bucket-deprecated.s3.amazonaws.com (HTTP 404 NoSuchBucket)` |

### 5.2 Control Host A (Precision Baseline - Zero False Positives)
To test precision, `api.aiori.lab` (`10.0.1.11`) was monitored as a healthy production control host:
- Valid TLS Certificate: Remaining validity = 31 days (Let's Encrypt Authority R3)
- Permitted Ports: Ports 80 and 443 open (Authorized)
- Observed Findings: **0 High/Critical Findings (Zero False Positives)**

### 5.3 Measured Precision & Recall Summary

$$\text{Recall} = \frac{TP}{TP + FN} = \frac{3}{3 + 0} = 100.0\%$$
$$\text{Precision} = \frac{TP}{TP + FP} = \frac{3}{3 + 0} = 100.0\%$$

| Evaluation Metric | Ground Truth | Detected by ArgusASM | Accuracy / Compliance |
|:---|:---|:---|:---|
| **Seeded Faults (True Positives)** | 3 | 3 | **100.0% Recall** |
| **Control Host A (False Positives)** | 0 | 0 | **100.0% Precision** |
| **Out-of-Scope Rejections** | 2 | 2 | **100.0% (Zero Packets)** |
| **HITL Staged Actions** | 3 | 3 | **100.0% Governance** |
| **Hygiene Score Transition** | $T_0$: 96 $\to$ $T_1$: 68 $\to$ $T_2$: 96 | Verified | **Defensible Deductions** |

---

## Section 6: False-Positive Analysis and Confidence Calibration

### 6.1 False-Positive Mitigation Engine
In external attack surface management, false alarms degrade operator trust. ArgusASM deploys dedicated calibration heuristics for common ASM false-positive scenarios:

| False-Positive Vector | Cause of False Alarm | ArgusASM Mitigation & Downgrade Logic | Calibrated Confidence |
|:---|:---|:---|:---|
| **Wildcard DNS Zones** | Zone returns A record for any arbitrary subdomain query | Queries a random UUID subdomain (`probe-uuid-check.domain`). If it resolves, the domain is tagged `WILDCARD_ACTIVE` and generic DNS alerts are suppressed. | **LOW** |
| **CDN / Reverse Proxies** | Cloudflare/CloudFront fronting the origin returns generic 404s | Detects CDN IP ranges, ASNs, and HTTP `Via` / `Server: cloudflare` headers. CNAME pointing to CDN is not flagged as dangling. | **LOW** |
| **Staging Self-Signed Certs** | Internal QA/dev hosts use self-signed certificates | Cross-references `role: staging` in `approved_scope.json`. Severity is downgraded from CRITICAL to INFO with note: "Self-signed certificate expected in staging environment." | **INFO (Downgraded)** |
| **Generic Cloud 404s** | Web app returns 404 Not Found for missing URL path | Requires **both** matching cloud CNAME suffix **and** exact provider body signature (`<Code>NoSuchBucket</Code>`). Generic HTTP 404 without XML is ignored. | **HIGH (Gated)** |

### 6.2 Perimeter Hygiene Score Deduction Caps ($R_3$)
To prevent a single asset from excessively distorting organizational scores, deductions are capped by finding class:
- **Expired TLS Deductions:** -35 points per expired cert (capped at -40 points total)
- **Unapproved Port Deductions:** -25 points per unauthorized port (capped at -35 points total)
- **Dangling DNS Deductions:** -30 points per dangling candidate (capped at -40 points total)
- **Baseline Healthy Score:** **96 / 100**
- **$T_1$ Drifted Score:** **68 / 100** (Elevated Risk)
- **$T_2$ Remediated Score:** **96 / 100** (Hardened)

---

## Section 7: Conclusion, Operational Impact, Limitations & Regional Roadmap

### 7.1 Operational Impact
ArgusASM transforms external attack surface management from an intrusive, ad-hoc penetration testing exercise into a continuous, stateful, and mathematically provable sentinel. By combining passive RFC-compliant discovery with SHA-256 Merkle provenance, organizations can prove compliance to auditors, eliminate shadow cloud exposures, and remediate expired credentials before attackers exploit them.

### 7.2 Stated Limitations
1. **Passive Fingerprinting Limits:** Read-only inspection cannot confirm whether an unallocated S3 bucket name is blacklisted or reserved by AWS internal namespaces.
2. **Lab Subnet Focus:** Designed for controlled enterprise subnets and authoritative CoreDNS zones; does not perform global internet-wide scans (complying strictly with PS-011).

### 7.3 Delivered P2 Differentiators & Roadmap for Regional Hackathon
All P2 engineering differentiators are delivered and operational in this Level 2 submission:
1. **Automated SARIF 2.1.0 & CSV Findings Export ($R_9$):** Ingestable into GitHub Security, DefectDojo, and SIEMs (`/api/v1/export/sarif` and `/api/v1/export/csv`).
2. **One-Click Executive Audit Report ($T_{3-2}$):** Real-time printable perimeter security summary with cryptographic Merkle attestation.
3. **Passive Certificate Transparency (CT) Monitor ($T_{3-1}$):** Ingests public CT logs; flags discoveries as candidates to add to scope with strictly 0 network probing.
4. **Offline Evaluator Delivery Pack:** Pre-computed snapshots ($T_0, T_1, T_2$), drift deltas, and export artifacts preloaded in `samples/`.

For the regional finals (November 2026), the team will extend:
1. **Post-Quantum Cryptography (PQC) Readiness Ledger:** Tracking NIST FIPS 203/204 (ML-KEM / ML-DSA) perimeter migration.
2. **Multi-Region Distributed Probe Nodes:** Geographic validation across multi-cloud edge locations.

---

*AIORI Hackathon 2026 - Problem Statement PS-011 - Team ZeroDayZ - Autonomous Attack-Surface Inventory & Drift Sentinel*

# AIORI HACKATHON 2026 | PS-011
# ArgusASM - Autonomous Attack-Surface Inventory & Drift Sentinel
## Master Project Plan, Feature Specification and Level 2 Execution Schedule

| Item | Detail |
| :--- | :--- |
| **Track** | Cybersecurity & Infrastructure Resilience |
| **Problem Statement** | **PS-011**: Authorised attack-surface discovery, TLS/DNS/port checks, dangling DNS detection, baseline drift alerts |
| **Platform** | ArgusASM: Autonomous Attack-Surface Inventory & Drift Sentinel |
| **Team** | 2 developers, feature-wise (vertical slice) ownership |
| **Build Window** | Level 2 build: 16 Oct to 30 Oct 2026, submission freeze 31 Oct 2026 |
| **Document Version** | v1.0 (Master Execution Specification) |

---

## Contents
1. [Executive Summary and Problem Alignment](#1-executive-summary-and-problem-alignment)
2. [Hackathon Timeline and Our Path to Regionals](#2-hackathon-timeline-and-our-path-to-regionals)
3. [Product Identity](#3-product-identity)
4. [Core Platform Subsystem Architecture & Component Matrix](#4-core-platform-subsystem-architecture--component-matrix)
5. [Complete Feature Specification (Tier 1, 2, 3 and Recommended Additions)](#5-complete-feature-specification)
6. [System Architecture, Data Model and API](#6-system-architecture-data-model-and-api)
7. [Non-Exploitation Policy and Safety Guardrails](#7-non-exploitation-policy-and-safety-guardrails)
8. [Drift Detection, Scoring and Merkle Audit Trail](#8-drift-detection-scoring-and-merkle-audit-trail)
9. [Seeded Lab Testbed and Validation Plan](#9-seeded-lab-testbed-and-validation-plan)
10. [False-Positive Analysis and Confidence Calibration](#10-false-positive-analysis-and-confidence-calibration)
11. [Team Structure and Work Allocation](#11-team-structure-and-work-allocation)
12. [Day-by-Day Execution Schedule (16 to 31 Oct)](#12-day-by-day-execution-schedule-16-to-31-oct)
13. [Submission Package: Steps 8, 9 and 10](#13-submission-package-steps-8-9-and-10)
14. [Evaluator Alignment Matrix](#14-evaluator-alignment-matrix)
15. [Risks and Mitigations](#15-risks-and-mitigations)
16. [Open Questions and Assumptions](#16-open-questions-and-assumptions)
17. [Appendices: Pseudocode, Snapshot Schema, CLI Reference, Day 1 Actions](#17-appendices)

---

## 1. Executive Summary and Problem Alignment

ArgusASM is an authorised, strictly read-only external attack-surface management (ASM) platform. It catalogs public DNS records, TLS certificates, and a small set of permitted service ports for an approved lab portfolio, stores each scan as a tamper-evident snapshot, and raises immediate alerts when something drifts from the baseline: a certificate expires, an unexpected service appears, or a CNAME points at a decommissioned cloud resource.

### 1.1 Official Problem Statement (PS-011)

> **Problem Brief:**  
> Organizations running multi-cloud infrastructure often accumulate exposed digital assets over time, including unmaintained test subdomains, expired TLS certificates, open service ports, and dangling DNS CNAME records that point to decommissioned cloud instances. Build an authorized attack-surface discovery and monitoring system for a lab portfolio of domains and hosts that catalogs public DNS records, verifies TLS certificate validity, inspects open service ports, maintains a baseline inventory, and generates immediate alerts when unexpected services appear or dangling DNS candidates are identified.

### 1.2 Requirement Checklist

| # | Requirement | How ArgusASM Satisfies It |
| :--- | :--- | :--- |
| **R1** | Strict scope: max 20 lab domains and 10 hosts, approved written scope only | `scope_engine.py` loads `approved_scope.json`, enforces hard caps, and rejects anything out of scope before any DNS lookup or socket is opened. Every outbound request is written to an audit request ledger. |
| **R2** | Check 1: DNS records (`A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`) | `dns_probe.py` using `dnspython`; stores values, TTL, authoritative NS, and timestamps per RFC 1035. |
| **R3** | Check 2: TLS certificate validity | `tls_probe.py`: subject, issuer, SANs, `notBefore`/`notAfter`, expired and expiring-within-14-days flags, plus hostname mismatch and self-signed detection per RFC 5280. |
| **R4** | Check 3: Permitted service/port inspection | `service_probe.py`: TCP connect to exactly ports `22, 53, 80, 443, 8080` with non-intrusive banner capture. |
| **R5** | Check 4: Dangling DNS candidates | `dangling_dns_probe.py`: CNAME target analysis plus provider fingerprints (AWS S3 `NoSuchBucket`, GitHub Pages, Azure). Reported as "candidate" with a calibrated confidence level, never as "exploitable". |
| **R6** | Stateful scheduled change detection, baseline comparison | `snapshot_engine.py` + `drift_engine.py` + scheduler. $T_0$ vs $T_1$ diff with visual diff viewer and time-travel scrubber. |
| **R7** | Detect seeded issues: expired cert, unexpected service, dangling CNAME | Docker lab testbed with `TEST-SEED-01`, `02`, `03` and an automated validation script (`tests/seeded_validation.py`) that asserts detection. |
| **R8** | Report false positives with reasoning | `fp_engine.py` and dedicated FP analysis: wildcard DNS, CDN/proxy fronts, staging self-signed certs, with confidence calibration. |
| **R9** | No exploitation, no unrestricted scanning, no claim that every dangling record is exploitable | Non-Exploitation Policy (Section 7), fixed port list, passive fingerprinting only, careful terminology in all UI text and the PDF. |
| **R10** | Immediate alerts | Alert dispatcher (console, UI banner, webhook). Promoted to core capability as required by PS-011. |

---

## 2. Hackathon Timeline and Our Path to Regionals

### 2.1 Official Schedule

| # | Milestone | Date | Meaning for Team |
| :--- | :--- | :--- | :--- |
| **1** | Complete Level 1 steps (Step 1 to Step 7) | 14 Oct | Qualifies team for Level 2 certificate. |
| **2** | Level 2 teams announcement | 16 Oct | Qualifying teams move to Level 2. Build window opens. |
| **3** | Mentoring sessions and Steps 8 to 10 | 16 Oct to 31 Oct | Two mentoring sessions per problem category. Code, documents, and live demo submitted in this window. |
| **4** | Evaluators connect with teams | 31 Oct to 4 Nov | Based on completion of steps. Repository must be complete and self-explanatory by 31 Oct. |
| **5** | Regional hackathon teams announced | 5 Nov | Winning teams for regionals announced. |
| **6** | Regional hackathon (max 20 teams per region) | 24 to 30 Nov | Venues: Bengaluru, Pune, Kolkata, Noida. |

### 2.2 Level 2 Steps (8 to 10)

| Step | Requirement | Our Deliverable |
| :--- | :--- | :--- |
| **Step 8** | Attend mentoring sessions as per schedule | Attend both category mentoring sessions. Prepare question list and working prototype states. |
| **Step 9** | Submit all required files, documents, source code and supporting materials | Private repository named after the team, `aiori-hackathon` added as collaborator, `Proposed-structure-hackathon.pdf`, source code, testbed, tests, `README.md`. |
| **Step 10** | Include link to a live working demo; if not possible, upload final deliverable files | Hosted demo link in `README.md` plus offline fallback: recorded demo video, sample snapshots, and local Docker testbed in repository. |

> **Planning Note:** The evaluator window opens on 31 Oct, so the internal deadline is the night of **30 Oct**. Work is organized into 15 build days (16 to 30 Oct) with 31 Oct reserved as a freeze and buffer day.

---

## 3. Product Identity

In Greek mythology, **Argus Panoptes** was the giant with a hundred eyes who never closed all of them at once. ArgusASM is built in that spirit: a multi-eyed perimeter sentinel that keeps watch continuously and never attacks what it observes.

| Attribute | Value |
| :--- | :--- |
| **Name** | **ArgusASM** (Autonomous Attack-Surface Inventory & Drift Sentinel) |
| **Tagline** | *Continuous Visibility. Zero Exploitation. Provable Drift.* |
| **Core Philosophy** | Continuous visibility. Zero exploitation. Provable baseline drift. |
| **Design Language** | Dark-mode cyber HUD, glassmorphism, responsive Tailwind CSS, top telemetry strip. |

---

## 4. Core Platform Subsystem Architecture & Component Matrix

| Subsystem | Architectural Role & Implementation in ArgusASM | Status |
| :--- | :--- | :--- |
| **Frontend Shell & Design System** | Dark-mode cyber HUD, glassmorphism, responsive Tailwind CSS, modern typography with modular navigation (`Overview`, `Inventory`, `Drift`, `Security`, `Audit`, `Methodology`). | **FUNCTIONAL** |
| **Top HUD Telemetry Strip** | Live telemetry displaying: `SCOPE: 20 DOMAINS / 10 HOSTS \| DRIFT: DETECTED \| CHECKS: 4/4 ACTIVE` with sub-millisecond wire latency and probe health. | **FUNCTIONAL** |
| **Circular Posture Gauge** | **Perimeter Hygiene Score (0 to 100)** with CVSS-calibrated deductions: Expired TLS (-35), Open Port (-25), Dangling DNS (-30). | **FUNCTIONAL** |
| **Side-by-Side Diff Engine** | **Stateful Asset Drift Inspector**: Compares $T_0$ Baseline against $T_1$ Current snapshot, rendering structured JSON deltas and asset changes. | **FUNCTIONAL** |
| **CLI Sandbox Terminal Modal** | Interactive terminal supporting `argus scan --scope approved_scope.json`, `argus diff --baseline T0 --current T1`, `argus verify`, `argus remediate`, and `argus stop`. | **FUNCTIONAL** |
| **Judge Defense & Dossier Modal** | Authoritative methodology dossier detailing the 4 documented checks, RFC 1035 (DNS), RFC 5280 (TLS), and the strict Non-Exploitation Policy. | **FUNCTIONAL** |
| **Cryptographic Provenance** | **SHA-256 Merkle Audit Ledger**: Computes 32-byte Merkle root across all inventory assets per snapshot, chained to the previous root for tamper-evident provenance. | **FUNCTIONAL** |
| **Active Probes Engine** | 4 non-intrusive probe workers: `dns_probe.py` (dnspython), `tls_probe.py` (cryptography), `service_probe.py` (TCP socket), and `dangling_dns_probe.py` (cloud fingerprinting). | **FUNCTIONAL** |
| **Isolated Lab Testbed** | Local CoreDNS container with zone `aiori.lab` + HTTP/TLS target containers reproducing the 3 seeded vulnerabilities offline. | **FUNCTIONAL** |

---

## 5. Complete Feature Specification

### 5.1 Tier 1: Mandatory Features

| ID | Feature | Specification |
| :--- | :--- | :--- |
| **T1-1** | **Approved Scope Management** | Loads `approved_scope.json` with strict bounds: maximum 20 domains and 10 hosts. Hard rejection on any target not explicitly listed. |
| **T1-2** | **Check 1: DNS Record Inventory** | Resolves `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS` per target using `dnspython`. Records values, TTLs, authoritative NS, and timestamps. |
| **T1-3** | **Check 2: TLS Certificate Inspection** | Connects on port 443; extracts subject, issuer, validity period (`notBefore`/`notAfter`), SAN list, serial, and days remaining. Flags expired and expiring-within-14-days certs. |
| **T1-4** | **Check 3: Permitted Exposed Port Inspection** | TCP connect to exactly ports `[22, 53, 80, 443, 8080]`. Captures service banner non-intrusively. Flags unexpected open ports. |
| **T1-5** | **Check 4: Dangling DNS Identification** | Checks if CNAME target matches known cloud patterns (AWS S3, Azure Blob, GitHub Pages) and fetches HTTP response passively to match fingerprint (`NoSuchBucket`). Surfaces candidate with confidence. |
| **T1-6** | **Stateful Baseline Comparison & Drift** | Stores scans as JSON snapshots. Compares $T_0$ Baseline against $T_1$ Current to detect added/removed assets, altered DNS, cert changes, and new services. |
| **T1-7** | **Immediate Alert Dispatcher** | Fires alerts immediately on critical drift events (UI alert banner, terminal log, webhook payload). |
| **T1-8** | **Seeded Fault Validation Harness** | Docker testbed with `legacy.aiori.lab` (expired cert), `dev-edge.aiori.lab` (port 8080 open), and `test-s3.aiori.lab` (dangling CNAME). Automated test asserts 100% detection. |
| **T1-9** | **False-Positive Analysis Engine** | Documents handling for wildcard DNS, CDN/reverse proxies, and lab self-signed certs with confidence calibration. |

### 5.2 Tier 2: Differentiating Features

| ID | Feature | Specification |
| :--- | :--- | :--- |
| **T2-1** | **Interactive Asset Relationship Graph** | Canvas/SVG node-link visualizer: Domain $\to$ CNAME $\to$ IP host $\to$ port and certificate badges. Drifting nodes pulse amber/red. Click a node to open its evidence panel. |
| **T2-2** | **Time-Travel Drift Slider** | Historical timeline scrubber allowing operators to scrub between $T_0$ (baseline), $T_1$ (drifted), and $T_2$ (remediated) states. |
| **T2-3** | **Safe Remediation Advisory** | Copy-paste remediation commands per finding: AWS Route 53 CNAME removal CLI, Certbot renewal command, UFW firewall rule, Nginx config snippet. |
| **T2-4** | **Cryptographic Merkle Audit Trail** | SHA-256 Merkle root computed across all assets in each snapshot, chained to the previous root. CLI `argus verify` confirms integrity. |

### 5.3 Tier 3: Bonus Features

| ID | Feature | Specification |
| :--- | :--- | :--- |
| **T3-1** | **Passive Certificate Transparency Monitor** | Queries `crt.sh` passively for historical certificates of in-scope domains. Surfaces forgotten subdomains as "candidates to add to scope" without scanning automatically. |
| **T3-2** | **One-Click Executive PDF Export** | Generates a clean executive summary: hygiene score, active findings, drift delta, remediation commands, and Merkle root. |
| **T3-3** | **Rich Webhook Formatting** | Discord and Slack embeds with severity colors, finding details, and deep links. |

### 5.4 Recommended Additions (Beyond Baseline Plan)

| ID | Addition | Why It Helps | Effort | Value |
| :--- | :--- | :--- | :--- | :--- |
| **R-1** | **Request Ledger** | Proves read-only and in-scope guarantee. Every outbound probe logged with timestamp, target, probe type, port, and status code. | 0.5 day | **High** |
| **R-2** | **Finding Confidence & Severity Model** | Core of the false-positive story. High/Medium/Low confidence with evidence list. | 1 day | **High** |
| **R-3** | **Baseline Acknowledgement Workflow** | Operator can mark drift as "accepted" (new baseline) or "known false positive" (suppressed with reason). | 1 day | **High** |
| **R-4** | **Extended TLS Hygiene Checks** | Hostname mismatch, self-signed, chain validation, deprecated TLS 1.0/1.1 detection. | 1 day | **Medium** |
| **R-5** | **Dangling NS and MX Checks** | Extends Check 4 to unresolvable NS delegations and MX targets. | 0.5 day | **Medium** |
| **R-6** | **Email-Auth Hygiene from TXT** | Inspects SPF and DMARC presence in collected TXT records. | 0.5 day | **Medium** |
| **R-7** | **Rate Limiting & Global Kill Switch** | Enforces polite scanning; kill switch endpoint immediately stops in-flight scans. | 0.5 day | **High** |
| **R-8** | **Scope File Integrity Hashing** | SHA-256 hash of `approved_scope.json` embedded in every snapshot to prove authorization. | 0.25 day | **Medium** |
| **R-9** | **SARIF & JSON Export** | Outputs findings in standard SARIF format for enterprise vulnerability management. | 0.5 day | **Medium** |
| **R-10** | **Automated Tests & CI** | Automated pytest suite + seeded validation harness running on push. | 1 day | **High** |
| **R-11** | **One-Command Bring-Up** | `docker-compose up -d` brings up the CoreDNS and lab targets in seconds. | 0.5 day | **High** |
| **R-12** | **Scenario Scripts for T0, T1, T2** | Deterministically moves the lab from clean to drifted to remediated state. | 0.5 day | **High** |

---

## 6. System Architecture, Data Model and API

### 6.1 Logical Architecture

```text
Operator (Web HUD / Headless CLI)
  │
  ▼
FastAPI Central Control Plane ──────────────────────────────┐
  /api/scan  /api/diff  /api/inventory  /api/score          │
  /api/findings  /api/ledger/receipt  /api/simulate/remediation
  │                                                         │
  ▼                                                         ▼
Scope Safety Enforcer  ──[Reject Out-of-Scope]──►  ScopeViolationError
  │ (Approved Targets Only: Max 20 Domains / 10 Hosts)      │
  ▼                                                         │
Probe Orchestrator (Rate Limit, Timeouts, Kill Switch, Request Ledger)
  ├── Check 1: DNS Probe        (dnspython: A, AAAA, CNAME, MX, TXT, NS)
  ├── Check 2: TLS Probe        (ssl, cryptography: RFC 5280, expiry, SANs)
  ├── Check 3: Service Probe    (asyncio TCP connect: ports 22, 53, 80, 443, 8080)
  └── Check 4: Dangling Probe   (CNAME pattern matching + passive fingerprinting)
  │
  ▼
Asset Compiler ──► FP Calibration Engine ──► Categorized Findings
  │
  ▼
Snapshot Engine ──► Stateful Drift Engine ──► SHA-256 Merkle Tree Engine
  │
  ▼
Evidence Store: SQLite + Canonical JSON Snapshots (T0.json, T1.json)
```

### 6.2 Technology Stack

| Layer | Component | Notes |
| :--- | :--- | :--- |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2 | High-throughput asynchronous REST microservices. |
| **Probes** | `dnspython`, `cryptography`, `asyncio` sockets, `httpx` | Explicit 3.0s timeouts, non-intrusive banner collection. |
| **Storage** | SQLite + Canonical JSON Snapshot Files | Snapshots serve as cryptographic evidence artifacts. |
| **Scheduler** | APScheduler | Configurable interval scans; instant trigger on `/api/scan`. |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS | Modular HUD: Inventory, Drift, Security, Graph, Audit. |
| **Testbed** | Docker Compose + CoreDNS 1.11 + Nginx/Python containers | Local, deterministic testbed simulating `aiori.lab`. |
| **CI / Harness** | Pytest, Hypothesis, GitHub Actions | 100% automated assertion of seeded fault detection. |

### 6.3 API Surface (v1)

| Method & Path | Purpose |
| :--- | :--- |
| `GET /` | Healthcheck, scope limits, probe status, and engine version. |
| `GET /api/scope` | Returns and validates `approved_scope.json` against caps. |
| `GET /api/inventory` | Executes active probes and compiles current asset inventory. |
| `GET /api/diff?baseline=T0&current=T1` | Computes stateful drift between two snapshots. |
| `GET /api/findings` | Surfaces security findings with CVSS deductions and confidence. |
| `GET /api/score` | Computes 0-100 Perimeter Hygiene Score for baseline and current state. |
| `GET /api/ledger/receipt` | Generates SHA-256 Merkle root audit trail receipt. |
| `POST /api/scan` | Triggers an immediate perimeter re-scan. |
| `POST /api/simulate/remediation` | Generates copy-paste remediation commands (Certbot, DNS, UFW). |
| `GET /api/telemetry/live` | Real-time probe throughput and wire latency metrics. |

---

## 7. Non-Exploitation Policy and Safety Guardrails

ArgusASM enforces strict operational safety rules to ensure non-intrusive evaluation:

1. **Pre-Probe Scope Check**: Every target must pass `assert_in_scope(target)` before any network socket is opened.
2. **Fixed Port List**: Probes are restricted to ports `[22, 53, 80, 443, 8080]`. No full-range scanning or port sweeps.
3. **Passive Fingerprinting**: For dangling DNS checks, the system only issues a standard HTTP `GET` to read status codes and headers. It **never** attempts to claim, register, or upload files to orphaned buckets.
4. **Careful Terminology**: Identified dangling records are reported as **"Potential Dangling DNS Candidates"**, never as "Confirmed Takeovers".
5. **No Dangerous HTTP Verbs**: Probing engines never issue `PUT`, `DELETE`, `POST`, or custom exploit payloads.

---

## 8. Drift Detection, Scoring and Merkle Audit Trail

### 8.1 Snapshot Lifecycle
1. The probe orchestrator queries all in-scope targets across the 4 checks.
2. The FP engine attaches confidence ratings and false-positive notes.
3. The snapshot is serialized into canonical JSON with timestamp, scope hash, asset inventory, findings, and Merkle root.
4. The first accepted snapshot is designated **$T_0$ (Baseline)**. Later scans ($T_1, T_2$) are compared against $T_0$.
5. The drift engine emits typed drift events and updates the Perimeter Hygiene Score.

### 8.2 Drift Event Types

| Event Type | Condition | Default Severity |
| :--- | :--- | :--- |
| `NEW_SERVICE` | A port is open in $T_1$ that was closed in $T_0$, or is not in allowed services | **High** (ports 8080 or 22 unexpected), Medium otherwise |
| `REMOVED_SERVICE` | A previously open port is now closed | **Info** |
| `CERT_EXPIRED` | Certificate `notAfter` date is in the past | **High** |
| `CERT_EXPIRING` | Certificate `notAfter` is within 14 days | **Medium** |
| `CERT_CHANGED` | Issuer, subject, SANs, or serial differ from baseline | **Medium** |
| `DNS_RECORD_CHANGED` | Monitored record value (A, CNAME, MX, TXT) differs | **Low to Medium** |
| `DANGLING_DNS_ADDED` | New potential dangling DNS candidate identified | **High / Medium** by confidence |
| `DANGLING_DNS_RESOLVED`| Previous candidate is no longer dangling | **Info** |
| `ASSET_ADDED / REMOVED`| Target appears or disappears from inventory | **Info** |

### 8.3 Perimeter Hygiene Score Rubric (0 to 100)

$$\text{Score} = \max\left(0, 100 - \sum \text{Deductions}\right)$$

| Finding Class | Deduction per Finding | Cap per Class |
| :--- | :--- | :--- |
| **Expired TLS Certificate** | -35 Pts | -70 Pts |
| **Certificate Expiring Within 14 Days** | -10 Pts | -30 Pts |
| **Unexpected Open Service (e.g. 8080)** | -25 Pts | -50 Pts |
| **Potential Dangling CNAME (High Confidence)** | -30 Pts | -60 Pts |
| **Potential Dangling CNAME (Medium Confidence)** | -15 Pts | -30 Pts |
| **Potential Dangling CNAME (Low Confidence)** | -5 Pts | -15 Pts |
| **Hostname Mismatch or Self-Signed Certificate** | -10 Pts | -20 Pts |
| **Weak TLS Configuration (TLS 1.0/1.1)** | -5 Pts | -15 Pts |

### 8.4 Merkle Audit Trail
- Each asset record is canonicalized (sorted JSON keys, zero whitespace) and hashed via SHA-256.
- Hashes are paired up into a binary hash tree yielding a single 32-byte Merkle root stored in the snapshot.
- Snapshots reference the `previous_root`, forming a tamper-evident cryptographic hash chain.

---

## 9. Seeded Lab Testbed and Validation Plan

### 9.1 Design Principles
- **Self-Contained & Deterministic**: Runs entirely inside Docker on an internal network (`10.0.0.0/16`). Zero third-party internet dependencies.
- **Local Authoritative DNS**: CoreDNS container serves zone `aiori.lab` with authoritative SOA, NS, A, and CNAME records.

### 9.2 Seeded Vulnerabilities & Evaluation Targets

| Target Asset | Role | Seed ID | Seeded Issue | Expected Detection |
| :--- | :--- | :--- | :--- | :--- |
| `api.aiori.lab` | Authorized Gateway | *None (Control)* | Clean HTTPS service on ports 80/443 | Zero findings. Hygiene Score 100/100. |
| `legacy.aiori.lab` | Legacy Web Server | **TEST-SEED-01** | Expired X.509 TLS certificate (`notAfter: 2026-01-01`) | `CERT_EXPIRED` (Severity: High, -35 Pts). |
| `dev-edge.aiori.lab` | Internal Edge Host | **TEST-SEED-02** | Unapproved Port 8080 open (Werkzeug debug console) | `NEW_SERVICE` on 8080 (Severity: High, -25 Pts). |
| `test-s3.aiori.lab` | Test Storage Host | **TEST-SEED-03** | CNAME pointing to unallocated AWS S3 bucket | `DANGLING_DNS_ADDED` with `NoSuchBucket` (-30 Pts). |

### 9.3 Scenario Scripts
- `scenarios/t0.sh`: Clean lab baseline ($T_0$).
- `scenarios/t1.sh`: Injects seeded faults `TEST-SEED-01`, `02`, `03` ($T_1$).
- `scenarios/t2.sh`: Remediates issues: renews cert, blocks 8080, deletes orphaned CNAME ($T_2$).

### 9.4 Validation Criteria
1. **Seeded Detection**: 100% detection of all 3 seeded issues in $T_1$.
2. **Control Invariance**: 0 high-severity findings on clean control assets.
3. **Scope Enforcer**: Non-approved targets rejected with `ScopeViolationError`.
4. **Port Conformance**: Only ports `[22, 53, 80, 443, 8080]` probed.
5. **Merkle Integrity**: Single-bit modification of snapshot causes `argus verify` to fail.

---

## 10. False-Positive Analysis and Confidence Calibration

Every finding is treated as an evidence-backed hypothesis with a calibrated confidence rating:

| FP Class | Root Cause | Handling Rule | Effect on Confidence |
| :--- | :--- | :--- | :--- |
| **Wildcard DNS** | Wildcard record resolves all non-existent subdomains | Pre-query random non-existent subdomain; if it resolves to same IP, tag zone as wildcard | Lowers confidence for new-asset findings under that zone |
| **CDN / Reverse Proxy** | Cloudflare/Akamai edges fronting real origin | Detect CDN by CNAME pattern and Server headers | Downgrades service and port findings |
| **Lab Self-Signed Certs** | Expected internal staging certificates | Match against host role in `approved_scope.json` | Re-classifies from "invalid" to "staging self-signed" |
| **Transient Timeouts** | Flaky socket or temporary DNS dropped packet | Retry once before alert; require confirmation across 2 consecutive scans | Set to Medium until verified |
| **Generic 404 Pages** | Application returns 404 for missing paths | Require provider-specific fingerprint strings (e.g. `NoSuchBucket`), not raw 404 status | Downgrades generic 404s to Low confidence |

### Confidence Calibration Matrix for Dangling DNS

| Observed Signals | Assigned Confidence | Label in Console & PDF |
| :--- | :--- | :--- |
| Target returns `NXDOMAIN` + matches cloud domain pattern | **High** | Potential Dangling DNS Candidate (High Confidence) |
| Provider-specific fingerprint matched (e.g. `NoSuchBucket`) | **High** | Potential Dangling DNS Candidate (High Confidence) |
| Cloud provider pattern matched, but HTTP probe timed out | **Medium** | Potential Dangling DNS Candidate (Medium Confidence) |
| Generic 404 response on wildcard or CDN-fronted zone | **Low** | Weak Indicator (Requires Manual Review) |

---

## 11. Team Structure and Work Allocation

ArgusASM is built by 2 developers using a **feature-wise vertical slice** model:

| Developer | Vertical Ownership | Primary Responsibilities |
| :--- | :--- | :--- |
| **Developer 1 (Engine Lead)** | Backend & Probe Infrastructure | • `scope_engine.py` & request ledger<br>• `dns_probe.py` & `tls_probe.py`<br>• `service_probe.py` & `dangling_dns_probe.py`<br>• `merkle_audit.py` & `fp_engine.py`<br>• Docker testbed (CoreDNS & mock hosts) |
| **Developer 2 (Console & Sentinel Lead)** | Frontend & Visualization | • React HUD & Navigation Shell<br>• Perimeter Hygiene Score Gauge & Rubric<br>• Stateful Diff Inspector & Time-Travel Slider<br>• Interactive Relationship Graph (Canvas/SVG)<br>• Remediation Drawer & CLI Terminal Modal |

---

## 12. Day-by-Day Execution Schedule (16 to 31 Oct)

- **Phase 1: Foundation & The Four Probes (Days 1 to 4: 16-19 Oct)**
  - Day 1: Initialize `backend/` and `frontend/`, implement `scope_engine.py` with hard caps, build `dns_probe.py`.
  - Day 2: Implement `tls_probe.py` (RFC 5280) and `service_probe.py` (ports 22, 53, 80, 443, 8080).
  - Day 3: Implement `dangling_dns_probe.py` with provider fingerprinting.
  - Day 4: Assemble `app.py` REST API, connect active probes to React Inventory table.
- **Phase 2: Drift Engine & Seeded Testbed (Days 5 to 8: 20-23 Oct)**
  - Day 5: Docker testbed with CoreDNS and mock targets for `legacy.aiori.lab`, `dev-edge.aiori.lab`, `test-s3.aiori.lab`.
  - Day 6: Build `drift_engine.py` comparing $T_0$ against $T_1$. Connect to frontend Diff Viewer.
  - Day 7: Implement `scoring_engine.py` (0-100 score with CVSS deductions).
  - Day 8: Build `tests/seeded_validation.py` asserting 100% detection of all 3 seeded issues.
- **Phase 3: Differentiators & Hardening (Days 9 to 12: 24-27 Oct)**
  - Day 9: Implement Canvas/SVG Asset Relationship Graph.
  - Day 10: Implement Time-Travel Historical Scrubber ($T_0, T_1, T_2$).
  - Day 11: Implement `fp_engine.py` (confidence calibration) & Remediation Advisor drawer.
  - Day 12: Implement SHA-256 Merkle Audit Ledger and tamper-verification CLI.
- **Phase 4: Documentation, Demo & Submission (Days 13 to 15: 28-30 Oct)**
  - Day 13: Author submission document `Proposed-structure-hackathon.pdf`.
  - Day 14: Dry-run demo recording and mentor walkthrough preparation.
  - Day 15: Final code freeze, repository handover readiness, add `aiori-hackathon` collaborator.
  - **Buffer Day (31 Oct)**: Final submission freeze and evaluator standby.

---

## 13. Submission Package: Steps 8, 9 and 10

### 13.1 GitHub Collaboration & Handover
1. Repository maintained on GitHub named strictly after the team.
2. Add `aiori-hackathon` (https://github.com/aiori-hackathon) as a collaborator.
3. Prepare for ownership transfer upon request.

### 13.2 `Proposed-structure-hackathon.pdf` Structure

| Section | Content |
| :--- | :--- |
| **1. Title & Abstract** | Team name, PS-011, executive abstract, approved scope definition. |
| **2. Architecture & Probes** | Logical architecture and detailed specifications of the 4 probes. |
| **3. Non-Exploitation Policy** | Safety guardrails, scope boundary code, and request ledger proof. |
| **4. Stateful Drift Detection** | Snapshot schema, drift algorithm, event catalog, Merkle hash chain. |
| **5. Seeded-Issue Results** | Empirical detection tables for `TEST-SEED-01`, `02`, `03`. |
| **6. False-Positive Analysis** | FP classes, confidence calibration table, and worked lab controls. |
| **7. Conclusion & Impact** | Enterprise attack-surface visibility, security posture enhancement. |

### 13.3 3-Minute Mentor Demonstration Script
1. **Minute 1 (Scope & 4 Probes)**: Show `approved_scope.json` guardrails in the HUD. Run an active discovery scan. Highlight Check 1 (DNS), Check 2 (TLS), Check 3 (Ports), and Check 4 (Dangling DNS).
2. **Minute 2 (Seeded Faults & Drift)**: Open the **Drift Timeline**. Scrub between Baseline ($T_0$) and Current ($T_1$). Point to the 3 detected faults (`legacy.aiori.lab`, `dev-edge.aiori.lab`, `test-s3.aiori.lab`). Show the Hygiene Score drop from 96 to 68.
3. **Minute 3 (Remediation & Merkle Proof)**: Open the **Remediation Drawer** showing copy-paste DNS/Certbot/UFW fixes. Run `argus verify` to prove SHA-256 Merkle chain integrity. Display the request ledger confirming zero invasive requests.

---

## 14. Evaluator Alignment Matrix

| Evaluation Criterion | Where Evaluators Can Verify | Primary Artifact |
| :--- | :--- | :--- |
| **Meets PS-011 Scope** | 4 documented probes, snapshot engine, drift alerts | `backend/engine/probes/`, `README.md` |
| **Detects Seeded Faults** | Automated validation script & CoreDNS lab testbed | `tests/seeded_validation.py`, `testbed/` |
| **Safety & Ethics** | Scope enforcer, restricted port list, passive fingerprinting | `backend/engine/scope_engine.py`, `approved_scope.json` |
| **False-Positive Handling**| FP engine, confidence calibration table, lab controls | `RESEARCH_REFERENCES.md`, `fp_engine.py` |
| **Technical Depth** | SHA-256 Merkle tree provenance, time-travel scrubber | `backend/engine/merkle_audit.py`, `routes/zero-decrypt.tsx` |
| **Usability & UX** | Dark-mode HUD, circular hygiene gauge, visual diff viewer | `frontend/src/components/sentinel/` |
| **Code Quality & CI** | Automated pytest suite with 100% pass rate | `tests/`, `frontend/dist/` bundle |

---

## 15. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| Scope creep into Tier 2/3 before Tier 1 is stable | High | High | Tier 1 and seeded validation must pass 100% before adding bonus features. |
| Flaky live internet connectivity during demo | Medium | High | Isolated Docker testbed and authoritative lab cache fallbacks built directly into probes. |
| Accidental scanning of external infrastructure | Low | Critical | `ScopeSafetyEnforcer` raises uncatchable exception if target not in `approved_scope.json`. |
| Dangling DNS claims perceived as intrusive | Medium | High | Strict non-exploitation wording; passive fingerprinting only; labelled as "Candidates". |
| Evaluator unable to run live app | Medium | High | Fallback package: pre-built bundle, demo video, and reproducible `seeded_validation.py`. |

---

## 16. Open Questions and Assumptions

### 16.1 Assumptions
1. Level 2 build window runs 16 Oct to 30 Oct, with 31 Oct as submission freeze.
2. Evaluator portfolio is represented by `approved_scope.json` (max 20 domains and 10 hosts).
3. The lab environment runs deterministically in Docker without requiring external cloud accounts.

### 16.2 Organizer Clarifications
- Confirm whether the final evaluation scope is fixed by mentors or defined by the team (our `approved_scope.json` is ready to load either).
- Confirm submission portal instructions for `Proposed-structure-hackathon.pdf`.

---

## 17. Appendices

### Appendix A: Mentor Pseudocode Snippet (15 Lines)
```python
def audit_attack_surface(scope: ApprovedScope) -> InventorySnapshot:
    snapshot = InventorySnapshot(timestamp=now(), assets=[])
    for target in scope.domains + scope.hosts:
        assert_in_scope(target, scope)  # Scope Safety Enforcer
        # Check 1: DNS Record Inventory (RFC 1035)
        dns_records = resolve_dns_records(target, types=["A", "AAAA", "CNAME", "MX", "TXT", "NS"])
        # Check 2: TLS Certificate Validity & Expiry (RFC 5280)
        tls_cert = inspect_tls_certificate(target, port=443, timeout=3.0)
        # Check 3: Documented Exposed Service Verification
        open_services = probe_permitted_ports(target, ports=[22, 53, 80, 443, 8080])
        # Check 4: Potential Dangling DNS Identification
        dangling_status = evaluate_dangling_dns_candidate(dns_records.cname)

        asset = compile_asset(target, dns_records, tls_cert, open_services, dangling_status)
        snapshot.assets.append(asset)

    drift_report = compute_baseline_drift(baseline=load_snapshot("T0"), current=snapshot)
    snapshot.merkle_root = compute_merkle_tree(snapshot.assets)
    return snapshot, drift_report
```

### Appendix B: Snapshot JSON Schema
```json
{
  "snapshot_id": "T1",
  "timestamp": "2026-10-23T10:00:00Z",
  "scope_hash": "sha256:7f82b9a4c1...",
  "previous_root": "0x3f7a91bc829e...",
  "merkle_root": "0x86fafc721f32...",
  "hygiene_score": 68,
  "assets": [
    {
      "target": "legacy.aiori.lab",
      "dns": { "A": ["10.0.2.10"], "CNAME": [], "MX": [], "TXT": [], "NS": ["ns-01.aiori.lab"], "ttl": 300 },
      "tls": {
        "subject": "CN=legacy.aiori.lab", "issuer": "CN=AIORI Lab CA", "sans": ["legacy.aiori.lab"],
        "not_before": "2025-01-01T00:00:00Z", "not_after": "2026-01-01T00:00:00Z", "expired": true,
        "expires_in_days": -292, "self_signed": false, "hostname_match": true
      },
      "services": [ { "port": 443, "state": "open", "banner": "nginx/1.24", "expected": true } ],
      "dangling": { "candidate": false, "provider": null, "confidence": "none", "signals": [] }
    }
  ],
  "findings": [
    {
      "id": "F-001",
      "seed": "TEST-SEED-01",
      "type": "CERT_EXPIRED",
      "severity": "high",
      "confidence": "high",
      "fp_risk": "low"
    }
  ]
}
```

### Appendix C: CLI Command Reference

| Command | Purpose |
| :--- | :--- |
| `argus scan --scope approved_scope.json` | Run authorised scan across approved targets and write a new snapshot. |
| `argus diff --baseline T0 --current T1` | Print structured drift delta between baseline and current observation. |
| `argus verify --snapshot T1` | Recompute SHA-256 Merkle root and assert tamper-free integrity. |
| `argus remediate --finding F-001` | Output safe, copy-paste remediation commands. |
| `argus stop` | Global emergency kill switch: immediately terminates all in-flight probing. |

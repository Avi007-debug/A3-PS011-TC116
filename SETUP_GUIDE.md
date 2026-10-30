# ArgusASM - Operational Setup & Deployment Guide
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**  
*Track: Cybersecurity & Infrastructure Resilience - AIORI Hackathon 2026*

---

## 1. Executive Summary & Review Modes

ArgusASM is architected for maximum flexibility across evaluation environments. Evaluators and mentors can test and review the platform through any of the following 3 modes:

| Mode | Target Audience | Prerequisites | Setup Time |
| :--- | :--- | :--- | :--- |
| **Mode 1: Live Cloud Deployment** | Mentors, Evaluators, Judges | Modern Web Browser | **0 Seconds (Instant)** |
| **Mode 2: Local Lightweight Launch** | Developers, Code Reviewers | Python 3.11+, Node 18+ (No Docker required) | **< 60 Seconds** |
| **Mode 3: Full Docker Lab Testbed** | Deep Security Architecture Audit | Docker & Docker Compose | **< 2 Minutes** |

> **Evaluator Note regarding Live Deployed Links:**
> The live deployment contains built-in **simulation and deterministic lab fixtures** (`active_state.json` and `/api/v1/simulation/state`). Evaluators can test full stateful drift ($T_0 \to T_1 \to T_2$), all 3 seeded vulnerabilities, false-positive calibrations, and cryptographic Merkle proofs directly in the web browser **without needing a local Docker daemon**.

---

## 2. Mode 1: Live Cloud Deployment (Zero Install)

1. Open the live deployment link in any modern desktop browser (Chrome, Edge, Brave, Firefox, Safari).
2. The Sentinel Console will automatically connect to the backend sentinel engine.
3. If reviewing offline or when disconnected from the live backend, the console seamlessly activates its **deterministic client-side demo mode** with zero configuration required.
4. Use the **Time-Travel Scrubber** or Scenario Selector to simulate state transitions ($T_0$ Clean Baseline, $T_1$ Drifted, $T_2$ Remediated).

---

## 3. Mode 2: Local Lightweight Launch (No Docker Needed)

Run the full platform locally without launching Docker containers. The backend engine utilizes its built-in deterministic lab caches for RFC-compliant DNS, TLS, port auditing, and dangling CNAME evaluations.

### Step 1: Clone & Prepare Python Environment
```bash
git clone https://github.com/aiori-hackathon/A3-PS011-TC116.git
cd A3-PS011-TC116

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

### Step 2: Launch FastAPI Backend Sentinel Engine
```bash
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```
- **Live Health & Telemetry:** `http://localhost:8000/`
- **Interactive OpenAPI Swagger Docs:** `http://localhost:8000/docs`
- **SARIF Security Export:** `http://localhost:8000/api/v1/export/sarif`
- **Executive Audit Report:** `http://localhost:8000/api/v1/export/executive-report`

### Step 3: Launch React Sentinel Console (In a New Terminal)
```bash
cd frontend
npm install
npm run dev
```
- **Sentinel HUD Portal:** `http://localhost:5173/`

---

## 4. Mode 3: Full Docker Lab Testbed (Optional)

The testbed simulates a corporate perimeter on subnet `10.0.0.0/16` with 5 isolated containers:
- **CoreDNS** (`127.0.0.1:1053`): Authoritative DNS for `aiori.lab`
- **Host A (Control)** (`127.0.0.1:8443`): Healthy Nginx with valid TLS (0 high findings)
- **Host B (Seed 1)** (`127.0.0.1:8444`): `legacy.aiori.lab` with expired TLS cert
- **Host C (Seed 2)** (`127.0.0.1:8080`): `dev-edge.aiori.lab` with unauthorized Werkzeug debug console
- **Mock S3 (Seed 3)** (`127.0.0.1:9000`): Returns AWS S3 `NoSuchBucket` XML error

### Launching the Testbed Containers:
```bash
cd testbed
docker compose up -d
docker compose ps
```

### Managing Testbed Drift Scenarios:
Use the cross-platform scenario manager:
```bash
# 1. Clean Baseline (T0) - Expected Score: 96/100
python testbed/run_scenarios.py --state T0

# 2. Inject 3 Required Seeds (T1) - Expected Score: 68/100
python testbed/run_scenarios.py --state T1

# 3. Remediated State (T2) - Expected Score: 96/100
python testbed/run_scenarios.py --state T2
```

---

## 5. Automated Verification & Test Harness

Run the comprehensive automated test suite validating safety policies, RFC probes, Merkle audit trails, and false-positive calibration:

```bash
# Run all 51 automated unit tests across 9 test suites
python -m pytest tests/ -v

# Run 10-step full seeded evaluation runner
python tests/seeded_validation.py

# Run terminology and style lint (verifies non-offensive language)
python -m pytest tests/test_wording_lint.py -v
```

---

## 6. Unified Argus CLI Operations

ArgusASM provides an operator CLI ([`argus.py`](file:///c:/Coding/A3-PS011-TC116/argus.py)) for headless CI/CD automation:

```bash
# 1. Run scope-enforced inventory scan
python argus.py scan --scope approved_scope.json

# 2. Calculate stateful drift between T0 baseline and T1 current
python argus.py diff --baseline T0 --current T1

# 3. Cryptographically verify SHA-256 Merkle snapshot chain
python argus.py verify

# 4. Inspect request ledger audit trail (R-1)
python argus.py ledger --limit 10

# 5. Engage emergency kill switch (R-7)
python argus.py kill --action activate --reason "Operator manual abort"

# 6. Generate non-destructive remediation snippet
python argus.py remediate --category EXPIRED_TLS --target legacy.aiori.lab
```

---

## 7. Key Architecture & File Structure

```text
A3-PS011-TC116/
|-- SETUP_GUIDE.md               <- This operational deployment guide
|-- TEST_FEATURES.md             <- Evaluator feature testing and demo walkthrough
|-- argus.py                     <- Unified operator CLI (scan, diff, verify, kill)
|-- approved_scope.json          <- Scope contract (hard caps: 20 domains, 10 hosts)
|-- backend/
|   |-- app.py                   <- FastAPI server & REST endpoints
|   `-- engine/
|       |-- scope_engine.py      <- Scope safety enforcement & caps (G-01 to G-04)
|       |-- request_ledger.py    <- Audit ledger logging strictly 0 calls on violations
|       |-- kill_switch.py       <- Emergency kill switch singleton (R-7)
|       |-- hitl_gate.py         <- Human-in-the-Loop review & sign-off gate
|       |-- merkle_audit.py      <- SHA-256 Merkle tree & chain verification (R-8)
|       |-- fp_engine.py         <- False-positive calibration & confidence scorer
|       |-- export_engine.py     <- SARIF 2.1.0, CSV, JSON & Executive Report generator
|       |-- ct_monitor.py        <- Passive CT log discovery (no auto-probing)
|       |-- graph_engine.py      <- Dynamic node-link topology graph generator
|       `-- probes/              <- 4 RFC-compliant passive inspection probes
|-- frontend/                    <- React 19 + TypeScript + Vite tactical console
|-- testbed/                     <- 5-container isolated Docker security lab
`-- tests/                       <- 51 automated pytests & seeded evaluation runner
```


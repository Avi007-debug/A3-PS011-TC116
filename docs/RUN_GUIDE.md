# ArgusASM - Complete Run & Operational Guide
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**  
*AIORI Hackathon 2026 - Track: Cybersecurity & Infrastructure Resilience*

---

## 1. Quick Start Summary (Under 60 Seconds)

ArgusASM runs as an enterprise-grade decoupled architecture: a high-performance **FastAPI backend probe engine** paired with a **React 19 + TypeScript + Vite HUD console** and an isolated **Docker lab testbed**.

### Option A: One-Command Automation via Makefile
```powershell
# 1. Run full 10-step automated seeded validation runner
make demo

# 2. Run full pytest suite (19/19 tests passing)
make test

# 3. Launch isolated 5-container Docker lab testbed
make testbed-up
```

### Option B: Manual Command-Line Launch

#### Step 1: Launch FastAPI Backend Engine (Port 8000)
```powershell
# From project root
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```
- Interactive OpenAPI Swagger Docs: **`http://localhost:8000/docs`**
- Healthcheck & Guardrail Telemetry: **`http://localhost:8000/`**

#### Step 2: Launch Vite Sentinel Console (Port 5173)
```powershell
# In a second terminal window
cd frontend
npm run dev
```
- Interactive HUD Portal: **`http://localhost:5173/`**

#### Step 3: Run Seeded Validation & Automated Tests
```powershell
# Run the 10-step automated seeded evaluation runner
python tests/seeded_validation.py

# Run full pytest suite (safety, wording lint, probes, Merkle, scoring)
python -m pytest tests/ -v
```

---

## 2. Docker Lab Testbed Setup & Scenarios

The testbed runs 5 isolated containers simulating an enterprise attack surface on subnet `10.0.0.0/16`:

### 1. Launch Containers
```powershell
cd testbed
docker compose up -d
```
Verified services:
- **CoreDNS** (`127.0.0.1:1053`): Authoritative DNS for `aiori.lab`
- **Host A (Control)** (`127.0.0.1:8443`): Healthy Nginx with valid TLS certificate (0 high findings)
- **Host B (Seed 1)** (`127.0.0.1:8444`): `legacy.aiori.lab` with expired TLS certificate
- **Host C (Seed 2)** (`127.0.0.1:8080`): `dev-edge.aiori.lab` with unauthorized port 8080 open
- **Mock S3 (Seed 3)** (`127.0.0.1:9000`): Returns AWS S3 `NoSuchBucket` XML error

### 2. Verify Container Health
```powershell
docker compose ps
```

### 3. Controlling Drift Scenarios via `testbed/run_scenarios.py`
Use the cross-platform scenario manager to simulate stateful drift:
```powershell
# 1. Clean Baseline (T0) - Score: 96/100 (Clean)
python testbed/run_scenarios.py --state T0

# 2. Inject 3 Seeds (T1) - Score: 68/100 (Elevated Risk)
python testbed/run_scenarios.py --state T1

# 3. Remediated State (T2) - Score: 96/100 (Hardened)
python testbed/run_scenarios.py --state T2
```

---

## 3. Step-by-Step Live Demo Walkthrough (for Judges & Evaluators)

Follow this 3-minute sequence to demonstrate all core capabilities of ArgusASM:

### Step 1: Scope Enforcement & Top HUD Telemetry
1. Open **`http://localhost:5173/`**.
2. Note the **Top Telemetry Strip**:
   - `SCOPE: 20 DOMAINS / 10 HOSTS` (Strictly enforced per PS-011)
   - `NON-EXPLOITATION: PASSIVE PROBES ONLY`
   - Wire latency (<1ms) and live check counter.

### Step 2: Establish Clean Baseline ($T_0$)
1. In terminal, set perimeter to clean state:
   ```powershell
   python testbed/run_scenarios.py --state T0
   ```
2. In the Sentinel Console, click **"Run Scan"**.
3. Verify Perimeter Hygiene Score is **96/100** (Clean/Hardened).
4. Inspect the **Asset Inventory** tab: all certificates valid, no unapproved ports, zero dangling CNAMEs.

### Step 3: Inject Stateful Drift ($T_1$) with the 3 Required Seeds
1. In terminal, inject the 3 seeds:
   ```powershell
   python testbed/run_scenarios.py --state T1
   ```
2. In Sentinel Console, click **"Run Scan"**.
3. Notice immediate real-time alerts:
   - **Critical Alert**: `legacy.aiori.lab:443` expired TLS certificate (-35 pts)
   - **High Alert**: `dev-edge.aiori.lab:8080` unauthorized debug port open (-25 pts)
   - **High Alert**: `test-s3.aiori.lab` potential dangling CNAME to deleted S3 bucket (-30 pts)
4. Score drops automatically to **68/100 (Elevated Risk)**.

### Step 4: Human-in-the-Loop (HITL) Governance Gate
1. Open the **Sentinel Console** drawer and select the **HITL Gate** tab.
2. Note that all 3 critical actions are in status `PENDING OPERATOR SIGN-OFF`.
3. Click **"Sign-off (Authorize)"** on the TLS renewal action.
4. Status changes to **`AUTHORIZED BY HUMAN`**, proving zero unauthorized automated modifications.

### Step 5: Stateful Drift Inspector ($T_0$ vs $T_1$)
1. Navigate to **`/drift`**.
2. Compare Baseline $T_0$ against Current $T_1$.
3. Review the 3 categorized drift events (`EXPIRED_CERT`, `NEW_SERVICE`, `DANGLING_DNS_CANDIDATE`).

### Step 6: Cryptographic Merkle Audit Trail
1. Navigate to **`/audit`** (or select the **Merkle Receipt** tab in Sentinel console).
2. Click **"Verify Merkle Proof"**.
3. Green check appears: status **`VERIFIED_TAMPER_FREE`** with SHA-256 root chained to previous snapshot.

### Step 7: Time-Travel to Remediated State ($T_2$)
1. In terminal, apply safe remediation:
   ```powershell
   python testbed/run_scenarios.py --state T2
   ```
2. In UI, use the **Time-Travel Scrubber** to scrub to $T_2$.
3. Score recovers to **96/100**, and drift diff shows `*_RESOLVED` events.

---

## 4. REST API Endpoint Reference

| Endpoint | Method | Role |
| :--- | :--- | :--- |
| `GET /` | GET | System status, scope caps, and engine version. |
| `GET /api/v1/scope` | GET | Scope definitions, owner, auth ref, validity window. |
| `GET /api/v1/inventory` | GET | Full discovered asset catalog across the 4 probes. |
| `GET /api/v1/drift?baseline=T0&current=T1` | GET | Stateful drift diff with full typed event classes. |
| `GET /api/v1/snapshots` | GET | Index of versioned snapshots (`T0.json`, `T1.json`, `T2.json`). |
| `GET /api/v1/snapshots/{id}` | GET | Canonical snapshot JSON with `scope_sha256` and Merkle root. |
| `GET /api/v1/score` | GET | 0-100 Perimeter Hygiene Score breakdown. |
| `GET /api/v1/ledger` | GET | Request ledger entries ($R_1$) showing 0 network calls on violations. |
| `GET /api/v1/ledger/stats` | GET | Total requests, network calls, and blocked violations. |
| `GET /api/v1/killswitch` | GET | Emergency kill switch ($R_7$) operational status. |
| `POST /api/v1/killswitch` | POST | Engages or disengages emergency kill switch (`activate`/`deactivate`). |
| `GET /api/v1/hitl/pending` | GET | Actions awaiting Human-in-the-Loop review and sign-off. |
| `POST /api/v1/hitl/approve` | POST | Authorizes a high-criticality remediation action. |
| `POST /api/v1/hitl/reject` | POST | Suppresses or flags finding as false positive. |
| `GET /api/v1/alerts` | GET | Real-time alerts with Discord/Slack webhook embed preview. |
| `GET /api/v1/scheduler` | GET | Background scheduler status and recurring run count. |
| `POST /api/v1/scan` | POST | Triggers immediate authorized perimeter scan. |
| `POST /api/v1/remediation/simulate` | POST | Generates copy-paste remediation directives. |

---

## 5. Teardown
```powershell
# Stop Docker testbed containers
cd testbed
docker compose down

# Or via Makefile
make testbed-down
```

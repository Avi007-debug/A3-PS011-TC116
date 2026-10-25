# ArgusASM - Comprehensive Testing & Demonstration Guide
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**  
*AIORI Hackathon 2026 - Track: Cybersecurity & Infrastructure Resilience*

---

## 1. Testing Philosophy & Hackathon Compliance

ArgusASM is engineered specifically to meet the strict evaluation criteria of **AIORI Problem Statement PS-011**:
1. **Scope Safety & Non-Exploitation**: Strict adherence to the `approved_scope.json` contract (hard cap of 20 domains and 10 hosts). Zero invasive scanning, fuzzing, or payload execution.
2. **4 Documented Probes**: Complete coverage of RFC 1035 DNS, RFC 5280 TLS, permitted service ports, and dangling cloud DNS takeover risks.
3. **Stateful Drift Comparison**: Deterministic diff between $T_0$ Baseline, $T_1$ Drifted, and $T_2$ Remediated snapshots.
4. **Seeded Vulnerability Detection**: Proven, 100% recall on the 3 required seeded test faults.
5. **Control Precision**: 100% precision on Host A control (zero false positives).
6. **Human-in-the-Loop Governance**: Verification of operator sign-off before remediation dispatch.
7. **Cryptographic Provenance**: SHA-256 Merkle audit trail mathematically proving baseline snapshot integrity.

---

## 2. Automated Test Suite Directory

The test harness in [`tests/`](file:///c:/Coding/A3-PS011-TC116/tests/) validates all core subsystems across 19 automated test cases:

| Test File | Subsystem | Verification Target | Test Count |
| :--- | :--- | :--- | :--- |
| [`test_safety.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_safety.py) | **Scope & Safety Enforcer** | Enforces 20 domain / 10 host limit; asserts **strictly 0 network calls** on out-of-scope targets via Request Ledger; enforces port whitelist [22, 53, 80, 443, 8080]; asserts validity window expiry; tests kill switch. | 6 Tests |
| [`test_wording_lint.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_wording_lint.py) | **Terminology & Style Lint** | Verifies non-offensive terminology (zero "takeover possible", enforces "potential dangling DNS candidate"); asserts zero typographical em/en-dashes. | 2 Tests |
| [`test_scope_engine.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_scope_engine.py) | **Scope Engine Unit Tests** | Validates target parsing, host matching, and summary payload schema. | 3 Tests |
| [`test_scoring_engine.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_scoring_engine.py) | **Perimeter Hygiene Scorer** | Asserts clean posture (96/100) vs drifted state (68/100); checks CVSS deductions (-35, -25, -30). | 2 Tests |
| [`test_merkle_audit.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_merkle_audit.py) | **Merkle Audit Ledger** | Computes 32-byte SHA-256 Merkle root across inventory; flags single-bit mutations as tamper events. | 2 Tests |
| [`test_probes.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_probes.py) | **4 Documented Probes** | Validates DNS records (RFC 1035), TLS expiry (RFC 5280), port filtering, and dangling CNAME checks. | 4 Tests |
| [`seeded_validation.py`](file:///c:/Coding/A3-PS011-TC116/tests/seeded_validation.py) | **End-to-End Evaluation Runner** | 10-step full discovery run asserting 100% recall on 3 seeds, 100% precision on Host A control, HITL staging, and Merkle provenance. | 10 Steps |

---

## 3. Running the Automated Tests

### Execute Full Pytest Suite (All 19 Tests Passing)
```powershell
python -m pytest tests/ -v
```
*(Or run `make test`)*

### Run Individual Test Modules
```powershell
# 1. Safety Guardrail & Request Ledger Tests (6 tests)
python -m pytest tests/test_safety.py -v

# 2. Terminology & Wording Lint (2 tests)
python -m pytest tests/test_wording_lint.py -v

# 3. Scope Engine Unit Tests (3 tests)
python -m pytest tests/test_scope_engine.py -v

# 4. Scoring Engine CVSS Deductions (2 tests)
python -m pytest tests/test_scoring_engine.py -v

# 5. Merkle Provenance Ledger (2 tests)
python -m pytest tests/test_merkle_audit.py -v

# 6. Active Probe Handshake Tests (4 tests)
python -m pytest tests/test_probes.py -v
```

---

## 4. Seeded Fault Evaluation Matrix & Precision/Recall

Run the single-command validation runner:
```powershell
python tests/seeded_validation.py
```
*(Or run `make demo`)*

### Ground Truth vs. ArgusASM Observed Results

| Target Asset | Probe Category | Ground Truth Injected Fault | ArgusASM Observed Result | Score Impact | HITL Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `legacy.aiori.lab:443` | **Check 2: TLS** | Expired X.509 certificate (`notAfter: 2026-01-01`) | **DETECTED (100%)**: `EXPIRED_CERT` | **-35 Points** | `PENDING OPERATOR SIGN-OFF` |
| `dev-edge.aiori.lab:8080` | **Check 3: Ports** | Unapproved Port 8080 open (Werkzeug debug console) | **DETECTED (100%)**: `NEW_SERVICE` | **-25 Points** | `PENDING OPERATOR SIGN-OFF` |
| `test-s3.aiori.lab` | **Check 4: Dangling DNS** | CNAME pointing to deleted AWS S3 bucket | **DETECTED (100%)**: `DANGLING_DNS_CANDIDATE` | **-30 Points** | `PENDING OPERATOR SIGN-OFF` |
| `api.aiori.lab:443` | **Host A Control** | Healthy production server with valid TLS cert | **VERIFIED CLEAN (100%)**: Zero findings | **0 Deductions** | `NOMINAL (No Action)` |

### Empirical Precision & Recall Table

```text
+----------------------+--------------+--------------+--------------------+
| Evaluation Metric    | Ground Truth | Detected     | Result / Accuracy  |
+----------------------+--------------+--------------+--------------------+
| Seeded Faults (TP)   | 3            | 3            | 100.0% Recall      |
| Control Host A (FP)  | 0            | 0            | 100.0% Precision   |
| Scope Enforcements   | 2            | 2 (Blocked)  | 100.0% Non-intrus  |
| HITL Staged Actions  | 3            | 3 (Queued)   | 100.0% Governance  |
+----------------------+--------------+--------------+--------------------+
```

---

## 5. Live Demonstration Workflow for Judges & Evaluators

### Step 1: Scope Enforcement & Non-Exploitation Proof
- In the top HUD or via `GET /api/v1/scope`, verify the strict 20 domain and 10 host cap.
- Point out that attempting to scan an out-of-scope target like `external-attacker.com` results in pre-flight rejection with strictly **0 network packets dispatched**, recorded in `/api/v1/ledger`.

### Step 2: 4 Documented Probes in Action
- Navigate to the **Asset Inventory** tab (`/capabilities`).
- Review the 4 probe cards:
  1. **DNS Inventory**: RFC 1035 resolution (A, AAAA, CNAME, MX, TXT, NS).
  2. **TLS Inspection**: Validity dates, SANs, and cipher trust.
  3. **Permitted Ports**: Authorised list [22, 53, 80, 443, 8080].
  4. **Dangling DNS**: Pattern matching against cloud signatures (AWS S3 NoSuchBucket, GitHub Pages, Azure).

### Step 3: Stateful Baseline Drift ($T_0$ vs $T_1$)
- Navigate to the **Drift Timeline** tab (`/drift`).
- Toggle between **Baseline ($T_0$)** and **Current ($T_1$)**.
- Review the structured JSON diff detailing asset additions, modifications, and security findings.

### Step 4: Human-in-the-Loop Governance Gate
- In the Sentinel Console drawer, open the **HITL Gate** tab.
- Demonstrate that all 3 critical actions are in status `PENDING OPERATOR SIGN-OFF`.
- Authorize the TLS renewal action to demonstrate operator sign-off with audit logging.

### Step 5: Cryptographic Merkle Audit Trail
- Navigate to the **Audit Ledger** tab (`/audit`).
- Show the SHA-256 Merkle root generated for the current inventory snapshot.
- Explain how this provides tamper-evident provenance chained to previous snapshots.

### Step 6: Safe Remediation Advisory
- Navigate to the **Perimeter Hygiene** tab (`/security`).
- Inspect the copy-paste remediation directives for AWS Route 53, Certbot, and UFW firewall rules.
- Demonstrate that ArgusASM provides actionable fixes without executing unauthorized modifications.

---

## 6. Testing the API Endpoints via cURL

```powershell
# 1. Healthcheck & Guardrail Telemetry
curl http://localhost:8000/

# 2. Outbound Request Ledger (R-1)
curl http://localhost:8000/api/v1/ledger

# 3. Emergency Kill Switch Status (R-7)
curl http://localhost:8000/api/v1/killswitch

# 4. Human-in-the-Loop Pending Queue
curl http://localhost:8000/api/v1/hitl/pending

# 5. Immediate Alerts & Webhook Preview
curl http://localhost:8000/api/v1/alerts

# 6. Stateful Drift Delta
curl "http://localhost:8000/api/v1/drift?baseline=T0&current=T1"

# 7. Snapshots Index
curl http://localhost:8000/api/v1/snapshots
```

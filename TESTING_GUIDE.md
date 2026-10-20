# ArgusASM — Comprehensive Testing & Demonstration Guide
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**  
*AIORI Hackathon 2026 — Track: Cybersecurity & Infrastructure Resilience*

---

## 1. Testing Philosophy & Hackathon Compliance

ArgusASM is engineered specifically to meet the strict evaluation criteria of **AIORI Problem Statement PS-011**:
1. **Scope Safety & Non-Exploitation**: Strict adherence to the `approved_scope.json` contract (hard cap of 20 domains and 10 hosts). Zero invasive scanning, fuzzing, or payload execution.
2. **4 Documented Probes**: Complete coverage of RFC 1035 DNS, RFC 5280 TLS, permitted service ports, and dangling cloud DNS takeover risks.
3. **Stateful Drift Comparison**: Deterministic diff between $T_0$ Baseline and $T_1$ Current snapshots.
4. **Seeded Vulnerability Detection**: Proven, reproducible identification of all 3 seeded test faults.
5. **Cryptographic Provenance**: SHA-256 Merkle audit trail mathematically proving baseline snapshot integrity.

---

## 2. Automated Test Suite Directory

The test harness in [`tests/`](file:///c:/Coding/A3-PS011-TC116/tests/) validates all core subsystems:

| Test File | Subsystem | Verification Target |
| :--- | :--- | :--- |
| [`test_scope_engine.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_scope_engine.py) | **Scope Safety Enforcer** | Enforces 20 domain / 10 host limit; rejects unapproved targets with `ScopeViolationError`. |
| [`test_scoring_engine.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_scoring_engine.py) | **Perimeter Hygiene Scorer** | Asserts clean posture (96/100) vs drifted state (68/100); checks CVSS deductions (-35, -25, -30). |
| [`test_merkle_audit.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_merkle_audit.py) | **Merkle Audit Ledger** | Computes 32-byte SHA-256 Merkle root across inventory; flags single-bit mutations as tamper events. |
| [`test_probes.py`](file:///c:/Coding/A3-PS011-TC116/tests/test_probes.py) | **4 Documented Checks** | Validates DNS records (RFC 1035), TLS expiry (RFC 5280), port filtering, and dangling CNAME checks. |
| [`seeded_validation.py`](file:///c:/Coding/A3-PS011-TC116/tests/seeded_validation.py) | **End-to-End Evaluation** | Executes full discovery run and validates detection of all 3 seeded lab faults. |

---

## 3. Running the Tests

### Execute Full Pytest Suite
```powershell
python -m pytest tests/ -v
```

### Run Individual Test Modules
```powershell
# 1. Scope Enforcer Tests
python -m pytest tests/test_scope_engine.py -v

# 2. Scoring & CVSS Rubric Tests
python -m pytest tests/test_scoring_engine.py -v

# 3. Merkle Audit Ledger Tests
python -m pytest tests/test_merkle_audit.py -v

# 4. Probe Verification Tests
python -m pytest tests/test_probes.py -v
```

---

## 4. Seeded Fault Evaluation Matrix

To demonstrate empirical detection to judges and mentors, run the seeded validation script:

```powershell
python tests/seeded_validation.py
```

### Ground Truth vs. ArgusASM Detection

| Target Asset | Seeded Fault Category | Ground Truth Fault | ArgusASM Detection Result | Score Deduction |
| :--- | :--- | :--- | :--- | :--- |
| `legacy.aiori.lab` | **Check 2: TLS Inspection** | Expired X.509 certificate (`notAfter: 2026-01-01`) | `FLAGGED`: Expired TLS Certificate (RFC 5280) | **-35 Points** |
| `dev-edge.aiori.lab` | **Check 3: Permitted Ports** | Unapproved Port 8080 open (Werkzeug debug console) | `FLAGGED`: Unapproved Exposed Service Port | **-25 Points** |
| `test-s3.aiori.lab` | **Check 4: Dangling DNS** | CNAME pointing to dormant AWS S3 bucket | `FLAGGED`: Orphaned Cloud Storage CNAME | **-30 Points** |

**Resulting Hygiene Score:** $100 - 35 - 25 - 30 = \mathbf{68 / 100}$ (Elevated Risk Status).

---

## 5. Live Demonstration Workflow for Judges

### Step 1: Scope Enforcement & Non-Exploitation Proof
- In the top HUD or via `GET /api/scope`, show that only approved targets are evaluated.
- Demonstrate that attempting to scan an external target like `malicious.com` triggers an immediate scope rejection.

### Step 2: 4 Documented Probes in Action
- Navigate to the **Asset Inventory** tab (`/capabilities`).
- Review the 4 probe cards:
  1. **DNS Inventory**: RFC 1035 resolution (A, AAAA, CNAME, MX, TXT).
  2. **TLS Inspection**: Validity dates, SANs, and cipher trust.
  3. **Permitted Ports**: Authorised list [22, 53, 80, 443, 8080].
  4. **Dangling DNS**: Pattern matching against cloud signatures (AWS S3, GitHub Pages, Azure).

### Step 3: Stateful Baseline Drift ($T_0$ vs $T_1$)
- Navigate to the **Drift Timeline** tab (`/zero-decrypt`).
- Toggle between **Baseline ($T_0$)** and **Current ($T_1$)**.
- Review the structured JSON diff detailing asset additions, modifications, and security findings.

### Step 4: Cryptographic Merkle Audit Trail
- Navigate to the **Audit Ledger** tab (`/audit`).
- Show the SHA-256 Merkle root generated for the current inventory snapshot.
- Explain how this provides tamper-evident provenance for compliance auditing.

### Step 5: Safe Remediation Advisory
- In the **Findings** drawer or CLI modal, show the automated remediation output:
  - AWS Route 53 CNAME removal command.
  - Certbot TLS certificate renewal command.
  - UFW firewall port closure rule.

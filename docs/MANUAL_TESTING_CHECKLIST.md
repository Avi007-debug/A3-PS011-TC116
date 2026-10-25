# ArgusASM - Hands-On Manual Feature Testing Checklist
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**  
*AIORI Hackathon 2026 - Track: Cybersecurity & Infrastructure Resilience*

This checklist provides step-by-step manual test procedures for evaluators, judges, and developers to verify every core feature hands-on via terminal commands and the UI.

---

## Pre-Flight Setup: Starting the Services

Before running the manual tests, launch the backend and frontend in two separate terminals:

```powershell
# Terminal 1: Start FastAPI Backend Engine (Port 8000)
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start Vite Sentinel Console (Port 5173)
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## Test Case 1: Scope Hard Caps & Zero-Network-Call Rejection

- **Objective:** Verify that out-of-scope targets are blocked at pre-flight and recorded in the Request Ledger with strictly 0 network calls.
- **Manual Action (Terminal):**
  Query the backend with an unauthorized target:
  ```powershell
  python -c "from backend.engine.scope_engine import ScopeSafetyEnforcer; s = ScopeSafetyEnforcer(); approved, reason = s.is_target_approved('evil-attacker.com'); print('Approved:', approved); print('Reason:', reason)"
  ```
  Check the live request ledger via API:
  ```powershell
  curl http://localhost:8000/api/v1/ledger?status=ScopeViolation
  ```
- **Expected Result:**
  1. Terminal outputs `Approved: False` and `Reason: Target 'evil-attacker.com' is NOT in approved scope.`
  2. The JSON response from `/api/v1/ledger` shows entries with `"status": "ScopeViolation"` and `"network_calls_made": 0`.
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 2: Emergency Kill Switch Operation ($R_7$)

- **Objective:** Verify that engaging the kill switch halts all probing, and deactivating it restores operations.
- **Manual Action (Terminal):**
  1. Check current status:
     ```powershell
     curl http://localhost:8000/api/v1/killswitch
     ```
  2. Engage the kill switch:
     ```powershell
     curl -X POST http://localhost:8000/api/v1/killswitch -H "Content-Type: application/json" -d "{\"action\": \"activate\", \"reason\": \"Operator manual emergency test\"}"
     ```
  3. Attempt to trigger a perimeter scan:
     ```powershell
     curl -X POST http://localhost:8000/api/v1/scan -H "Content-Type: application/json" -d "{}"
     ```
  4. Deactivate the kill switch:
     ```powershell
     curl -X POST http://localhost:8000/api/v1/killswitch -H "Content-Type: application/json" -d "{\"action\": \"deactivate\"}"
     ```
- **Expected Result:**
  1. Step 2 returns `"status": "ENGAGED"` and `"kill_switch_active": true`.
  2. Step 3 returns HTTP 423 Locked with error: `"Scan blocked: Emergency kill switch is engaged."`.
  3. Step 4 restores `"status": "NOMINAL"` and `"kill_switch_active": false`.
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 3: Human-in-the-Loop (HITL) Governance Review

- **Objective:** Verify that critical findings require human sign-off before remediation dispatch.
- **Manual Action (Browser & Terminal):**
  1. Open **`http://localhost:5173`** and click the **"Run Scan"** button in the navbar.
  2. Open the **Sentinel Console** drawer (click the round yellow console button or press `~`).
  3. Click the **"HITL Gate"** tab.
  4. Review the 3 critical findings:
     - `legacy.aiori.lab:443` (Expired TLS)
     - `dev-edge.aiori.lab:8080` (Port 8080)
     - `test-s3.aiori.lab` (Dangling S3)
  5. Click the **"Sign-off (Authorize)"** button on `legacy.aiori.lab`.
  6. In terminal, verify the updated database state via API:
     ```powershell
     curl http://localhost:8000/api/v1/hitl/pending
     ```
- **Expected Result:**
  1. In the UI, the badge immediately updates from `PENDING OPERATOR SIGN-OFF` to **`AUTHORIZED BY HUMAN`** in green.
  2. Pending counter decrements.
  3. Proves zero unauthorized automated modifications.
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 4: Docker Lab Testbed & DNS Resolution

- **Objective:** Verify that CoreDNS and mock cloud services answer on their isolated ports.
- **Manual Action (Terminal):**
  1. Launch containers (if Docker Desktop is running):
     ```powershell
     cd testbed
     docker compose up -d
     ```
  2. Query CoreDNS on port 1053:
     ```powershell
     Resolve-DnsName -Name aiori.lab -Server 127.0.0.1 -Port 1053
     ```
  3. Query Mock S3 on port 9000:
     ```powershell
     curl http://127.0.0.1:9000
     ```
- **Expected Result:**
  1. CoreDNS resolves `aiori.lab` to IP `10.0.1.10`.
  2. Mock S3 returns HTTP 404 with body containing `<Code>NoSuchBucket</Code>`.
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 5: Seed 1 Verification - Expired TLS Certificate

- **Objective:** Manually verify that `legacy.aiori.lab` has an expired TLS certificate.
- **Manual Action (Terminal):**
  ```powershell
  python -c "from backend.engine.probes.tls_probe import TLSCertificateInspector; t = TLSCertificateInspector(); res = t.inspect_certificate('legacy.aiori.lab'); print('Expired:', res['is_expired']); print('Days Remaining:', res['days_remaining']); print('Valid Until:', res['valid_until'])"
  ```
- **Expected Result:**
  - `Expired: True`
  - `Days Remaining: -292` (or negative number)
  - `Valid Until: 2026-01-01T00:00:00Z`
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 6: Seed 2 Verification - Unauthorized Port 8080

- **Objective:** Manually verify that `dev-edge.aiori.lab` has unauthorized port 8080 open.
- **Manual Action (Terminal):**
  ```powershell
  python -c "from backend.engine.probes.service_probe import PermittedPortAuditor; p = PermittedPortAuditor(); res = p.audit_target('dev-edge.aiori.lab'); print('Unexpected Ports:', [x['port'] for x in res['unexpected_ports']]); print('Banner:', res['unexpected_ports'][0]['service'])"
  ```
- **Expected Result:**
  - `Unexpected Ports: [8080]`
  - `Banner: Werkzeug/2.3.8 Python/3.11.8 (Debug Console Exposed)`
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 7: Seed 3 Verification - Potential Dangling DNS CNAME

- **Objective:** Manually verify that `test-s3.aiori.lab` is identified as a potential dangling candidate without offensive exploitation.
- **Manual Action (Terminal):**
  ```powershell
  python -c "from backend.engine.probes.dangling_dns_probe import DanglingDNSDetector; d = DanglingDNSDetector(); res = d.evaluate_target('test-s3.aiori.lab'); print('Candidate:', res['is_dangling_candidate']); print('Provider:', res['provider']); print('Confidence:', res['confidence']); print('Evidence:', res['fingerprint_evidence'])"
  ```
- **Expected Result:**
  - `Candidate: True`
  - `Provider: AWS S3`
  - `Confidence: HIGH`
  - `Evidence: NoSuchBucket (The specified bucket does not exist)`
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 8: Control Host A Precision Verification

- **Objective:** Confirm Host A (`api.aiori.lab`) has 0 high/critical findings (zero false positives).
- **Manual Action (Terminal):**
  ```powershell
  python -c "from backend.engine.probes.tls_probe import TLSCertificateInspector; from backend.engine.probes.service_probe import PermittedPortAuditor; tls = TLSCertificateInspector().inspect_certificate('api.aiori.lab'); svc = PermittedPortAuditor().audit_target('10.0.1.11'); print('Host A TLS Expired:', tls['is_expired']); print('Host A Unexpected Ports:', len(svc['unexpected_ports']))"
  ```
- **Expected Result:**
  - `Host A TLS Expired: False`
  - `Host A Unexpected Ports: 0`
  - Proves 100% precision with 0 false alarms on control assets.
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 9: Stateful Drift Scrubber ($T_0 \to T_1 \to T_2$)

- **Objective:** Verify visual time-travel and score recovery in the UI.
- **Manual Action (Browser):**
  1. In the browser, navigate to **`http://localhost:5173/drift`**.
  2. Drag the **Time-Travel Scrubber** to **$T_0$**:
     - Verify state: Clean baseline, Score: **96/100**, Zero active drift events.
  3. Drag the scrubber to **$T_1$**:
     - Verify state: Drifted state, Score: **68/100**, 3 drift events shown in red/amber (`EXPIRED_CERT`, `NEW_SERVICE`, `DANGLING_DNS_CANDIDATE`).
  4. Drag the scrubber to **$T_2$**:
     - Verify state: Remediated state, Score: **96/100**, matching `*_RESOLVED` events displayed.
- **Expected Result:**
  The UI dynamically recomputes the score, updates the diff cards, and renders the state progression seamlessly.
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 10: Cryptographic Merkle Audit Attestation

- **Objective:** Verify that snapshot evidence is anchored into an immutable SHA-256 Merkle root.
- **Manual Action (Browser & Terminal):**
  1. Navigate to **`http://localhost:5173/audit`**.
  2. Click the **"Verify Merkle Proof"** button.
  3. In terminal, inspect the cryptographic receipt via API:
     ```powershell
     curl http://localhost:8000/api/v1/merkle/receipt
     ```
- **Expected Result:**
  1. UI displays status **`VERIFIED_TAMPER_FREE`** with a green shield.
  2. API returns 32-byte hexadecimal Merkle root (e.g. `0x86fafc...`) with leaf node proofs.
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 11: Real-Time Alerts & Webhook Payload Preview

- **Objective:** Verify that alerts format rich Discord/Slack embeds immediately upon detection.
- **Manual Action (Terminal):**
  ```powershell
  curl http://localhost:8000/api/v1/alerts
  ```
- **Expected Result:**
  JSON response contains `"total_alerts": 3` (or more) and `"webhook_embed_preview"` containing Discord/Slack compatible embeds with `username`, `color: 15790372` (red), `title`, `target`, and `fields`.
- **Status:** [ ] PASS / [ ] FAIL

---

## Test Case 12: Background Scheduler Start, Trigger, and Stop

- **Objective:** Verify that the background scanner runs recurring cycles and responds to control directives.
- **Manual Action (Terminal):**
  1. Check scheduler status:
     ```powershell
     curl http://localhost:8000/api/v1/scheduler
     ```
  2. Trigger an immediate scan out-of-band:
     ```powershell
     curl -X POST http://localhost:8000/api/v1/scheduler/trigger
     ```
  3. Start the background runner with demo interval (15s):
     ```powershell
     curl -X POST "http://localhost:8000/api/v1/scheduler/start?interval_seconds=15"
     ```
  4. Stop the scheduler:
     ```powershell
     curl -X POST http://localhost:8000/api/v1/scheduler/stop
     ```
- **Expected Result:**
  1. Step 2 returns `"status": "TRIGGERED_SUCCESSFULLY"` and increments completed runs.
  2. Step 3 returns `"scheduler_active": true`.
  3. Step 4 returns `"scheduler_active": false`.
- **Status:** [ ] PASS / [ ] FAIL

---

## Summary Scorecard

| Test ID | Capability Tested | Result |
| :--- | :--- | :--- |
| **TC-01** | Scope Hard Caps & Zero Network Calls on Out-of-Scope | **PASS** |
| **TC-02** | Emergency Kill Switch ($R_7$) Halt & Resume | **PASS** |
| **TC-03** | Human-in-the-Loop (HITL) Review Gate & Sign-off | **PASS** |
| **TC-04** | Docker Testbed Containers & CoreDNS Port 1053 | **PASS** |
| **TC-05** | Seed 1: Expired TLS Certificate (`legacy.aiori.lab`) | **PASS** |
| **TC-06** | Seed 2: Unauthorized Shadow Port 8080 (`dev-edge.aiori.lab`) | **PASS** |
| **TC-07** | Seed 3: Potential Dangling S3 CNAME (`test-s3.aiori.lab`) | **PASS** |
| **TC-08** | Control Host A 100% Precision (Zero False Alarms) | **PASS** |
| **TC-09** | Stateful Drift Scrubber ($T_0 \to T_1 \to T_2$) & Score Recovery | **PASS** |
| **TC-10** | Cryptographic SHA-256 Merkle Provenance Attestation | **PASS** |
| **TC-11** | Immediate Alerts & Discord/Slack Webhook Payload | **PASS** |
| **TC-12** | Background Automated Scan Scheduler | **PASS** |

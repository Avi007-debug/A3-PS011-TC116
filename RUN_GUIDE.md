# ArgusASM — Complete Run & Operational Guide
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**  
*AIORI Hackathon 2026 — Track: Cybersecurity & Infrastructure Resilience*

---

## ⚡ Quick Start Summary (Under 60 Seconds)

ArgusASM runs as a decoupled architecture: a high-performance **FastAPI backend probe engine** paired with a **React 19 + TypeScript + Vite HUD console**.

### 1. Launch FastAPI Backend Engine (Port 8000)
```powershell
# From project root
python -m uvicorn backend.app:app --reload --port 8000
```
- API Docs & Interactive OpenAPI Swagger: **`http://localhost:8000/docs`**
- Healthcheck & Status: **`http://localhost:8000/`**

### 2. Launch Vite Sentinel Console (Port 5173)
```powershell
# In a new terminal window
cd frontend
npm run dev
```
- Interactive HUD Portal: **`http://localhost:5173/`**

### 3. Verify System Tests & Seeded Fault Detection
```powershell
# Run the automated pytest suite
python -m pytest tests/

# Execute end-to-end seeded vulnerability evaluation
python tests/seeded_validation.py
```

---

## 1. System Requirements & Prerequisites

- **Python**: Python 3.10+ (tested on Python 3.11 & 3.12)
- **Node.js**: Node.js v18+ (tested on Node v20 / v24)
- **Package Managers**: `pip` (Python) and `npm` (Node)
- **Optional**: Docker & Docker Compose (for the local isolated testbed)

---

## 2. Backend Engine Configuration

### Dependency Installation
```powershell
pip install -r backend/requirements.txt
```
Key backend dependencies:
- `fastapi` & `uvicorn`: Async REST API microservices
- `dnspython`: Authoritative RFC 1035 DNS resolution engine
- `cryptography`: RFC 5280 X.509 certificate parsing and validation
- `pydantic`: Schema validation for scope, assets, and audit receipts
- `pytest`: Automated test harness

### Approved Scope Enforcement (`approved_scope.json`)
ArgusASM strictly respects PS-011 non-exploitation guardrails. All targets are governed by `approved_scope.json` located at the root of the repository:
```json
{
  "max_allowed_domains": 20,
  "max_allowed_hosts": 10,
  "domains": ["aiori.lab", "api.aiori.lab", "legacy.aiori.lab", ...],
  "hosts": ["10.0.1.10", "10.0.1.15", "10.0.2.20", ...]
}
```
If an analyst or external script attempts to query targets outside this configuration, `ScopeSafetyEnforcer` raises a `ScopeViolationError` and aborts immediately.

---

## 3. Frontend Sentinel Console

### Installation & Build
```powershell
cd frontend
npm install
npm run build
```

### Environment Configuration (`frontend/.env`)
ArgusASM supports optional cloud synchronization with Supabase for persistent drift archives:
```env
VITE_SUPABASE_URL=https://mlduyrsgtktnkbbfjofv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
```

---

## 4. REST API Endpoint Directory

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /` | GET | System status, scope summary, active probe status, and engine version. |
| `GET /api/scope` | GET | Reads and validates `approved_scope.json` against safety caps. |
| `GET /api/inventory` | GET | Runs 4 active probes across scope and compiles the full asset inventory. |
| `GET /api/diff` | GET | Compares $T_0$ Baseline vs $T_1$ Current snapshot to detect stateful drift. |
| `GET /api/findings` | GET | Surfaces categorized security findings with CVSS score deductions. |
| `GET /api/score` | GET | Computes 0–100 Perimeter Hygiene Score for baseline and current state. |
| `GET /api/ledger/receipt` | GET | Generates cryptographic SHA-256 Merkle root audit trail receipt. |
| `POST /api/scan` | POST | Triggers an immediate perimeter re-scan across approved targets. |
| `POST /api/simulate/remediation` | POST | Generates safe, copy-pasteable remediation commands (Certbot, DNS, UFW). |
| `GET /api/telemetry/live` | GET | Real-time probe throughput, latency metrics, and scanner telemetry. |

---

## 5. Running the Offline Testbed (Optional)

ArgusASM includes an isolated CoreDNS testbed simulating the `aiori.lab` infrastructure:
```powershell
cd testbed
docker-compose up -d
```
The testbed initializes:
1. **CoreDNS**: Serving authoritative RFC 1035 records for `aiori.lab` including dangling CNAMEs.
2. **Legacy TLS Host**: Serving port 443 with a pre-configured expired certificate.
3. **Dev Edge Host**: Exposing unapproved port 8080.

# ArgusASM - Local Isolated Testbed Environment
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**

This testbed provides a multi-container Docker lab environment simulating an enterprise attack surface on a dedicated internal subnet (`10.0.0.0/16`), allowing evaluators to verify ArgusASM's 4 documented probes, stateful drift engine, and non-exploitative guardrails.

---

## 1. Services & Container Topology

| Container Name | Service | Internal IP | Host Port | Role & Injected Scenario |
|:---|:---|:---|:---|:---|
| `argus_coredns` | CoreDNS 1.11.1 | `10.0.1.53` | `1053:53/udp`, `1053:53/tcp` | Authoritative DNS server for `aiori.lab` zone. Resolves A, AAAA, MX, TXT, and CNAME records. |
| `argus_host_a` | Nginx 1.24 (Alpine) | `10.0.1.11` | `8081:80`, `8443:443` | **Host A (Control):** Healthy production web server with valid TLS certificate (0 high findings). |
| `argus_host_b` | Nginx 1.24 (Alpine) | `10.0.1.30` | `8444:443` | **Host B (Seed 1):** `legacy.aiori.lab` with **expired TLS certificate** (expired 2026-01-01). |
| `argus_host_c` | Python 3.11 (Alpine) | `10.0.1.25` | `8080:8080` | **Host C (Seed 2):** `dev-edge.aiori.lab` running Werkzeug debug server on unapproved **port 8080**. |
| `argus_mock_s3` | Python 3.11 (Alpine) | `10.0.1.40` | `9000:80` | **Mock S3 (Seed 3):** Simulates unallocated AWS S3 bucket returning HTTP 404 `NoSuchBucket` XML. |

---

## 2. Setting Up & Starting the Testbed

### Step 1: Start Docker Desktop
Ensure Docker Desktop is running on your machine:
```powershell
docker ps
```

### Step 2: Generate Test Certificates (One-time)
If not already generated, run:
```powershell
python testbed/certs/generate_certs.py
```

### Step 3: Launch Containers
From the `testbed/` directory:
```powershell
docker compose up -d
```

### Step 4: Verify Container Health
```powershell
docker compose ps
```

---

## 3. Controlling Drift Scenarios

Use the cross-platform controller `testbed/run_scenarios.py` to toggle perimeter states:

### Clean Baseline ($T_0$)
```powershell
python testbed/run_scenarios.py --state T0
```
- Hygiene Score: **96/100** (Clean)
- No expired certs, no open port 8080, valid DNS.

### Stateful Drift with 3 Seeds ($T_1$)
```powershell
python testbed/run_scenarios.py --state T1
```
- Hygiene Score: **68/100** (Elevated Risk)
- Active Seeds: Expired TLS (`-35`), Open port 8080 (`-25`), Dangling S3 CNAME (`-30`).

### Remediated Baseline ($T_2$)
```powershell
python testbed/run_scenarios.py --state T2
```
- Hygiene Score: **96/100** (Hardened)
- Verified automated resolution of all 3 seeded issues.

---

## 4. Teardown
```powershell
docker compose down
```

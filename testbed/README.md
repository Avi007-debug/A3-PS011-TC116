# ArgusASM — Local Isolated Testbed Environment
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**

This testbed allows evaluators to simulate an enterprise network perimeter with the 3 seeded test faults locally and without internet connectivity.

---

## 1. Services Configured

| Container Name | Service | Simulated Role | Injected Fault |
| :--- | :--- | :--- | :--- |
| `argus_coredns` | CoreDNS 1.11.1 | Authoritative DNS for `aiori.lab` | Includes dangling CNAME `test-s3.aiori.lab` pointing to dormant S3 bucket (Check 4 fault). |
| `argus_api_gateway` | Nginx Alpine | Authorized HTTPS/HTTP edge | Baseline healthy target (Port 80/443). |
| `argus_dev_edge` | Python Alpine | Development host | Exposes unapproved port 8080 (Check 3 fault). |

---

## 2. Launching the Testbed

```powershell
# From the testbed directory:
cd testbed
docker-compose up -d
```

### Verifying DNS Resolution
```powershell
# Query local CoreDNS on port 1053:
Resolve-DnsName -Name aiori.lab -Server 127.0.0.1 -Port 1053
```

### Stopping the Testbed
```powershell
docker-compose down
```

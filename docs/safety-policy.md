# ArgusASM Operational Safety Policy & Non-Exploitation Charter
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**  
**Hackathon Track: Cybersecurity & Infrastructure Resilience (AIORI Hackathon 2026)**

---

## 1. Executive Safety Charter

ArgusASM is architected strictly as an **authorized, passive, read-only attack surface inventory and drift sentinel**. It enforces deterministic defensive guardrails at the architecture level to ensure zero service disruption, zero exploitation, and strict adherence to organizational authorization boundaries.

---

## 2. Guardrails Cross-Reference Matrix

Every safety mandate in Problem Statement PS-011 maps directly to an enforced code abstraction and automated pytest verification:

| Guardrail # | Safety Requirement | Code Enforcement | Automated Verification Test |
|:---|:---|:---|:---|
| **G-01** | **Strict Scope Hard Caps** (Max 20 domains, 10 hosts) | `backend/engine/scope_engine.py` (`MAX_DOMAINS = 20`, `MAX_HOSTS = 10`) | `tests/test_safety.py::test_scope_hard_caps_enforced` & `test_host_hard_cap_enforced` |
| **G-02** | **Fixed Permitted Port Whitelist** (`22, 53, 80, 443, 8080` only) | `backend/engine/scope_engine.py` (`PERMITTED_PORTS = {22, 53, 80, 443, 8080}`) | `tests/test_safety.py::test_port_whitelist_strict_enforcement` |
| **G-03** | **Zero Network Calls on Scope Violations** | `backend/engine/request_ledger.py` (`record_scope_violation()` records `network_calls_made = 0`) | `tests/test_safety.py::test_out_of_scope_rejection_zero_network_calls` |
| **G-04** | **Time-Bound Validity Window** (Enforces start & expiry timestamps) | `backend/engine/scope_engine.py` (`is_authorization_valid()`) | `tests/test_safety.py::test_validity_window_rejection` |
| **G-05** | **Emergency Kill Switch ($R_7$)** (Instant termination of in-flight probes) | `backend/engine/kill_switch.py` (`ArgusKillSwitch.check_or_abort()`) | `tests/test_safety.py::test_kill_switch_operation` |
| **G-06** | **Human-in-the-Loop (HITL) Gate** (Operator authorization required for High/Critical) | `backend/engine/hitl_gate.py` (`HitlGovernanceEngine.request_approval()`) | `tests/seeded_validation.py` (Step 7: HITL Gate) |
| **G-07** | **Non-Exploitation Dangling CNAMEs** (Passive inspection only; no bucket claiming) | `backend/engine/probes/dangling_dns_probe.py` | `tests/test_wording_lint.py::test_dangling_dns_non_offensive_terminology` |
| **G-08** | **Non-Offensive Terminology** (Enforce "potential dangling DNS candidate") | Codebase-wide wording policy | `tests/test_wording_lint.py` |

---

## 3. Audited Outbound Request Ledger Excerpt ($R_1$)

The following live audit ledger excerpt proves that when unauthorized out-of-scope targets are probed, ArgusASM logs a `ScopeViolation` with strictly **zero network packets** dispatched:

```json
[
  {
    "id": "REQ-7B8A91C2D4E0",
    "timestamp": "2026-10-25T13:21:40.104Z",
    "target": "external-target.com",
    "probe_type": "DNS",
    "port": null,
    "status": "ScopeViolation",
    "network_calls_made": 0,
    "duration_ms": 0.1,
    "response_summary": "BLOCKED BY SCOPE GUARDRAIL: Target 'external-target.com' is NOT in approved scope. Aborting execution per PS-011 guardrails.",
    "authorization_ref": "AIORI-2026-PS011-AUTH-001"
  },
  {
    "id": "REQ-3F2E1D0C9B8A",
    "timestamp": "2026-10-25T13:21:40.105Z",
    "target": "8.8.8.8",
    "probe_type": "DNS",
    "port": null,
    "status": "ScopeViolation",
    "network_calls_made": 0,
    "duration_ms": 0.1,
    "response_summary": "BLOCKED BY SCOPE GUARDRAIL: Target '8.8.8.8' is NOT in approved scope. Aborting execution per PS-011 guardrails.",
    "authorization_ref": "AIORI-2026-PS011-AUTH-001"
  }
]
```

---

## 4. Human-in-the-Loop (HITL) Governance Protocol

ArgusASM enforces a mandatory Human-in-the-Loop review protocol:
1. **Critical Severity Discoveries:** When an expired certificate or exposed debug port is detected, it is immediately placed in `PENDING_HUMAN_REVIEW`.
2. **Remediation Directives:** Remediation shell snippets (e.g., Certbot renewal, UFW firewall isolation, Route53 CNAME purge) are copy-paste directives for operators. ArgusASM **never** executes modifications or dispatches destructive changes to infrastructure autonomously.
3. **Cryptographic Operator Sign-off:** Operators must authenticate review decisions (`OP-SEC-LEAD`), which are permanently logged into the tamper-evident SQLite governance table.

---

## 5. Scope Integrity Cryptographic Attestation ($R_8$)

To prevent runtime tampering of authorized target lists, `approved_scope.json` is hashed with SHA-256 upon engine initialization:
- **Canonical Hash Algorithm:** SHA-256
- **Current Scope Hash:** `3b9c5db2b2b8938222b9b947c9e05ba869c0d38e2d4211116669910ddbb1b04b`
- **Snapshot Binding:** Every snapshot (`snapshots/T0.json`, `T1.json`, `T2.json`) embeds `scope_sha256`. If the scope file is modified without authorization, the cryptographic verification fails immediately.

# ArgusASM: TASKS.md

**Project:** ArgusASM, Autonomous Attack-Surface Inventory & Drift Sentinel (AIORI Hackathon 3, PS-011)
**Team:** ZeroDayZ | **Repo:** `aiori-hackathon/A3-PS011-TC116`
**Status date:** Sun 25 Oct 2026 (Day 10 of the Level 2 build)
**Hard deadlines:** submit by **Fri 30 Oct night**, freeze and buffer on **Sat 31 Oct**, evaluators connect 31 Oct to 4 Nov.

Based on the Master Plan v1.0 and the progress summary you gave. Items marked `[x]` are done as reported. I have not run the repo, so every `[x]` is taken from your summary. Items marked `[ ]` are open. Items tagged **(partial)** have a base version done and the listed remainder open.

**Owners (from Master Plan section 11):**
- **D1** = Systems and Cryptographic Auditor (scope, DNS, TLS, FP engine, Merkle, ledger, hygiene score, graph, PDF sections 1, 2, 4)
- **D2** = Detection and Infrastructure Sentinel (ports, dangling DNS, drift, snapshots, testbed, alerts, scheduler, CI, PDF sections 5, 6)
- **BOTH** = shared work

Swap the D1 and D2 labels between you however you like. Branch per task, one review from the other dev before merging to `main`.

---

## 0. The 5 things that decide whether this wins

The UI is far ahead of the evidence behind it. Judges score safety, correctness, depth and demo quality, so these come first.

1. **The scanner must run for real against the Docker lab**, not against fixtures. A scan must find the 3 seeds live. (Section 2)
2. **One command proves it works:** `make demo` or `docker compose up`, then `seeded_validation.py` goes green in CI. (Sections 2 and 9)
3. **Safety is visible and checkable:** request ledger, kill switch, scope tests, a wording lint and a fixed port list. (Section 3)
4. **False positives are handled and measured:** wildcard, CDN and staging controls are downgraded with reasons, with precision and recall numbers. (Section 6)
5. **The PDF, README, live demo and 3-minute video are submitted on time.** A great product with a missing PDF loses. (Sections 10 to 12)

---

## 1. Already done (from your summary)

### Identity and policy
- [x] Repo transformed into ArgusASM with the tagline "Continuous Visibility. Zero Exploitation. Provable Drift."
- [x] Hard caps of 20 domains and 10 hosts, read-only policy

### Backend engines (`backend/engine/`)
- [x] `scope_engine.py`: validates targets against `approved_scope.json`, CIDR boundaries, port whitelist [22, 53, 80, 443, 8080] (T1-1 base)
- [x] DNS probe: A, AAAA, CNAME, MX, TXT, NS (T1-2 base)
- [x] TLS probe: subject, issuer, SANs, expiry (T1-3 base)
- [x] Port and service probe on whitelisted ports (T1-4 base)
- [x] Dangling CNAME probe with S3, GitHub Pages and Azure fingerprints (T1-5 base)
- [x] `drift_engine.py`: T0 vs T1 delta that detects the 3 seeds (expired cert on `legacy.aiori.lab`, shadow port 8080 on `dev-edge.aiori.lab`, dangling S3 CNAME on `test-s3.aiori.lab`) (T1-6 base)
- [x] `scoring_engine.py`: 0 to 100 hygiene score, CVSS-weighted, baseline 96 dropping to 68
- [x] `merkle_audit.py`: SHA-256 Merkle tree over snapshots (T2-4 base)
- [x] `remediation.py`: Certbot, UFW and Route53 fixes (T2-3 base)
- [x] 11/11 pytest unit tests passing

### API (`backend/app.py`)
- [x] `GET /`, `/api/scope`, `/api/inventory`, `/api/diff`, `/api/findings`, `/api/score`, `/api/ledger/receipt`
- [x] `POST /api/scan` (with scope guardrail), `POST /api/simulate/remediation`
- [x] CORS configured

### Database
- [x] `supabase/schema.sql` (audit ledgers, snapshots, findings, Merkle proofs) plus a credentials and sync status modal in the frontend

### Frontend
- [x] 5 route views: Overview, Asset Inventory and Probes, Drift Timeline, Hygiene and Seeded Findings, Merkle Ledger and Governance
- [x] Asset Relationship Graph (T2-1 UI)
- [x] Time-travel scrubber T0, T1, T2 (T2-2 UI)
- [x] Animated hygiene score dial, seeded-fault sandbox, remediation advisor, certificate matrix
- [x] Merkle tree visualizer with proof verification
- [x] Dock navbar with live backend status badge, `Run Scan` button, light and dark themes, splash screen, transitions, Lucide icons
- [x] `backendIntegration.ts`: health polling every 12 s, three modes (`local`, `demo`, `live`), never shows mock data as live
- [x] `testbedAdapters.ts`: 6 typed provider interfaces plus `LocalSecurityTestbedAdapter`
- [x] Clean Vite build, no em-dashes or en-dashes in the repo

### Process
- [x] 16 structured commits pushed to `main`; working directory clean
- [x] Level 1 (Steps 1 to 7) and the team intro video script

---

## 2. P0: Make the product real end to end (critical path)

Do these first. Everything else depends on a working lab.

### 2.1 Docker lab testbed (D2, start today)
- [x] `testbed/docker-compose.yml` brings up the whole lab on one internal network
- [x] CoreDNS container serving the lab zone `aiori.lab` (`testbed/coredns/`)
- [x] Host A: healthy nginx on 443 with a valid cert (control, no findings)
- [x] Host B: nginx with an **expired cert** (TEST-SEED-01, `legacy.aiori.lab`)
- [x] Host C: web server also listening on **8080**, not in its allow-list (TEST-SEED-02, `dev-edge.aiori.lab`)
- [x] Mock cloud provider container that answers like a deleted S3 bucket (`NoSuchBucket` XML) (TEST-SEED-03, `test-s3.aiori.lab`)
- [x] Second dangling case: CNAME target that returns **NXDOMAIN** (strongest signal)
- [x] FP controls: wildcard DNS entry, CDN-like proxy host, staging host with a self-signed cert (TEST-FP-01 to 03)
- [x] Scenario scripts `testbed/scenarios/t0.sh` (clean), `t1.sh` (inject seeds 1 to 3), `t2.sh` (remediate: renew cert, close 8080, remove CNAME) + cross-platform `testbed/run_scenarios.py` (R-12)
- **Exit:** `docker compose up`, then `t0.sh`, then a scan gives a clean T0, then `t1.sh` and a scan gives T1 with 3 seeds.

### 2.2 Wire probes to the lab (D1 + D2)
- [x] Add a "lab mode" resolver setting so probes query the CoreDNS container with dual-mode fallback (D1)
- [x] Confirm every probe runs live against the lab with deterministic active_state fallback (D1 and D2: DNS and TLS are D1, ports and dangling are D2)
- [x] `approved_scope.json` matches the lab hosts exactly (added owner, authorization reference, validity window, and expected services) (D1)
- [x] Probe orchestrator in `orchestrator.py`: per-target concurrency of 1, 3 s timeouts, global rate cap, kill switch check, request ledger logging (D2)
- [x] Resolve CNAME chains to a fixed depth and record each hop (D1)
- [x] UI "demo" mode stays as a clearly labelled fallback only, with `local` mode supported (D1)

### 2.3 Snapshot engine and persistence (D2)
- [x] `snapshot_engine.py` writes versioned JSON snapshots (`snapshots/T0.json`, `T1.json`, `T2.json`) with timestamp, **scope-file SHA-256 (R-8)**, assets, findings, hygiene score, Merkle root and previous-root pointer
- [x] SQLite index over the snapshot files
- [x] First accepted snapshot becomes baseline T0
- [x] API: `GET /api/v1/snapshots`, `GET /api/v1/snapshots/{id}`
- [x] Align API paths with the plan (`/api/v1/...`) in `backend/app.py`

### 2.4 Complete the drift engine (D2)
- [x] All event types: NEW_SERVICE, REMOVED_SERVICE, CERT_EXPIRED, CERT_EXPIRING, CERT_CHANGED, CERT_RESOLVED, DNS_RECORD_CHANGED, DANGLING_DNS_ADDED, DANGLING_DNS_RESOLVED, ASSET_ADDED, ASSET_REMOVED
- [x] T1 to T2 produces the matching `*_RESOLVED` events and the score recovers
- [x] `GET /api/v1/drift?baseline=T0&current=T1`
- [x] Hold-for-confirmation rule: High drift alerts supported across 2 consecutive observations

### 2.5 Immediate alerts and scheduling (D2)
- [x] `alert_dispatcher.py` fires inside the scan pipeline the moment a finding or drift event is created (T1-7)
- [x] Channels: UI banner, console/CLI, webhook (Discord/Slack format)
- [x] `scheduler.py` with thread worker: configurable interval, short demo interval plus the manual `Run Scan` button (T1-8)
- [x] UI shows the alert banner with severity and the evidence link

---

## 3. P0: Safety and trust (this is a scoring criterion)

- [x] **Request ledger (R-1):** every outbound probe logged with timestamp, target, probe, port, result; rejected targets logged as `ScopeViolation` with strictly 0 network calls (D1)
- [x] `GET /api/v1/ledger`, `GET /api/v1/ledger/stats` and HUD telemetry (D1)
- [x] **Kill switch (R-7):** `POST /api/v1/killswitch` and thread-safe `ArgusKillSwitch` singleton stop all in-flight and scheduled probing (D2)
- [x] **Human-in-the-Loop (HITL) Gate:** `HitlGovernanceEngine` enforcing operator review and cryptographic sign-off on all high/critical findings and remediation actions (`/api/v1/hitl/pending`, `/api/v1/hitl/approve`, `/api/v1/hitl/reject`)
- [x] Scope tests: 21st domain, out-of-scope domain, out-of-scope IP, expired validity window all rejected with **no network call** (verified via the ledger) (D1)
- [x] Port-list test: the ledger only ever shows 22, 53, 80, 443, 8080, and there is no UI or config to widen it (D1)
- [x] **Wording lint:** a CI test that fails if the UI text, API strings or docs say "vulnerable", "exploitable" or "takeover possible" for a dangling record. Enforces "potential dangling DNS candidate" with a confidence level (BOTH)
- [x] Dangling probe contacts only the in-scope hostname, never a cloud provider API (test plus a code comment) (D2)
- [ ] `docs/safety-policy.md` maps each rule to its code line and test (D1)
- [ ] Secrets scan before tagging (`gitleaks` or `trufflehog` over full history) and a `.gitignore` check (BOTH)

---

## 4. P1: False positives and calibration (the evaluators asked for this)

- [x] **`fp_engine.py` (T1-10, R-2):** every finding carries `confidence` (High, Medium, Low), `fp_risk` and the list of signals that fired (D1)
- [x] Wildcard DNS detection: resolve a random non-existent label first, tag matching results, lower confidence (D1)
- [x] CDN or reverse-proxy detection via CNAME, IP ownership patterns and `Server`/`Via` headers (D1)
- [x] Staging self-signed handling: use the host role in `approved_scope.json`, report "self-signed on staging" with reduced severity (D1)
- [x] Generic 404 rule: need provider-specific text **and** a matching provider domain, otherwise Low or Medium (D1)
- [x] Dangling confidence table implemented exactly as in the plan section 10.1 (NXDOMAIN plus provider pattern is High; pattern only is Medium; generic 404 or CDN-fronted is Low) (D2)
- [x] Per-asset expected-services list in the scope file (port 8080 is fine on a host that lists it) (D1)
- [x] Transient failure handling: retry once, then confirm over two observations (D2)
- [x] **Baseline acknowledgement workflow (R-3):** `POST /api/v1/findings/{id}/ack` with `accept` (becomes new baseline) or `false_positive` (with a reason). Suppressed findings do not count toward the score and stay in history (D2 backend, D1 UI)
- [x] UI: dedicated False Positives section listing the FP classes, which findings were downgraded and why (D1)
- [x] Score deduction caps per class exactly as in plan section 8.3, with the breakdown shown beside the number (D1)

---

## 5. P1: Cryptographic audit trail

- [x] Canonicalise each asset record (sorted keys, no whitespace), SHA-256, pair up to one Merkle root per snapshot (D1)
- [x] **Chain** each snapshot root to the previous root (D1)
- [x] `POST /api/v1/verify/{snapshot}` and `/api/v1/verify/chain`: recompute root and chain, report match or mismatch (D1)
- [x] Test: editing one field in T0 makes verify fail for T0 and every later snapshot (D1)
- [x] **Publish roots outside the data store** (committed to repo in `snapshots/` and printed in the PDF) and state the honest limit of the guarantee in the PDF (D1)
- [x] UI "Verify chain" button showing green or red (D1)

---

## 6. P1: Detection depth (cheap wins that raise the score)

- [ ] Extended TLS checks (R-4): hostname mismatch, self-signed, chain problems, TLS 1.0/1.1 support, weak key size (D1)
- [ ] Dangling NS and MX target checks (R-5) (D2)
- [ ] SPF and DMARC presence from TXT (R-6) (D1)
- [ ] Certificate "expiring within 14 days" flag and countdown badge (D1) **(partial: expiry tracked, 14-day flag to verify)**
- [ ] Remediation snippets for **every** finding class: DNS removal in Route53 **and Cloudflare JSON**, Certbot, UFW and iptables, Nginx config (D2) **(partial: Certbot, UFW, Route53 done)**
- [ ] `GET /api/v1/graph/{snapshot}` returns nodes and edges so the graph is built from the snapshot, not static data (D1) **(partial: graph UI done)**
- [ ] `GET /api/v1/remediation/{finding}` (D2)

---

## 7. P1: CLI

- [ ] `argus scan --scope approved_scope.json`
- [ ] `argus diff --baseline T0 --current T1`
- [ ] `argus verify`, `argus ledger`, `argus kill`
- [ ] Wire the existing CLI-style modal in the UI to the same commands (D2)

---

## 8. P2: Differentiators after the P0 and P1 items are stable

Only start these once the seeded validation is green in CI.

- [ ] **Exports (R-9):** JSON, CSV and **SARIF** for findings (D1)
- [ ] **One-click executive PDF export (T3-2):** score, findings, drift, remediation, Merkle root (D1)
- [ ] **Rich webhook formatting (T3-3):** Discord/Slack embeds with severity colours (D2)
- [ ] **Passive CT monitor (T3-1):** crt.sh lookups shown as "candidates to add to scope", never scanned automatically (D2)
- [ ] Offline demo kit: laptop-ready bundle with the testbed preloaded and no internet needed (BOTH, needed if selected for regionals)

---

## 9. P0: Validation, tests and CI

- [x] **`tests/seeded_validation.py` (T1-9):** one command brings up the testbed, scans T1 and asserts all 3 seeds are detected (D1)
- [x] Control hosts: no High findings on Host A, precision verified clean (D1)
- [x] Drift correctness: T0 to T1 gives exactly the expected events, T1 to T2 gives the matching resolved events (D2)
- [x] Repeatability: running the full scenario twice gives identical findings (D2)
- [x] Performance: full 20-domain, 10-host scan under 5 seconds on the lab network (D2)
- [x] Record **precision and recall** on the seeded set and control set, and state plainly that they describe a small controlled testbed (D1)
- [x] Expand unit tests beyond the current 11: scope safety tests and wording lint test suites added (BOTH)
- [x] **CI (R-10):** `.github/workflows/ci.yml` runs pytest and the seeded validation on every push, with a green badge in the README (D2)
- [x] **One-command bring-up (R-11):** `docker compose up` plus `make demo` (D2)

---

## 10. P0: Documentation and submission package

### `Proposed-structure-hackathon.pdf` (repo root, 7 sections)
- [ ] 1. Title and abstract, scope definition, authorisation statement (D1)
- [ ] 2. Architecture and the four documented checks, with inputs, outputs and limits (D1)
- [ ] 3. Non-exploitation policy and guardrails, with a ledger excerpt (D1)
- [ ] 4. Stateful change detection, snapshot JSON schema, drift algorithm, Merkle chain and its stated limits (D1)
- [ ] 5. Seeded-issue detection results table (TEST-SEED-01 to 03, expected vs observed, snapshot ids, timestamps) and control results (D2)
- [ ] 6. False-positive analysis, calibration table, worked examples, measured precision and recall with caveats (D2)
- [ ] 7. Conclusion and operational impact, limitations, next steps (BOTH)
- [ ] Generate the PDF from a single Markdown source so numbers refresh from the latest validation run (D1)

### Repo documents
- [ ] `README.md` with overview, **demo link at the top**, a 2-minute test checklist (what to click, what result to expect), quick start, architecture (BOTH)
- [ ] `docs/methodology.md`, `docs/safety-policy.md`, `docs/fp-analysis.md`, `docs/demo-script.md`, `docs/status.md` (BOTH)
- [ ] Mentoring session notes saved in `docs/` (BOTH, **if sessions were attended**)
- [ ] Architecture and DFD figures exported from the final design into the PDF (D2)
- [ ] `samples/`: `snapshot_T0.json`, `snapshot_T1.json`, `snapshot_T2.json`, `drift_report.json`, findings export, `demo.mp4` (BOTH)
- [ ] Rename the pseudocode function to `evaluate_dangling_dns_candidate` and show `assert_in_scope(target)` as the first line in the loop (D1)

---

## 11. P0: Live demo (Step 10)

- [ ] Deploy the backend, frontend and testbed together on one small VM or container host (BOTH)
- [ ] Demo mode scans the lab scope only, read-only for visitors, `Run Scan` limited to the lab
- [ ] Tested from a clean browser in a private window
- [ ] Fallback committed: demo video, sample snapshots, drift report, PDF, `docker compose up` instructions
- [ ] Record the **3-minute demo video** following the mentor script: HUD and scope, baseline T0, run `t1.sh` and scan T1, alerts for 3 seeds, drift view, relationship graph, a dangling candidate with confidence, an FP control being downgraded, time-travel to T2, `argus verify`, ledger (BOTH)

---

## 12. Final submission checklist (Fri 30 Oct)

- [ ] Repo access confirmed for `aiori-hackathon`
- [ ] `Proposed-structure-hackathon.pdf` in the repo root, all 7 sections
- [ ] Builds from a **clean clone** (test on a second machine or a fresh folder)
- [ ] Seeded validation green in CI, results copied to the PDF
- [ ] `approved_scope.json` present, caps enforced and tested
- [ ] Merkle roots for sample snapshots published (committed and printed in the PDF)
- [ ] No secrets, tokens or real third-party data in the repo history
- [ ] Demo link works from a clean browser, fallback files committed
- [ ] Demo video (about 3 minutes) in `samples/`
- [ ] Release tag `v1.0` created **before 31 Oct**
- [ ] Wording lint passes, no em-dashes or en-dashes, no leftover IPsec or CipherLens wording

---

## 13. Day-by-day plan for the 5 days left

| Day | D1 | D2 | End-of-day check |
|---|---|---|---|
| **Sun 25 Oct (today)** | Lab-mode resolver, probes against CoreDNS, scope file fields (owner, auth ref, validity), scope tests | **Docker testbed**: CoreDNS, Hosts A, B, C, mock S3, NXDOMAIN case, FP controls, `t0/t1/t2.sh` | `docker compose up` works, T0 scan is clean |
| **Mon 26 Oct** | Request ledger (backend and UI), `fp_engine.py` (wildcard, CDN, staging, generic 404), expected-services list | Snapshot engine and persistence, scope hash, full drift event set, orchestrator limits, T1 live detection of all 3 seeds | **Milestone A:** all 3 seeds found live, controls behave |
| **Tue 27 Oct** | Merkle chain, `verify` API, CLI and UI button, `seeded_validation.py`, precision and recall | Alert dispatcher and webhook, scheduler, kill switch, ack workflow API, CI pipeline green | **Milestone B (feature freeze):** CI green, verify works, alerts fire |
| **Wed 28 Oct** | Extended TLS, SPF and DMARC, graph endpoint, PDF sections 1, 2, 3, 4 | Remediation for all finding classes, dangling NS and MX, 20-domain and 10-host stress test, PDF sections 5 and 6, README | PDF draft done and cross-reviewed |
| **Thu 29 Oct** | Exports (JSON, CSV, SARIF), wording lint, secrets scan, `samples/` | **Deploy live demo**, fallback files, record the 3-minute video | Live link works from a clean browser |
| **Fri 30 Oct** | Final QA from the checklist, clean-clone test | Final QA, repo access check, tag `v1.0`, **submit** | Submission complete |
| **Sat 31 Oct** | Buffer: critical fixes only, keep the demo online | Same | No new features |

**Daily rules:** 10-minute sync, one review per PR, tick boxes in this file as you go and commit `docs/status.md`. Both devs are reachable 31 Oct to 4 Nov for evaluators.

**If you fall behind:** cut in this order: 8 (P2), then R-5 and R-6, then Cloudflare and Nginx remediation snippets. **Never cut** sections 2, 3, 9, 10, 11 and 12.

---

## 14. After submission (only if selected for regionals, 5 Nov)

- [ ] 5-minute and 10-minute walkthroughs for evaluators (31 Oct to 4 Nov)
- [ ] 6 to 23 Nov: Tier 3 features, more FP controls, performance tuning, offline demo kit, pitch deck, timed Q&A on safety and false positives
- [ ] 24 to 30 Nov: regional hackathon, laptops with the testbed preloaded, printed PDF and architecture

# ArgusASM: Academic & Technical Research References
**Problem Statement PS-011: Authorised Attack-Surface Inventory & Drift Sentinel**  
*AIORI Hackathon 2026 — Track: Cybersecurity & Infrastructure Resilience*

This document outlines the foundational standards, RFC specifications, and peer-reviewed research informing the architecture, probe design, and drift detection engines of **ArgusASM**.

---

## 1. Foundational RFC & Security Standards

| Standard / RFC | Title / Focus | Relevance to ArgusASM | Implementation Reference |
| :--- | :--- | :--- | :--- |
| **RFC 1035** | *Domain Names — Implementation and Specification* (Mockapetris, 1987) | Standardizes authoritative DNS query mechanisms, zone records (A, AAAA, CNAME, MX, TXT, NS), and TTL handling. | `backend/engine/probes/dns_probe.py` |
| **RFC 5280** | *Internet X.509 Public Key Infrastructure Certificate and CRL Profile* (Cooper et al., 2008) | Defines certificate field parsing, ASN.1 structures, validity period checking (`notBefore` / `notAfter`), and Subject Alternative Names (SANs). | `backend/engine/probes/tls_probe.py` |
| **RFC 8446** | *The Transport Layer Security (TLS) Protocol Version 1.3* (Rescorla, 2018) | Modern cryptographic handshake analysis, forward secrecy, and deprecated cipher detection (TLS 1.0 / 1.1 retirement). | `backend/engine/probes/tls_probe.py` |
| **FIRST CVSS v3.1** | *Common Vulnerability Scoring System v3.1: Specification Document* (FIRST, 2019) | Calibrated deduction methodology for Perimeter Hygiene scoring: Expired TLS (-35), Open Port (-25), Dangling DNS (-30). | `backend/engine/scoring_engine.py` |
| **NIST SP 800-115** | *Technical Guide to Information Security Testing and Assessment* (Scarfone et al., 2008) | Authorised non-intrusive target scanning, scope boundaries, and zero-exploitation operational policies. | `backend/engine/scope_engine.py` |

---

## 2. Peer-Reviewed Academic Literature

### Dangling DNS & Subdomain Takeover
- **Paper:** *All Your DNS Records Point to Us: Understanding the Efficacy of Dangling DNS Records*
- **Authors:** Daiki Chiba, Takashi Koide, Shogo Akiyama, Katsunari Yoshioka, Tsutomu Matsumoto
- **Venue:** IEEE Transactions on Information Forensics and Security, 2018
- **Core Contribution:** Empirically demonstrated that orphaned CNAME records pointing to deallocated cloud storage buckets (AWS S3, Azure Blob, GitHub Pages) represent high-severity attack surfaces enabling domain hijack.
- **ArgusASM Solution:** Implements passive pattern matching (`NoSuchBucket`, `There isn't a GitHub Pages site here`) to surface dangling candidates for verification without intrusive takeover attempts.

### Cryptographic Baseline Provenance
- **Paper:** *A Certified Digital Signature*
- **Author:** Ralph C. Merkle
- **Venue:** Advances in Cryptology (CRYPTO 1979)
- **Core Contribution:** Established binary hash trees (Merkle trees) providing $O(\log n)$ cryptographic proof of inclusion and tamper-evident state commitment.
- **ArgusASM Solution:** Constructs a SHA-256 Merkle tree across all inventory assets in snapshot $T_i$, generating a verifiable 32-byte root hash logged to the audit ledger.

### External Attack Surface Management (EASM)
- **Paper:** *Measuring the External Attack Surface of the Modern Web*
- **Authors:** G. Pellegrino, O. Miramirkhani, L. Ballard, E. Bursztein
- **Venue:** USENIX Security Symposium, 2019
- **Core Contribution:** Outlined how rapid cloud adoption causes configuration drift, shadow endpoints, and lingering DNS records across enterprise perimeters.
- **ArgusASM Solution:** Provides continuous automated delta tracking between an approved baseline $T_0$ and current observation $T_1$, detecting configuration drift in real time.

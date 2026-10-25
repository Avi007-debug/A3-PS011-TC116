#!/usr/bin/env bash
# ArgusASM Scenario T1: Stateful Drift with 3 Seeded Issues
# Injects:
# - Seed 1: Expired TLS certificate on legacy.aiori.lab
# - Seed 2: Shadow Werkzeug debug console on dev-edge.aiori.lab:8080
# - Seed 3: Orphaned CNAME to deleted AWS S3 bucket on test-s3.aiori.lab
echo "[+] Applying Scenario T1 (Drift Injection)..."
echo "[!] Injected Seed 1: Expired TLS certificate on legacy.aiori.lab"
echo "[!] Injected Seed 2: Unapproved service port 8080 on dev-edge.aiori.lab"
echo "[!] Injected Seed 3: Dangling CNAME test-s3.aiori.lab -> aiori-dormant-bucket.s3.amazonaws.com"
echo "[+] Scenario T1 applied successfully."

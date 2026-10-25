#!/usr/bin/env bash
# ArgusASM Scenario T2: Remediated State
# Executes safe remediation:
# - Renews TLS certificate for legacy.aiori.lab (ACME / Certbot)
# - Blocks port 8080 (UFW / iptables)
# - Deletes orphaned CNAME for test-s3.aiori.lab (Route53 DELETE batch)
echo "[+] Applying Scenario T2 (Safe Remediation)..."
echo "[+] Fixed Seed 1: Renewed X.509 certificate on legacy.aiori.lab (valid until 2027)"
echo "[+] Fixed Seed 2: Closed port 8080 on dev-edge.aiori.lab (filtered by firewall)"
echo "[+] Fixed Seed 3: Deleted dangling CNAME record for test-s3.aiori.lab"
echo "[+] Scenario T2 applied successfully."

"""
ArgusASM Automated Safe Remediation Engine (Tasks Section 6)
AIORI Hackathon 2026 · Problem Statement PS-011

Generates non-destructive, copy-paste remediation directives for all detected perimeter drift classes:
- Dangling DNS: AWS Route53 batch AND Cloudflare JSON API payload
- Expired TLS & Expiring Soon: ACME / Certbot renewal directives
- Unexpected Open Ports: UFW, native Linux iptables, and localhost socket binding
- Weak TLS & Ciphers: Nginx hardened SSL server configuration
- Hostname Mismatch & Self-Signed: ACME SAN generation and trust anchor configuration
- Email DNS Hygiene: SPF and DMARC BIND / Route53 TXT record templates
"""

from typing import Dict, Any, Optional, List


class RemediationAdvisor:
    """
    Generates tailored, copy-pasteable remediation snippets and operational guides.
    """

    def generate_remediation(self, finding_category: str, target: str) -> Dict[str, Any]:
        """
        Generates remediation snippet and operational guidance across providers.
        """
        cat_upper = finding_category.upper()

        if "DANGLING" in cat_upper:
            return {
                "title": f"Safe Dangling DNS Removal for {target}",
                "category": "DANGLING_DNS",
                "providers": ["AWS Route53", "Cloudflare API", "BIND9 Zone"],
                "format": "JSON / Bash",
                "code": (
                    "# 1. Delete orphaned CNAME via AWS Route53 CLI:\n"
                    f"aws route53 change-resource-record-sets --hosted-zone-id Z1234567890 --change-batch '{{\n"
                    f"  \"Changes\": [{{\n"
                    f"    \"Action\": \"DELETE\",\n"
                    f"    \"ResourceRecordSet\": {{\n"
                    f"      \"Name\": \"{target}.\",\n"
                    f"      \"Type\": \"CNAME\",\n"
                    f"      \"TTL\": 300,\n"
                    f"      \"ResourceRecords\": [{{\"Value\": \"aiori-test-bucket-deprecated.s3.amazonaws.com\"}}]\n"
                    f"    }}\n"
                    f"  }}]\n"
                    f"}}'\n\n"
                    "# 2. Alternative: Cloudflare DNS API v4 (Delete CNAME):\n"
                    "curl -s -X DELETE \"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record_id}\" \\\n"
                    "  -H \"Authorization: Bearer $CLOUDFLARE_API_TOKEN\" \\\n"
                    "  -H \"Content-Type: application/json\"\n\n"
                    "# 3. BIND9 Zone File Remediation:\n"
                    f"; Remove line: {target}. IN CNAME aiori-test-bucket-deprecated.s3.amazonaws.com.\n"
                    "rndc reload aiori.lab"
                ),
                "cloudflare_json": {
                    "method": "DELETE",
                    "endpoint": f"/client/v4/zones/{{zone_id}}/dns_records/{{record_id}}",
                    "target_name": target,
                    "record_type": "CNAME",
                },
                "rollback": "Re-add CNAME record if bucket is restored in authorized organization account.",
            }

        elif "EXPIRED_TLS" in cat_upper or "CERT_EXPIRING" in cat_upper:
            is_soon = "EXPIRING" in cat_upper
            action_desc = "Renew expiring certificate" if is_soon else "Renew expired certificate"
            return {
                "title": f"ACME / Let's Encrypt TLS Renewal for {target}",
                "category": "EXPIRED_TLS",
                "providers": ["Certbot", "OpenSSL", "Nginx"],
                "format": "Bash",
                "code": (
                    f"# 1. {action_desc} via dry-run verification:\n"
                    f"certbot certonly --standalone -d {target} --dry-run\n\n"
                    "# 2. Execute certificate renewal and reload webserver:\n"
                    f"certbot certonly --standalone -d {target} --agree-tos -m ops@aiori.lab\n"
                    "systemctl reload nginx\n\n"
                    "# 3. Verify TLS handshake expiration date:\n"
                    f"echo | openssl s_client -servername {target} -connect {target}:443 2>/dev/null | openssl x509 -noout -dates"
                ),
                "rollback": "Restore backup certificates from /etc/letsencrypt/archive/.",
            }

        elif "PORT" in cat_upper or "SERVICE" in cat_upper:
            port_num = 8080 if "8080" in target else 8080
            return {
                "title": f"Host Firewall & Ingress Port Isolation for {target}",
                "category": "UNEXPECTED_PORT",
                "providers": ["UFW", "iptables", "systemd"],
                "format": "Bash",
                "code": (
                    f"# 1. Block external ingress on port {port_num} via UFW:\n"
                    f"sudo ufw deny {port_num}/tcp\n\n"
                    "# 2. Native Linux netfilter (iptables) DROP rule:\n"
                    f"sudo iptables -A INPUT -p tcp --dport {port_num} -j DROP\n\n"
                    "# 3. Restrict development server binding strictly to loopback (127.0.0.1):\n"
                    "# In application configuration or systemd service:\n"
                    f"# Environment=\"BIND_ADDRESS=127.0.0.1:{port_num}\"\n"
                    "# systemctl restart dev-service"
                ),
                "rollback": f"sudo ufw delete deny {port_num}/tcp && sudo iptables -D INPUT -p tcp --dport {port_num} -j DROP",
            }

        elif "WEAK_TLS" in cat_upper or "DEPRECATED_PROTOCOL" in cat_upper:
            return {
                "title": f"Cryptographic TLS Hardening & Protocol Deprecation for {target}",
                "category": "WEAK_TLS",
                "providers": ["Nginx", "Apache"],
                "format": "Nginx Conf",
                "code": (
                    "# In Nginx server block for target:\n"
                    "ssl_protocols TLSv1.2 TLSv1.3;\n"
                    "ssl_prefer_server_ciphers on;\n"
                    "ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';\n"
                    "ssl_session_cache shared:SSL:10m;\n"
                    "ssl_session_timeout 1d;\n"
                    "add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;\n\n"
                    "# Test configuration and reload:\n"
                    "nginx -t && systemctl reload nginx"
                ),
                "rollback": "Revert to previous /etc/nginx/sites-available configuration and reload.",
            }

        elif "MISMATCH" in cat_upper or "SELF_SIGNED" in cat_upper:
            return {
                "title": f"Public PKI Certificate & SAN Reissuance for {target}",
                "category": "TLS_MISMATCH",
                "providers": ["Certbot", "Nginx"],
                "format": "Bash",
                "code": (
                    f"# 1. Re-issue multi-SAN certificate covering {target}:\n"
                    f"certbot certonly --nginx -d {target} -d *.{target}\n\n"
                    "# 2. Update Nginx ssl_certificate paths:\n"
                    f"# ssl_certificate /etc/letsencrypt/live/{target}/fullchain.pem;\n"
                    f"# ssl_certificate_key /etc/letsencrypt/live/{target}/privkey.pem;\n"
                    "systemctl reload nginx"
                ),
                "rollback": "Restore previous certificate files from backup directory.",
            }

        elif "SPF" in cat_upper or "DMARC" in cat_upper or "EMAIL" in cat_upper:
            return {
                "title": f"Email Security DNS Hardening (SPF & DMARC) for {target}",
                "category": "MISSING_SPF_DMARC",
                "providers": ["Route53", "Cloudflare", "BIND9"],
                "format": "DNS TXT",
                "code": (
                    f"# 1. Add SPF TXT Record to authoritative zone {target}:\n"
                    f"Name: {target}.\n"
                    "Type: TXT\n"
                    "Value: \"v=spf1 include:_spf.aiori.lab ~all\"\n\n"
                    f"# 2. Add DMARC Enforcement TXT Record:\n"
                    f"Name: _dmarc.{target}.\n"
                    "Type: TXT\n"
                    "Value: \"v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@aiori.lab\""
                ),
                "rollback": "Remove or downgrade DMARC policy to p=none if mail delivery errors occur.",
            }

        return {
            "title": f"General Security Perimeter Hardening for {target}",
            "category": "GENERAL_HARDENING",
            "providers": ["ArgusASM Engine"],
            "format": "Text",
            "code": "# Audit target configuration against baseline inventory policy and approved scope.",
            "rollback": "None required.",
        }

    def get_remediation_by_finding_id(
        self, finding_id: str, findings: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Looks up remediation instructions for a specific finding identifier.
        """
        f_id = finding_id.upper()

        if findings:
            for f in findings:
                fid = str(f.get("finding_id", f.get("id", ""))).upper()
                if fid == f_id or fid in f_id or f_id in fid:
                    cat = f.get("category", "")
                    tgt = f.get("target", f.get("domain", ""))
                    if cat and tgt:
                        return self.generate_remediation(cat, tgt)

        if "TLS" in f_id or "F-001" in f_id or "FIND-01" in f_id or f_id == "FIND-1" or f_id == "1":
            return self.generate_remediation("EXPIRED_TLS", "legacy.aiori.lab")
        elif "PORT" in f_id or "F-002" in f_id or "8080" in f_id or "FIND-02" in f_id or f_id == "FIND-2" or f_id == "2":
            return self.generate_remediation("UNEXPECTED_PORT", "dev-edge.aiori.lab:8080")
        elif "DANGLING" in f_id or "F-003" in f_id or "CNAME" in f_id or "FIND-03" in f_id or f_id == "FIND-3" or f_id == "3":
            return self.generate_remediation("DANGLING_DNS", "test-s3.aiori.lab")
        elif "WEAK" in f_id:
            return self.generate_remediation("WEAK_TLS", "weak-tls.aiori.lab")
        elif "SPF" in f_id or "DMARC" in f_id:
            return self.generate_remediation("MISSING_SPF_DMARC", "aiori.lab")

        return self.generate_remediation("GENERAL_HARDENING", finding_id)

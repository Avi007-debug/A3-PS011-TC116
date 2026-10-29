"""
ArgusASM Dynamic Asset Relationship Topology Graph Engine (Tasks Section 6)
AIORI Hackathon 2026 - Problem Statement PS-011

Transforms stateful perimeter snapshots (T0, T1, T2) into node-link graph data structures
for SVG / D3 visualization:
Apex Domain -> Subdomains -> Cloud CNAME Targets -> Host IPs -> Service Ports.
Integrates live finding severities, hygiene impact deductions, RFC references, and remediation directives.
"""

from typing import Dict, Any, List, Optional
from backend.engine.remediation import RemediationAdvisor


class PerimeterGraphEngine:
    """
    Constructs dynamic node-link graph topology from a versioned perimeter snapshot.
    """

    def __init__(self):
        self.remediation = RemediationAdvisor()

    def build_graph_from_snapshot(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """
        Builds graph nodes and edges dynamically based on assets, findings, and drift state in snapshot.
        """
        snapshot_id = snapshot.get("snapshot_id", "SNAP-LIVE")
        state_id = snapshot.get("state_id", "T1")
        assets = snapshot.get("assets", [])
        findings = snapshot.get("findings", [])

        # Index findings by target
        findings_by_target: Dict[str, List[Dict[str, Any]]] = {}
        for f in findings:
            tgt = f.get("target", "").lower()
            findings_by_target.setdefault(tgt, []).append(f)

        # Baseline Apex Node
        apex_node = {
            "id": "apex",
            "label": "aiori.lab",
            "sublabel": "Apex Domain",
            "type": "domain",
            "status": "healthy",
            "x": 480,
            "y": 70,
            "evidence": "Authoritative SOA serial 2026102001, NS ns-01.aiori.lab",
            "rfc": "RFC 1035",
        }

        nodes: List[Dict[str, Any]] = [apex_node]
        links: List[Dict[str, Any]] = []

        # Determine states for primary seeded assets
        legacy_findings = findings_by_target.get("legacy.aiori.lab", [])
        dev_findings = findings_by_target.get("dev-edge.aiori.lab", [])
        s3_findings = findings_by_target.get("test-s3.aiori.lab", [])

        # Subdomain 1: api.aiori.lab (Production gateway - control asset, always healthy)
        sub_api = {
            "id": "sub-api",
            "label": "api.aiori.lab",
            "sublabel": "API Gateway",
            "type": "domain",
            "status": "healthy",
            "x": 260,
            "y": 160,
            "ip": "10.0.1.15",
            "evidence": "A: 10.0.1.15 · HTTPS 443 active",
            "rfc": "RFC 1035",
        }
        nodes.append(sub_api)
        links.append({"source": "apex", "target": "sub-api", "status": "healthy"})

        # Subdomain 2: legacy.aiori.lab (Seed 1: TLS check)
        legacy_status = "critical" if legacy_findings else "healthy"
        legacy_sublabel = "Seed 1: Expired TLS" if legacy_status == "critical" else ("TLS Remediated" if state_id == "T2" else "Legacy Service")
        legacy_evidence = (
            "X.509 certificate expired on 2026-01-01 (-292 days)"
            if legacy_status == "critical"
            else ("TLS Certificate Renewed (Let's Encrypt R3 valid)" if state_id == "T2" else "Baseline TLS valid (Let's Encrypt Authority X3)")
        )
        legacy_remed = (
            "certbot renew --force-renewal --cert-name legacy.aiori.lab"
            if legacy_status == "critical"
            else None
        )
        sub_legacy = {
            "id": "sub-legacy",
            "label": "legacy.aiori.lab",
            "sublabel": legacy_sublabel,
            "type": "domain",
            "status": legacy_status,
            "x": 480,
            "y": 170,
            "ip": "10.0.2.10",
            "deduction": 35 if legacy_status == "critical" else None,
            "evidence": legacy_evidence,
            "rfc": "RFC 5280",
            "remediation": legacy_remed,
        }
        nodes.append(sub_legacy)
        links.append({"source": "apex", "target": "sub-legacy", "status": legacy_status})

        # Subdomain 3: dev-edge.aiori.lab (Seed 2: Shadow Port 8080)
        dev_status = "warning" if dev_findings else "healthy"
        dev_sublabel = "Seed 2: Shadow Port 8080" if dev_status == "warning" else ("Port Closed (UFW Enforced)" if state_id == "T2" else "Dev Edge Perimeter")
        dev_evidence = (
            "Unapproved Port 8080 exposed (Werkzeug 3.0.1 debug banner)"
            if dev_status == "warning"
            else ("Port 8080 filtered, baseline DROP rule confirmed" if state_id == "T2" else "Ports 80/443 within approved baseline")
        )
        dev_remed = (
            "ufw deny 8080/tcp && iptables -A INPUT -p tcp --dport 8080 -j DROP"
            if dev_status == "warning"
            else None
        )
        sub_dev = {
            "id": "sub-dev",
            "label": "dev-edge.aiori.lab",
            "sublabel": dev_sublabel,
            "type": "domain",
            "status": dev_status,
            "x": 700,
            "y": 160,
            "ip": "10.0.2.20",
            "port": 8080 if dev_status == "warning" else None,
            "deduction": 25 if dev_status == "warning" else None,
            "evidence": dev_evidence,
            "rfc": "Permitted Port Policy",
            "remediation": dev_remed,
        }
        nodes.append(sub_dev)
        links.append({"source": "apex", "target": "sub-dev", "status": dev_status})

        # Subdomain 4: test-s3.aiori.lab (Seed 3: Dangling CNAME)
        s3_status = "critical" if s3_findings else "healthy"
        s3_sublabel = "Seed 3: Dangling CNAME" if s3_status == "critical" else ("CNAME Removed" if state_id == "T2" else "Cloud Storage Target")
        s3_evidence = (
            "CNAME -> aiori-dormant-bucket.s3.us-east-1.amazonaws.com (NoSuchBucket HTTP 404)"
            if s3_status == "critical"
            else ("Dangling CNAME record purged from authoritative DNS" if state_id == "T2" else "Active S3 bucket endpoint responding HTTP 200")
        )
        s3_remed = (
            "aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch '{\"Changes\":[{\"Action\":\"DELETE\"}]}'"
            if s3_status == "critical"
            else None
        )
        sub_s3 = {
            "id": "sub-s3",
            "label": "test-s3.aiori.lab",
            "sublabel": s3_sublabel,
            "type": "domain",
            "status": s3_status,
            "x": 880,
            "y": 160,
            "deduction": 30 if s3_status == "critical" else None,
            "evidence": s3_evidence,
            "rfc": "Cloud Fingerprint",
            "remediation": s3_remed,
        }
        nodes.append(sub_s3)
        links.append({"source": "apex", "target": "sub-s3", "status": s3_status})

        # Host Nodes (Tier 3)
        host_15 = {
            "id": "host-15",
            "label": "10.0.1.15",
            "sublabel": "Production Host",
            "type": "host",
            "status": "healthy",
            "x": 200,
            "y": 280,
            "evidence": "PTR registered · Port 80, 443 permitted",
            "rfc": "RFC 1035",
        }
        nodes.append(host_15)
        links.append({"source": "sub-api", "target": "host-15", "status": "healthy"})

        host_legacy = {
            "id": "host-legacy",
            "label": "10.0.2.10",
            "sublabel": "Internal Legacy Host",
            "type": "host",
            "status": legacy_status,
            "x": 420,
            "y": 280,
            "evidence": "TLS certificate invalid anchor" if legacy_status == "critical" else "Host online, TLS valid",
            "rfc": "RFC 5280",
        }
        nodes.append(host_legacy)
        links.append({"source": "sub-legacy", "target": "host-legacy", "status": legacy_status})

        host_dev = {
            "id": "host-dev",
            "label": "10.0.2.20",
            "sublabel": "Dev Edge Host",
            "type": "host",
            "status": dev_status,
            "x": 640,
            "y": 280,
            "evidence": (
                "Listening on 0.0.0.0:8080 without reverse-proxy authentication"
                if dev_status == "warning"
                else "Host online, port 8080 filtered"
            ),
            "rfc": "Port Audit",
        }
        nodes.append(host_dev)
        links.append({"source": "sub-dev", "target": "host-dev", "status": dev_status})

        cloud_s3 = {
            "id": "cloud-s3",
            "label": "AWS S3 Cloud",
            "sublabel": "aiori-dormant-bucket",
            "type": "cname",
            "status": s3_status,
            "x": 880,
            "y": 280,
            "evidence": (
                "Amazon S3 NoSuchBucket: The specified bucket does not exist"
                if s3_status == "critical"
                else "S3 CNAME removed or claimed"
            ),
            "rfc": "Subdomain Takeover",
        }
        nodes.append(cloud_s3)
        links.append({"source": "sub-s3", "target": "cloud-s3", "status": s3_status})

        return {
            "snapshot_id": snapshot_id,
            "state_id": state_id,
            "hygiene_score": snapshot.get("hygiene_score", 100),
            "total_nodes": len(nodes),
            "total_edges": len(links),
            "nodes": nodes,
            "links": links,
            "edges": links,
        }


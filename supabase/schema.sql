-- ============================================================================
-- ArgusASM Database Schema (Supabase / PostgreSQL)
-- AIORI Hackathon 2026 — Problem Statement PS-011
-- Autonomous Attack-Surface Inventory & Drift Sentinel
-- ============================================================================

-- 1. Approved Scope Targets (Max 20 Domains, 10 Hosts)
CREATE TABLE IF NOT EXISTS approved_scope_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_name VARCHAR(255) NOT NULL UNIQUE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('domain', 'host')),
    role VARCHAR(50) NOT NULL DEFAULT 'production',
    owner VARCHAR(100) NOT NULL,
    zone VARCHAR(100) DEFAULT 'authoritative',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Inventory Assets (Documented Probes State)
CREATE TABLE IF NOT EXISTS inventory_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target VARCHAR(255) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    dns_records JSONB NOT NULL DEFAULT '{}'::jsonb,
    tls_certificate JSONB NOT NULL DEFAULT '{}'::jsonb,
    open_ports JSONB NOT NULL DEFAULT '[]'::jsonb,
    dangling_dns_status JSONB NOT NULL DEFAULT '{}'::jsonb,
    hygiene_score INTEGER NOT NULL CHECK (hygiene_score >= 0 AND hygiene_score <= 100),
    snapshot_tag VARCHAR(50) NOT NULL DEFAULT 'T0',
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Baseline & Historical Snapshots
CREATE TABLE IF NOT EXISTS baseline_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id VARCHAR(50) NOT NULL UNIQUE,
    snapshot_label VARCHAR(100) NOT NULL,
    total_assets INTEGER NOT NULL,
    hygiene_score INTEGER NOT NULL CHECK (hygiene_score >= 0 AND hygiene_score <= 100),
    drift_detected BOOLEAN NOT NULL DEFAULT false,
    drift_count INTEGER NOT NULL DEFAULT 0,
    merkle_root VARCHAR(66) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Stateful Drift Events (T0 vs Later Comparison)
CREATE TABLE IF NOT EXISTS drift_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baseline_id VARCHAR(50) NOT NULL,
    current_snapshot_id VARCHAR(50) NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    target VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    previous_state JSONB,
    current_state JSONB,
    evidence TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Seeded Issues & Detected Findings
CREATE TABLE IF NOT EXISTS security_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('EXPIRED_TLS', 'UNEXPECTED_PORT', 'DANGLING_DNS', 'DNS_DRIFT', 'HYGIENE_DEFICIT')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    target VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    fp_confidence VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    fp_rationale TEXT,
    remediation_snippet TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Cryptographic Merkle Audit Trail
CREATE TABLE IF NOT EXISTS merkle_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merkle_root VARCHAR(66) UNIQUE NOT NULL,
    snapshot_id VARCHAR(50) NOT NULL,
    leaf_count INTEGER NOT NULL,
    leaf_hashes JSONB NOT NULL DEFAULT '[]'::jsonb,
    attestation_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED_TAMPER_FREE',
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE approved_scope_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_audit_trail ENABLE ROW LEVEL SECURITY;

-- Demo policies (Allow read/insert for hackathon evaluation)
DROP POLICY IF EXISTS "Public Read approved_scope_targets" ON approved_scope_targets;
CREATE POLICY "Public Read approved_scope_targets" ON approved_scope_targets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read inventory_assets" ON inventory_assets;
CREATE POLICY "Public Read inventory_assets" ON inventory_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read baseline_snapshots" ON baseline_snapshots;
CREATE POLICY "Public Read baseline_snapshots" ON baseline_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read drift_events" ON drift_events;
CREATE POLICY "Public Read drift_events" ON drift_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read security_findings" ON security_findings;
CREATE POLICY "Public Read security_findings" ON security_findings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read merkle_audit_trail" ON merkle_audit_trail;
CREATE POLICY "Public Read merkle_audit_trail" ON merkle_audit_trail FOR SELECT USING (true);

-- Seed Initial Reference Snapshot (T0 Baseline)
INSERT INTO baseline_snapshots (
    snapshot_id, snapshot_label, total_assets, hygiene_score, drift_detected, drift_count, merkle_root
)
SELECT
    'SNAP-T0-BASELINE', 'Authorized Perimeter Baseline T0', 15, 96, false, 0,
    '0x7c4f9a3e2b1d8e5f6a0c4b2e8d1a3f5c7e9b0d2a4f6c8e1a3b5d7f9c1e3a5b7d'
WHERE NOT EXISTS (
    SELECT 1 FROM baseline_snapshots WHERE snapshot_id = 'SNAP-T0-BASELINE'
);

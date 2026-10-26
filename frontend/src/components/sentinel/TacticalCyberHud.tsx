import { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Mic,
  MicOff,
  Sliders,
  Globe,
  Radio,
  Server,
  Terminal,
  Activity,
  Layers,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";

interface IndicatorPoint {
  label: string;
  value: number; // current
  max: number;   // denominator
  angleDeg: number;
}

const INDICATORS: IndicatorPoint[] = [
  { label: "SAFETY SCORE", value: 13, max: 18, angleDeg: 0 },
  { label: "COMPLIANCE SCORE", value: 7, max: 12, angleDeg: 32.7 },
  { label: "PORT SCANNING", value: 8, max: 12, angleDeg: 65.4 },
  { label: "DDOS RESILIENCE", value: 11, max: 14, angleDeg: 98.1 },
  { label: "DNS SPOOFING", value: 12, max: 12, angleDeg: 130.8 },
  { label: "MAN IN THE MIDDLE", value: 4, max: 5, angleDeg: 163.5 },
  { label: "PORT SCANNING II", value: 7, max: 8, angleDeg: 196.2 },
  { label: "ARP POISONING", value: 11, max: 14, angleDeg: 228.9 },
  { label: "VLAN HOPPING", value: 12, max: 12, angleDeg: 261.6 },
  { label: "PHISHING RESILIENCE", value: 9, max: 8, angleDeg: 294.3 },
  { label: "SQL INJECTION", value: 4, max: 5, angleDeg: 327 },
];

interface ImprovementItem {
  id: string;
  name: string;
  level: number; // 0 to 5
}

interface CyberEvent {
  id: string;
  title: string;
  severity: number;
  severityLevel: "critical" | "high" | "warning";
  ip: string;
  payload: string;
  type: string;
  timestamp: string;
}

const INITIAL_EVENTS: CyberEvent[] = [
  {
    id: "EV-01",
    title: "UNUSUAL TRAFFIC",
    severity: 3.2,
    severityLevel: "critical",
    ip: "235.254.3.634",
    payload: "PAYLOAD 5112",
    type: "TYPE CELL PHONE | SUR1 SUR2",
    timestamp: "12s ago",
  },
  {
    id: "EV-02",
    title: "DDOS ATTACK",
    severity: 3.2,
    severityLevel: "critical",
    ip: "198.51.100.24",
    payload: "PAYLOAD 5112",
    type: "SYN FLOOD 14.2K PPS | MITIGATED",
    timestamp: "34s ago",
  },
  {
    id: "EV-03",
    title: "ROGUE SECURITY SOFTWARE",
    severity: 3.2,
    severityLevel: "critical",
    ip: "10.0.2.20:8080",
    payload: "PAYLOAD 5112",
    type: "WERKZEUG DEBUG CONSOLE EXPOSED",
    timestamp: "1m ago",
  },
  {
    id: "EV-04",
    title: "SQL INJECTION ATTACK",
    severity: 2.8,
    severityLevel: "high",
    ip: "203.0.113.88",
    payload: "PAYLOAD 5112",
    type: "UNION SELECT NULL DUMP ATTEMPT",
    timestamp: "2m ago",
  },
  {
    id: "EV-05",
    title: "EXPIRED CERTIFICATE HANDSHAKE",
    severity: 2.4,
    severityLevel: "warning",
    ip: "10.0.2.10:443",
    payload: "PAYLOAD 2048",
    type: "X.509 CERT EXPIRED (-292 DAYS)",
    timestamp: "3m ago",
  },
];

interface MapNode {
  id: string;
  label: string;
  role: string;
  x: number;
  y: number;
  isCompromised?: boolean;
  status: "secure" | "compromised" | "warning" | "monitored";
  ip: string;
  ports: string;
  evidence?: string;
  remediation?: string;
}

const MAP_NODES: MapNode[] = [
  {
    id: "web-01",
    label: "WEB SERVER",
    role: "Core Web Edge",
    x: 130,
    y: 70,
    isCompromised: true,
    status: "compromised",
    ip: "10.0.2.10",
    ports: "443 (Expired X.509)",
    evidence: "Certificate expired 292 days ago. TLS trust validation failure.",
    remediation: "certbot renew --cert-name legacy.aiori.lab",
  },
  {
    id: "web-02",
    label: "WEB SERVER",
    role: "Production Proxy",
    x: 170,
    y: 200,
    status: "secure",
    ip: "10.0.1.15",
    ports: "80, 443",
  },
  {
    id: "web-03",
    label: "WEB SERVER",
    role: "Dev Service",
    x: 230,
    y: 330,
    status: "warning",
    ip: "10.0.2.20",
    ports: "8080 (Shadow Port)",
    evidence: "Unapproved Werkzeug debugger listening publicly on port 8080.",
    remediation: "ufw deny 8080/tcp && systemctl restart aiori-dev",
  },
  {
    id: "web-04",
    label: "WEB SERVER",
    role: "API Gateway",
    x: 290,
    y: 220,
    status: "secure",
    ip: "10.0.1.25",
    ports: "443",
  },
  {
    id: "web-05",
    label: "WEB SERVER",
    role: "Authoritative DNS",
    x: 260,
    y: 160,
    status: "secure",
    ip: "10.0.1.5",
    ports: "53 (TCP/UDP)",
  },
  {
    id: "co-01",
    label: "CO DESKTOP",
    role: "Management Station",
    x: 320,
    y: 55,
    status: "secure",
    ip: "10.0.3.12",
    ports: "22 (SSH Key Only)",
  },
  {
    id: "co-02",
    label: "CO DESKTOP",
    role: "Analyst Workstation",
    x: 370,
    y: 70,
    status: "secure",
    ip: "10.0.3.18",
    ports: "Internal VLAN",
  },
  {
    id: "co-03",
    label: "CO DESKTOP",
    role: "SOC Telemetry Node",
    x: 370,
    y: 140,
    status: "secure",
    ip: "10.0.3.22",
    ports: "Prometheus Agent",
  },
  {
    id: "co-04",
    label: "CO DESKTOP",
    role: "DB Desktop Primary",
    x: 250,
    y: 130,
    status: "secure",
    ip: "10.0.4.10",
    ports: "5432 (Postgres TLS)",
  },
  {
    id: "co-05",
    label: "CO DESKTOP",
    role: "DB Desktop Replica",
    x: 390,
    y: 280,
    status: "secure",
    ip: "10.0.4.12",
    ports: "5432 (Postgres)",
  },
  {
    id: "co-06",
    label: "CO DESKTOP",
    role: "Dangling CNAME Sentinel",
    x: 135,
    y: 305,
    status: "warning",
    ip: "test-s3.aiori.lab",
    ports: "AWS S3 404",
    evidence: "CNAME points to deleted S3 bucket. Vulnerable to subdomain takeover.",
    remediation: "route53 delete-record --zone Z123 --name test-s3.aiori.lab",
  },
];

export function TacticalCyberHud() {
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(MAP_NODES[0] ?? null);
  const [hoveredIndicator, setHoveredIndicator] = useState<IndicatorPoint | null>(null);
  const [activeCarousel, setActiveCarousel] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedRemediated, setSimulatedRemediated] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [timeFilter, setTimeFilter] = useState("ACTUAL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [complianceScore, setComplianceScore] = useState(4.9);
  const [improvements, setImprovements] = useState<ImprovementItem[]>([
    { id: "fw", name: "DEPLOY FIREWALLS", level: 5 },
    { id: "cdn", name: "USE CDN & WAF", level: 4 },
    { id: "resp", name: "DECREASE RESPONSE TIME", level: 3 },
    { id: "train", name: "TRAIN SOC STAFF", level: 2 },
    { id: "hire", name: "INCREASE DEFENDERS", level: 1 },
  ]);

  const handleLevelClick = (id: string, clickedLevel: number) => {
    setImprovements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, level: clickedLevel } : item))
    );
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedRemediated((prev) => !prev);
      setComplianceScore((prev) => (prev < 8 ? 9.6 : 4.9));
    }, 1400);
  };

  // Convert indicators to polygon points for SVG Spider Chart
  const radarRadius = 88;
  const radarCenter = 110;

  const radarPolygonPoints = useMemo(() => {
    return INDICATORS.map((ind) => {
      const angleRad = ((ind.angleDeg - 90) * Math.PI) / 180;
      const ratio = simulatedRemediated ? Math.min(1, (ind.value + 4) / ind.max) : ind.value / ind.max;
      const r = ratio * radarRadius;
      const x = radarCenter + r * Math.cos(angleRad);
      const y = radarCenter + r * Math.sin(angleRad);
      return { x, y, ...ind };
    });
  }, [simulatedRemediated]);

  const polygonPathString = radarPolygonPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <section className="relative w-full bg-slate-50/70 dark:bg-[#030708] text-slate-800 dark:text-[#cbf3f0] py-10 px-3 sm:px-6 lg:px-8 border-y border-border dark:border-[#00f5d4]/20 select-none overflow-hidden font-mono transition-colors">
      {/* Background Cyber Grid & Vignette */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10 dark:opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(#00f5d4 0.75px, transparent 0.75px), linear-gradient(to right, rgba(0,245,212,0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 hidden dark:block bg-radial from-transparent via-[#030708]/70 to-[#030708]" />

      {/* Main HUD Outer Frame */}
      <div className="hud-bracket-container relative mx-auto max-w-7xl p-4 sm:p-6 lg:p-7 border border-border dark:border-[#00f5d4]/25 shadow-xl dark:shadow-[0_0_50px_rgba(0,245,212,0.06)]">
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />

        {/* Console Header Banner */}
        <div className="flex flex-wrap items-center justify-between border-b border-border dark:border-[#00f5d4]/20 pb-4 mb-6 gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary dark:bg-[#00f5d4] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary dark:bg-[#00f5d4]" />
            </div>
            <span className="font-bold tracking-widest text-sm text-primary dark:text-[#00f5d4] text-glow-cyan uppercase">
              CYBERSPECTRE TACTICAL HUD // SOC TELEMETRY VIEW
            </span>
            <span className="hidden md:inline border border-primary/40 dark:border-[#00f5d4]/40 bg-primary/10 dark:bg-[#00f5d4]/10 px-2 py-0.5 text-[10px] text-primary dark:text-[#00f5d4]">
              AUTONOMOUS ATTACK-SURFACE SENTINEL
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-[#8ea8a7]">
            <span>NODE INTEGRITY: <strong className={simulatedRemediated ? "text-emerald-600 dark:text-[#00f5d4]" : "text-red-600 dark:text-[#ff0055]"}>{simulatedRemediated ? "100% SECURE" : "3 BREACH DRIFTS"}</strong></span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">RFC: <strong>1035 / 5280 COMPLIANT</strong></span>
            <button
              onClick={() => {
                setSimulatedRemediated(false);
                setComplianceScore(4.9);
              }}
              title="Reset HUD state"
              className="hover:text-primary dark:hover:text-[#00f5d4] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> RESET
            </button>
          </div>
        </div>

        {/* Three Columns Main Grid (Image 1 Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ══════════ LEFT COLUMN (3 cols): Radar Chart & Suggested Improvements ══════════ */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* KEY INDICATORS Radar Box */}
            <div className="border border-border dark:border-[#00f5d4]/20 bg-white/95 dark:bg-[#040e14]/70 p-4 relative backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border dark:border-[#00f5d4]/20 pb-2 mb-3">
                <span className="text-xs font-bold tracking-wider text-primary dark:text-[#00f5d4] uppercase">
                  KEY INDICATORS
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#558684]">11 VECTORS</span>
              </div>

              {/* Spider / Radar Chart */}
              <div className="relative flex items-center justify-center py-1">
                <svg
                  viewBox="0 0 220 220"
                  className="w-full max-w-[210px] h-auto overflow-visible"
                >
                  {/* Concentric Polygons */}
                  {[0.25, 0.5, 0.75, 1.0].map((scale, sIdx) => {
                    const r = radarRadius * scale;
                    const polyPts = INDICATORS.map((ind) => {
                      const a = ((ind.angleDeg - 90) * Math.PI) / 180;
                      return `${(radarCenter + r * Math.cos(a)).toFixed(1)},${(radarCenter + r * Math.sin(a)).toFixed(1)}`;
                    }).join(" ");
                    return (
                      <polygon
                        key={sIdx}
                        points={polyPts}
                        fill="none"
                        stroke="#00f5d4"
                        strokeOpacity={scale === 1.0 ? 0.35 : 0.15}
                        strokeWidth="0.8"
                        strokeDasharray={scale === 1.0 ? "none" : "2,3"}
                      />
                    );
                  })}

                  {/* Radial Axis Spokes */}
                  {INDICATORS.map((ind, i) => {
                    const a = ((ind.angleDeg - 90) * Math.PI) / 180;
                    const x = radarCenter + radarRadius * Math.cos(a);
                    const y = radarCenter + radarRadius * Math.sin(a);
                    return (
                      <line
                        key={i}
                        x1={radarCenter}
                        y1={radarCenter}
                        x2={x}
                        y2={y}
                        stroke="#00f5d4"
                        strokeOpacity="0.2"
                        strokeWidth="0.8"
                      />
                    );
                  })}

                  {/* Data Filled Polygon */}
                  <polygon
                    points={polygonPathString}
                    fill="rgba(0, 245, 212, 0.22)"
                    stroke="#00f5d4"
                    strokeWidth="1.6"
                    className="transition-all duration-700 ease-out"
                    style={{
                      filter: "drop-shadow(0 0 8px rgba(0, 245, 212, 0.6))",
                    }}
                  />

                  {/* Data Points */}
                  {radarPolygonPoints.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="2.8"
                      fill="#030708"
                      stroke="#00f5d4"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-transform hover:scale-150"
                      onMouseEnter={() => setHoveredIndicator(pt)}
                      onMouseLeave={() => setHoveredIndicator(null)}
                    />
                  ))}

                  {/* Center Dot */}
                  <circle cx={radarCenter} cy={radarCenter} r="2" fill="#00f5d4" />
                </svg>

                {/* Hover Tooltip Overlay */}
                {hoveredIndicator && (
                  <div className="absolute top-2 left-2 bg-white dark:bg-[#020d12] border border-primary dark:border-[#00f5d4] p-1.5 text-[10px] text-primary dark:text-[#00f5d4] z-20 shadow-lg pointer-events-none">
                    <strong>{hoveredIndicator.label}</strong>: {hoveredIndicator.value}/{hoveredIndicator.max}
                  </div>
                )}
              </div>

              {/* Spider Vector Legend labels */}
              <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-600 dark:text-[#719694]">
                <div>• CYBER-ATTACK: <span className="text-primary dark:text-[#00f5d4] font-semibold">11/14</span></div>
                <div>• SAFETY SCORE: <span className="text-primary dark:text-[#00f5d4] font-semibold">13/18</span></div>
                <div>• COMPLIANCE: <span className="text-primary dark:text-[#00f5d4] font-semibold">7/12</span></div>
                <div>• PORT SCAN: <span className="text-primary dark:text-[#00f5d4] font-semibold">8/12</span></div>
                <div>• DDOS DEFENSE: <span className="text-primary dark:text-[#00f5d4] font-semibold">11/14</span></div>
                <div>• DNS SPOOF: <span className="text-primary dark:text-[#00f5d4] font-semibold">12/12</span></div>
              </div>
            </div>

            {/* SUGGESTED IMPROVEMENTS Box */}
            <div className="border border-border dark:border-[#00f5d4]/20 bg-white/95 dark:bg-[#040e14]/70 p-4 relative backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border dark:border-[#00f5d4]/20 pb-2 mb-3">
                <span className="text-xs font-bold tracking-wider text-primary dark:text-[#00f5d4] uppercase">
                  SUGGESTED IMPROVEMENTS
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#558684]">SIMULATOR</span>
              </div>

              <div className="space-y-3">
                {improvements.map((item) => (
                  <div key={item.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1 text-[10px]">
                      <span className="text-slate-700 dark:text-[#a5c7c5] uppercase tracking-wide truncate pr-2">
                        {item.name}
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => handleLevelClick(item.id, lvl)}
                            className={`h-2 w-2.5 transition-colors cursor-pointer ${
                              lvl <= item.level
                                ? "bg-primary dark:bg-[#00f5d4] shadow-[0_0_6px_rgba(2,132,199,0.5)] dark:shadow-[0_0_6px_rgba(0,245,212,0.8)]"
                                : "bg-slate-200 dark:bg-[#14282e] hover:bg-primary/30 dark:hover:bg-[#00f5d4]/30"
                            }`}
                            title={`Set level ${lvl}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Glowing SIMULATE Button */}
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className={`mt-4 w-full py-2.5 px-4 text-xs font-bold tracking-widest uppercase transition-all duration-300 border cursor-pointer ${
                  isSimulating
                    ? "border-primary dark:border-[#00f5d4] bg-primary/20 dark:bg-[#00f5d4]/30 text-primary dark:text-[#00f5d4] animate-pulse"
                    : simulatedRemediated
                    ? "border-emerald-600 dark:border-[#00f5d4] bg-emerald-50 dark:bg-[#00f5d4]/20 text-emerald-700 dark:text-[#00f5d4] hover:bg-emerald-100 dark:hover:bg-[#00f5d4]/30 shadow-sm"
                    : "border-primary/70 dark:border-[#00f5d4]/70 bg-primary/10 dark:bg-transparent text-primary dark:text-[#00f5d4] hover:bg-primary/20 dark:hover:bg-[#00f5d4]/15 shadow-sm"
                }`}
              >
                {isSimulating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Activity className="h-3.5 w-3.5 animate-spin" />
                    RECALCULATING PERIMETER...
                  </span>
                ) : simulatedRemediated ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    SIMULATE: SHIELDED (9.6)
                  </span>
                ) : (
                  "SIMULATE"
                )}
              </button>
            </div>
          </div>

          {/* ══════════ CENTER COLUMN (6 cols): Radar Network Map ══════════ */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="border border-border dark:border-[#00f5d4]/20 bg-white/95 dark:bg-[#040e14]/70 p-4 relative backdrop-blur-md min-h-[460px] flex flex-col justify-between">
              {/* Box Header */}
              <div className="flex items-center justify-between border-b border-border dark:border-[#00f5d4]/20 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-primary dark:text-[#00f5d4] uppercase">
                    NETWORK MAP
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-[#558684]">
                    ({MAP_NODES.length} ACTIVE RADIAL NODES)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 dark:bg-[#00f5d4]" /> SECURE
                  <span className="inline-block h-2 w-2 rounded-full bg-red-600 dark:bg-[#ff0055] ml-2" /> DRIFT ALERT
                </div>
              </div>

              {/* Interactive Radial Graph SVG Canvas */}
              <div className="relative flex-1 flex items-center justify-center py-4">
                <svg
                  viewBox="0 0 500 400"
                  className="w-full h-full max-h-[380px] overflow-visible"
                >
                  <defs>
                    {/* Glowing Filter for Cyan */}
                    <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    {/* Glowing Filter for Red Threat */}
                    <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Concentric Radar Grid Circles */}
                  {[45, 90, 135, 180, 225].map((r, i) => (
                    <circle
                      key={i}
                      cx="250"
                      cy="200"
                      r={r}
                      fill="none"
                      stroke="#00f5d4"
                      strokeOpacity={i === 4 ? "0.2" : "0.08"}
                      strokeWidth="0.8"
                      strokeDasharray={i % 2 === 0 ? "3,4" : "none"}
                    />
                  ))}

                  {/* Crosshair lines */}
                  <line x1="250" y1="20" x2="250" y2="380" stroke="#00f5d4" strokeOpacity="0.08" strokeWidth="0.8" />
                  <line x1="40" y1="200" x2="460" y2="200" stroke="#00f5d4" strokeOpacity="0.08" strokeWidth="0.8" />

                  {/* Rotating Radar Beam Sweep */}
                  <g className="animate-radar-sweep">
                    <line
                      x1="250"
                      y1="200"
                      x2="250"
                      y2="10"
                      stroke="url(#radarGradient)"
                      strokeWidth="1.5"
                    />
                  </g>
                  <linearGradient id="radarGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#00f5d4" stopOpacity="0" />
                    <stop offset="100%" stopColor="#00f5d4" stopOpacity="0.6" />
                  </linearGradient>

                  {/* Normal Connection Lines (Curved Bezier Paths) */}
                  {MAP_NODES.map((node) => {
                    const isBreach = node.isCompromised && !simulatedRemediated;
                    if (isBreach) return null; // rendered separately with red laser
                    const cx = 250;
                    const cy = 200;
                    const cpx = (cx + node.x) / 2 + (node.y > cy ? -20 : 20);
                    const cpy = (cy + node.y) / 2 + (node.x > cx ? 20 : -20);
                    return (
                      <g key={node.id}>
                        <path
                          d={`M ${cx} ${cy} Q ${cpx} ${cpy} ${node.x} ${node.y}`}
                          fill="none"
                          stroke="#00f5d4"
                          strokeOpacity="0.3"
                          strokeWidth="1"
                        />
                        {/* Flowing animated dash packets */}
                        <path
                          d={`M ${cx} ${cy} Q ${cpx} ${cpy} ${node.x} ${node.y}`}
                          fill="none"
                          stroke="#00f5d4"
                          strokeWidth="1.5"
                          strokeDasharray="6,24"
                          className="animate-laser-flow"
                          filter="url(#glow-cyan)"
                        />
                      </g>
                    );
                  })}

                  {/* THE COMPROMISED / BREACH RED TRAJECTORY (Image 1 Main Showpiece) */}
                  {!simulatedRemediated ? (
                    <g>
                      <path
                        d="M 250 200 Q 160 120 130 70"
                        fill="none"
                        stroke="#ff0055"
                        strokeWidth="2.5"
                        filter="url(#glow-red)"
                      />
                      {/* Flowing fast red laser pulses */}
                      <path
                        d="M 250 200 Q 160 120 130 70"
                        fill="none"
                        stroke="#ffea00"
                        strokeWidth="2"
                        strokeDasharray="8,20"
                        className="animate-laser-threat"
                      />
                    </g>
                  ) : (
                    <g>
                      {/* Remediation converted to vibrant secure cyan/green */}
                      <path
                        d="M 250 200 Q 160 120 130 70"
                        fill="none"
                        stroke="#00f5d4"
                        strokeWidth="2"
                        filter="url(#glow-cyan)"
                      />
                      <path
                        d="M 250 200 Q 160 120 130 70"
                        fill="none"
                        stroke="#2ee59d"
                        strokeWidth="2"
                        strokeDasharray="6,15"
                        className="animate-laser-flow"
                      />
                    </g>
                  )}

                  {/* Central Hub Node (Apex SOA Domain) */}
                  <circle cx="250" cy="200" r="14" className="fill-white dark:fill-[#030708] stroke-primary dark:stroke-[#00f5d4]" strokeWidth="2" filter="url(#glow-cyan)" />
                  <circle cx="250" cy="200" r="6" className="fill-primary dark:fill-[#00f5d4]" />
                  <text x="250" y="226" className="fill-primary dark:fill-[#00f5d4]" fontSize="9" textAnchor="middle" fontWeight="bold">
                    CORE APEX HUB
                  </text>

                  {/* Radial Nodes */}
                  {MAP_NODES.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isBreach = node.isCompromised && !simulatedRemediated;
                    const color = isBreach ? "#ff0055" : node.status === "warning" ? "#ffb703" : "#00f5d4";

                    return (
                      <g
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className="cursor-pointer group"
                      >
                        {/* Threat shockwave beacon if compromised */}
                        {isBreach && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="18"
                            fill="none"
                            stroke="#ff0055"
                            strokeWidth="1.5"
                            className="animate-threat-beacon"
                          />
                        )}

                        {/* Node Outer Ring */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? 10 : 7}
                          stroke={color}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          style={{
                            filter: isBreach
                              ? "drop-shadow(0 0 8px rgba(255,0,85,0.9))"
                              : "drop-shadow(0 0 6px rgba(0,245,212,0.6))",
                          }}
                          className="fill-white dark:fill-[#030708] transition-all duration-200"
                        />

                        {/* Node Center Dot */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? 4 : 2.5}
                          fill={color}
                        />

                        {/* Node Label Text */}
                        <text
                          x={node.x}
                          y={node.y - 11}
                          fill={color}
                          fontSize="7.5"
                          textAnchor="middle"
                          fontWeight={isSelected ? "bold" : "normal"}
                          className="transition-opacity group-hover:opacity-100"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Selected Node Details Card Overlay */}
              {selectedNode && (
                <div className="border border-primary/30 dark:border-[#00f5d4]/40 bg-slate-50/95 dark:bg-[#030d12]/90 p-2.5 text-[11px] flex flex-wrap items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        selectedNode.isCompromised && !simulatedRemediated
                          ? "bg-red-600 dark:bg-[#ff0055] animate-ping"
                          : "bg-emerald-600 dark:bg-[#00f5d4]"
                      }`}
                    />
                    <strong className="text-primary dark:text-[#00f5d4]">{selectedNode.label}</strong>
                    <span className="text-slate-600 dark:text-[#6ea8a4]">[{selectedNode.ip}]</span>
                    <span className="text-[10px] text-slate-500 dark:text-muted-foreground">Ports: {selectedNode.ports}</span>
                  </div>

                  {selectedNode.evidence && (
                    <div className="text-[10px] text-red-600 dark:text-[#ff0055] truncate max-w-md font-semibold">
                      ⚠️ {selectedNode.evidence}
                    </div>
                  )}

                  {selectedNode.remediation && (
                    <div className="text-[10px] text-primary dark:text-[#00f5d4] font-mono bg-primary/10 dark:bg-[#00f5d4]/10 px-2 py-0.5 border border-primary/30 dark:border-[#00f5d4]/30 truncate">
                      Fix: {selectedNode.remediation}
                    </div>
                  )}
                </div>
              )}

              {/* Carousel Pagination Dots (Matching Image 1) */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-border dark:border-[#00f5d4]/10">
                {[0, 1, 2, 3, 4].map((dot) => (
                  <button
                    key={dot}
                    onClick={() => setActiveCarousel(dot)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeCarousel === dot
                        ? "w-6 bg-primary dark:bg-[#00f5d4] shadow-[0_0_8px_rgba(2,132,199,0.5)] dark:shadow-[0_0_8px_rgba(0,245,212,0.8)]"
                        : "w-2 bg-slate-300 dark:bg-[#00f5d4]/30 hover:bg-primary/50 dark:hover:bg-[#00f5d4]/60"
                    }`}
                    title={`View preset ${dot + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ══════════ RIGHT COLUMN (3 cols): Traffic Map & Real-time Events Log ══════════ */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* TRAFFIC MAP Box */}
            <div className="border border-border dark:border-[#00f5d4]/20 bg-white/95 dark:bg-[#040e14]/70 p-4 relative backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border dark:border-[#00f5d4]/20 pb-2 mb-2">
                <span className="text-xs font-bold tracking-wider text-primary dark:text-[#00f5d4] uppercase">
                  TRAFFIC MAP
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#558684]">GLOBAL ARCS</span>
              </div>

              {/* World Vector Map with Arc Trajectories */}
              <div className="relative py-1">
                <svg
                  viewBox="0 0 300 150"
                  className="w-full h-auto overflow-visible"
                >
                  {/* Stylized Minimal World Map Paths */}
                  {/* North America */}
                  <path
                    d="M 35 35 Q 60 20 85 30 Q 95 45 80 75 Q 60 85 45 65 Z"
                    fill="rgba(0, 245, 212, 0.08)"
                    stroke="#00f5d4"
                    strokeWidth="0.8"
                    strokeOpacity="0.4"
                  />
                  {/* South America */}
                  <path
                    d="M 70 85 Q 90 95 85 125 Q 75 140 65 110 Z"
                    fill="rgba(0, 245, 212, 0.08)"
                    stroke="#00f5d4"
                    strokeWidth="0.8"
                    strokeOpacity="0.4"
                  />
                  {/* Europe */}
                  <path
                    d="M 130 25 Q 160 20 165 45 Q 145 55 130 40 Z"
                    fill="rgba(0, 245, 212, 0.08)"
                    stroke="#00f5d4"
                    strokeWidth="0.8"
                    strokeOpacity="0.4"
                  />
                  {/* Africa */}
                  <path
                    d="M 135 55 Q 165 60 160 100 Q 140 115 135 85 Z"
                    fill="rgba(0, 245, 212, 0.08)"
                    stroke="#00f5d4"
                    strokeWidth="0.8"
                    strokeOpacity="0.4"
                  />
                  {/* Asia */}
                  <path
                    d="M 175 25 Q 240 20 250 65 Q 215 85 180 60 Z"
                    fill="rgba(0, 245, 212, 0.08)"
                    stroke="#00f5d4"
                    strokeWidth="0.8"
                    strokeOpacity="0.4"
                  />
                  {/* Australia */}
                  <path
                    d="M 230 100 Q 260 95 255 125 Q 235 125 225 110 Z"
                    fill="rgba(0, 245, 212, 0.08)"
                    stroke="#00f5d4"
                    strokeWidth="0.8"
                    strokeOpacity="0.4"
                  />

                  {/* Threat / Probe Arcs Across Continents (Image 1 Style) */}
                  {/* US to Europe */}
                  <path
                    d="M 65 50 Q 105 10 145 35"
                    fill="none"
                    stroke="#00f5d4"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                    className="animate-laser-flow"
                  />
                  {/* Europe to Asia */}
                  <path
                    d="M 150 35 Q 185 15 220 45"
                    fill="none"
                    stroke="#ff0055"
                    strokeWidth="1.2"
                    strokeDasharray="4,4"
                    className="animate-laser-threat"
                  />
                  {/* Asia to US */}
                  <path
                    d="M 220 45 Q 140 120 65 50"
                    fill="none"
                    stroke="#00f5d4"
                    strokeWidth="1"
                    strokeOpacity="0.6"
                  />

                  {/* Threat Pin Markers */}
                  <circle cx="65" cy="50" r="3" fill="#00f5d4" className="animate-ping opacity-75" />
                  <circle cx="65" cy="50" r="2.5" fill="#00f5d4" />
                  <circle cx="145" cy="35" r="2.5" fill="#00f5d4" />
                  <circle cx="220" cy="45" r="3" fill="#ff0055" className="animate-ping opacity-75" />
                  <circle cx="220" cy="45" r="2.5" fill="#ff0055" />
                </svg>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-[#558684]">
                <span>ORCHESTRATED PROBES: 4</span>
                <span className="text-[#00f5d4]">GLOBAL ROUTE PASS</span>
              </div>
            </div>

            {/* EVENTS LOG Box */}
            <div className="border border-border dark:border-[#00f5d4]/20 bg-white/95 dark:bg-[#040e14]/70 p-4 relative backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border dark:border-[#00f5d4]/20 pb-2 mb-3">
                <span className="text-xs font-bold tracking-wider text-primary dark:text-[#00f5d4] uppercase">
                  EVENTS LOG
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#558684]">REAL-TIME</span>
              </div>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {INITIAL_EVENTS.map((ev) => (
                  <div
                    key={ev.id}
                    className="border border-border dark:border-[#00f5d4]/15 bg-slate-50/90 dark:bg-[#03090e]/80 p-2 text-xs transition-colors hover:border-primary/50 dark:hover:border-[#00f5d4]/50"
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold text-slate-900 dark:text-[#c7e9e7] uppercase truncate pr-1">
                        {ev.title}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-red-600 dark:text-[#ff0055] text-glow-red text-[10px]">
                        <AlertTriangle className="h-2.5 w-2.5 inline" /> {ev.severity.toFixed(1)}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-600 dark:text-[#699290] font-mono leading-relaxed truncate">
                      IP {ev.ip} | {ev.payload}
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-[#527775] truncate">
                      {ev.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ BOTTOM HUD STATUS CONSOLE (Image 1 Bottom Bar) ══════════ */}
        <div className="mt-6 border-t border-border dark:border-[#00f5d4]/20 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Left: Giant Compliance Score & Brackets */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="border border-primary dark:border-[#00f5d4] bg-primary/10 dark:bg-[#00f5d4]/15 px-3.5 py-1.5 shadow-sm dark:shadow-[0_0_15px_rgba(0,245,212,0.25)] flex items-center gap-2">
              <span className="text-xl font-black text-primary dark:text-[#00f5d4] text-glow-cyan tracking-wider">
                {complianceScore.toFixed(1).replace(".", ",")}
              </span>
              <div className="text-[9px] uppercase leading-tight font-bold text-primary dark:text-[#00f5d4]">
                COMPLIANCE<br />SCORE
              </div>
            </div>

            {/* Brackets [ 5 ACTUAL ] [ 12 PREVENTED ] [ 43/21 PREDICTED ] */}
            <div className="flex items-center gap-2 text-[11px]">
              <div className="border border-border dark:border-[#00f5d4]/30 bg-slate-100 dark:bg-[#00f5d4]/5 px-2.5 py-1">
                <span className="text-muted-foreground mr-1.5">ISSUES:</span>
                <strong className={simulatedRemediated ? "text-emerald-600 dark:text-[#00f5d4]" : "text-red-600 dark:text-[#ff0055]"}>
                  {simulatedRemediated ? "0" : "5"}
                </strong>
                <span className="text-[9px] text-muted-foreground ml-1">ACTUAL</span>
              </div>

              <div className="border border-border dark:border-[#00f5d4]/30 bg-slate-100 dark:bg-[#00f5d4]/5 px-2.5 py-1">
                <strong className="text-emerald-600 dark:text-[#00f5d4]">
                  {simulatedRemediated ? "17" : "12"}
                </strong>
                <span className="text-[9px] text-muted-foreground ml-1">PREVENTED</span>
              </div>

              <div className="border border-border dark:border-[#00f5d4]/30 bg-slate-100 dark:bg-[#00f5d4]/5 px-2.5 py-1">
                <strong className="text-primary dark:text-[#00f5d4]">43/21</strong>
                <span className="text-[9px] text-muted-foreground ml-1">PREDICTED</span>
              </div>
            </div>
          </div>

          {/* Center: Tactical Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <button
              onClick={() => setTimeFilter((prev) => (prev === "ACTUAL" ? "HISTORICAL" : "ACTUAL"))}
              className="border border-border dark:border-[#00f5d4]/40 bg-slate-100 dark:bg-[#00f5d4]/10 hover:bg-slate-200 dark:hover:bg-[#00f5d4]/20 px-3 py-1 text-slate-800 dark:text-[#00f5d4] transition-colors cursor-pointer"
            >
              <strong>{timeFilter}</strong>
              <span className="block text-[8px] text-slate-500 dark:text-[#6b9d9b]">PERIOD OF TIME</span>
            </button>

            <button
              onClick={() => setCategoryFilter((prev) => (prev === "ALL" ? "PROBES" : "ALL"))}
              className="border border-border dark:border-[#00f5d4]/40 bg-slate-100 dark:bg-[#00f5d4]/10 hover:bg-slate-200 dark:hover:bg-[#00f5d4]/20 px-3 py-1 text-slate-800 dark:text-[#00f5d4] transition-colors cursor-pointer"
            >
              <strong>{categoryFilter}</strong>
              <span className="block text-[8px] text-slate-500 dark:text-[#6b9d9b]">NODE CATEGORY</span>
            </button>

            <button
              onClick={() => setStatusFilter((prev) => (prev === "ALL" ? "ACTIVE" : "ALL"))}
              className="border border-border dark:border-[#00f5d4]/40 bg-slate-100 dark:bg-[#00f5d4]/10 hover:bg-slate-200 dark:hover:bg-[#00f5d4]/20 px-3 py-1 text-slate-800 dark:text-[#00f5d4] transition-colors cursor-pointer"
            >
              <strong>{statusFilter}</strong>
              <span className="block text-[8px] text-slate-500 dark:text-[#6b9d9b]">CONNECTION STATUS</span>
            </button>
          </div>

          {/* Right: Voice Mic & Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceActive((prev) => !prev)}
              className={`flex items-center gap-2 border px-3 py-1.5 text-[10px] transition-all cursor-pointer ${
                voiceActive
                  ? "border-primary dark:border-[#00f5d4] bg-primary/20 dark:bg-[#00f5d4]/20 text-primary dark:text-[#00f5d4] shadow-sm"
                  : "border-border dark:border-[#00f5d4]/30 bg-slate-100 dark:bg-transparent text-slate-600 dark:text-[#6e9a98] hover:border-primary dark:hover:border-[#00f5d4]/60"
              }`}
            >
              {voiceActive ? <Mic className="h-3.5 w-3.5 animate-pulse text-primary dark:text-[#00f5d4]" /> : <MicOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">
                {voiceActive ? "VOICE CONTROL ACTIVE" : "PRESS FOR VOICE CONTROL"}
              </span>
            </button>

            <button
              onClick={handleSimulate}
              title="Quick simulate or toggle defense"
              className="border border-border dark:border-[#00f5d4]/40 bg-slate-100 dark:bg-[#00f5d4]/10 hover:bg-slate-200 dark:hover:bg-[#00f5d4]/20 p-2 text-slate-700 dark:text-[#00f5d4] transition-colors cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

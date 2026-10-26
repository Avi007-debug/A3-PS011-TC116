import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Radio,
  Server,
  Activity,
  Sliders,
  Settings,
  Bell,
  ArrowUpRight,
  TrendingDown,
  Layers,
  ChevronRight,
  Cpu,
  Wifi,
} from "lucide-react";

interface DataCenter {
  id: string;
  name: string;
  flag: string;
  bandwidth: string;
  detections: number;
  malicious: number;
  suspicious: number;
  resolved: number;
}

const DATA_CENTERS: DataCenter[] = [
  {
    id: "dc-1",
    name: "North Virginia (DNS Probe)",
    flag: "🇺🇸",
    bandwidth: "14 GBPS",
    detections: 11,
    malicious: 51,
    suspicious: 22,
    resolved: 11,
  },
  {
    id: "dc-2",
    name: "Vancouver (TLS Inspector)",
    flag: "🇨🇦",
    bandwidth: "11 GBPS",
    detections: 28,
    malicious: 59,
    suspicious: 29,
    resolved: 9,
  },
  {
    id: "dc-3",
    name: "Houston (Port Auditor)",
    flag: "🇺🇸",
    bandwidth: "14 GBPS",
    detections: 11,
    malicious: 27,
    suspicious: 51,
    resolved: 21,
  },
];

interface TowerRelay {
  id: string;
  name: string;
  score: number;
  status: "critical" | "warning" | "healthy";
}

const TOWERS: TowerRelay[] = [
  { id: "t1", name: "Menwith Hill Station", score: 83, status: "critical" },
  { id: "t2", name: "Fort Meade Relay", score: 81, status: "critical" },
  { id: "t3", name: "Telesat Ground Station", score: 72, status: "critical" },
  { id: "t4", name: "Redu Ground Station", score: 47, status: "warning" },
  { id: "t5", name: "Guayana Space Center", score: 34, status: "warning" },
  { id: "t6", name: "White Sands Complex", score: 15, status: "healthy" },
  { id: "t7", name: "RAF Fylingdales", score: 13, status: "healthy" },
  { id: "t8", name: "Cheyenne Mountain", score: 24, status: "healthy" },
  { id: "t9", name: "Verizon 5G Ultra Edge", score: 22, status: "healthy" },
];

export function CyberDefendCascade() {
  const [activeTab, setActiveTab] = useState<"overview" | "firewall" | "alerts" | "attacks">("overview");
  const [selectedDc, setSelectedDc] = useState<string>("dc-1");
  const [selectedTower, setSelectedTower] = useState<string>("t1");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated Multi-spectral Wave (Chance of Failure)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const w = canvas.width;
    const h = canvas.height;

    const render = () => {
      t += 0.025;
      ctx.clearRect(0, 0, w, h);

      const isLight =
        document.documentElement.classList.contains("light") ||
        document.documentElement.getAttribute("data-theme") === "light";

      // Background Grid Lines
      ctx.strokeStyle = isLight
        ? "rgba(2, 132, 199, 0.08)"
        : "rgba(0, 245, 212, 0.05)";
      ctx.lineWidth = 1;
      for (let y = 10; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw 3 Oscillating Spectral Wave layers
      const waveConfigs = isLight
        ? [
            { amp: 18, freq: 0.015, speed: 1.0, color: "rgba(2, 132, 199, 0.9)", width: 2 },
            { amp: 12, freq: 0.025, speed: -1.2, color: "rgba(14, 165, 233, 0.75)", width: 1.5 },
            { amp: 22, freq: 0.012, speed: 0.8, color: "rgba(225, 29, 72, 0.75)", width: 1.5 },
          ]
        : [
            { amp: 18, freq: 0.015, speed: 1.0, color: "rgba(0, 245, 212, 0.7)", width: 2 },
            { amp: 12, freq: 0.025, speed: -1.2, color: "rgba(0, 180, 216, 0.5)", width: 1.5 },
            { amp: 22, freq: 0.012, speed: 0.8, color: "rgba(255, 0, 85, 0.4)", width: 1.5 },
          ];

      waveConfigs.forEach((wc) => {
        ctx.beginPath();
        ctx.strokeStyle = wc.color;
        ctx.lineWidth = wc.width;

        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * wc.freq + t * wc.speed) * wc.amp * Math.cos(t * 0.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hud-bracket-container w-full bg-white dark:bg-[#050b12] text-slate-800 dark:text-[#d6e5ea] border border-border dark:border-[#1b2b3d] p-4 sm:p-6 my-8 font-mono select-none shadow-xl transition-colors">
      <span className="hud-bracket-tr" />
      <span className="hud-bracket-bl" />

      {/* Top Header matching Image 3 (CYBERDEFEND) */}
      <div className="flex flex-wrap items-center justify-between border-b border-border dark:border-[#1b2b3d] pb-4 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center border border-primary dark:border-[#00f5d4] bg-primary/10 dark:bg-[#00f5d4]/10 text-primary dark:text-[#00f5d4]">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-widest text-slate-900 dark:text-[#f0f6fc] uppercase">
            CYBERDEFEND // ARGUS-TELEMETRY
          </span>
        </div>

        {/* Navigation Pills */}
        <div className="flex items-center border border-border dark:border-[#1b2b3d] bg-slate-100 dark:bg-[#08121f] p-1 text-xs">
          {(["overview", "firewall", "alerts", "attacks"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white dark:bg-[#112338] text-primary dark:text-[#00f5d4] border border-border dark:border-[#00f5d4]/40 font-bold shadow-xs"
                  : "text-slate-600 dark:text-[#718b9e] hover:text-slate-900 dark:hover:text-[#c4d6e4]"
              }`}
            >
              {tab === "overview" && "• "}
              {tab}
            </button>
          ))}
        </div>

        {/* Right Tools Icons */}
        <div className="flex items-center gap-2 text-slate-500 dark:text-[#718b9e]">
          <button className="p-1.5 hover:text-primary dark:hover:text-[#00f5d4] transition-colors cursor-pointer" title="Telemetry settings">
            <Sliders className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:text-primary dark:hover:text-[#00f5d4] transition-colors cursor-pointer" title="Configuration">
            <Settings className="h-4 w-4" />
          </button>
          <button className="relative p-1.5 hover:text-[#ff0055] transition-colors cursor-pointer" title="Active alerts">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#ff0055]" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (Image 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ════════════ LEFT COLUMN (6 cols): Data Centers & Towers & Spectral Wave ════════════ */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Top Section: Data Centers -> Spline Links -> Towers */}
          <div className="relative grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Left side: DATA CENTERS (6 cols) */}
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#718b9e] uppercase border-b border-border dark:border-[#1b2b3d] pb-1">
                <span>DATA CENTERS (PROBES)</span>
                <span>STATUS</span>
              </div>

              {DATA_CENTERS.map((dc) => (
                <div
                  key={dc.id}
                  onClick={() => setSelectedDc(dc.id)}
                  className={`border p-3 cursor-pointer transition-all ${
                    selectedDc === dc.id
                      ? "border-primary dark:border-[#00f5d4]/60 bg-sky-50 dark:bg-[#091524] shadow-sm"
                      : "border-border dark:border-[#192738] bg-slate-50 dark:bg-[#07111c] hover:border-slate-300 dark:hover:border-[#2b415a]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-[#e1ebf0]">
                      <span>{dc.flag}</span> {dc.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-[#718b9e]">{dc.bandwidth}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-[#718b9e] mb-2">
                    {dc.detections} detections
                  </div>

                  {/* Striped Threat Meters (Image 3 Aesthetic) */}
                  <div className="space-y-1.5 text-[9px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#ff0055] font-semibold">{dc.malicious}% Malicious</span>
                      <div className="h-1.5 w-24 bg-slate-200 dark:bg-[#142232] overflow-hidden">
                        <div
                          className="h-full bg-[#ff0055]"
                          style={{ width: `${dc.malicious}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-amber-600 dark:text-[#ffb703] font-semibold">{dc.suspicious}% Suspicious</span>
                      <div className="h-1.5 w-24 bg-slate-200 dark:bg-[#142232] overflow-hidden">
                        <div
                          className="h-full bg-amber-600 dark:bg-[#ffb703]"
                          style={{ width: `${dc.suspicious}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-emerald-600 dark:text-[#00f5d4] font-semibold">{dc.resolved}% Resolved</span>
                      <div className="h-1.5 w-24 bg-slate-200 dark:bg-[#142232] overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 dark:bg-[#00f5d4]"
                          style={{ width: `${dc.resolved}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side: TOWERS & RELAYS (6 cols) */}
            <div className="md:col-span-6 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#718b9e] uppercase border-b border-border dark:border-[#1b2b3d] pb-1">
                <span>TOWERS / RELAYS</span>
                <span>RISK</span>
              </div>

              <div className="space-y-1 max-h-[290px] overflow-y-auto pr-1">
                {TOWERS.map((tow) => (
                  <div
                    key={tow.id}
                    onClick={() => setSelectedTower(tow.id)}
                    className={`flex items-center justify-between border px-2.5 py-1.5 text-[11px] cursor-pointer transition-all ${
                      selectedTower === tow.id
                        ? "border-primary dark:border-[#00f5d4]/60 bg-sky-50 dark:bg-[#091524] text-primary dark:text-[#00f5d4]"
                        : "border-border dark:border-[#142232] bg-slate-50 dark:bg-[#07111c] text-slate-700 dark:text-[#8ea7bb] hover:border-slate-300 dark:hover:border-[#21354b]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <Wifi className="h-3 w-3 text-slate-400 dark:text-[#718b9e]" />
                      <span className="truncate">{tow.name}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 ${
                        tow.score > 70
                          ? "text-red-600 dark:text-[#ff0055]"
                          : tow.score > 30
                          ? "text-amber-600 dark:text-[#ffb703]"
                          : "text-emerald-600 dark:text-[#00f5d4]"
                      }`}
                    >
                      • {tow.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Card: CHANCE OF FAILURE (Spectrogram Multi-spectral Wave) */}
          <div className="border border-border dark:border-[#192738] bg-slate-50/70 dark:bg-[#07111c] p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-slate-900 dark:text-[#e1ebf0] uppercase">
                  CHANCE OF FAILURE (MULTI-SPECTRAL)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#718b9e]">RFC DRIFT FREQUENCY</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-[#718b9e]">
                <span>• ST 983</span>
                <span>• VYG1</span>
                <span>• ST 478</span>
              </div>
            </div>

            {/* Canvas Luminous Wave */}
            <div className="relative h-28 w-full bg-white dark:bg-[#040810] border border-border dark:border-[#142232] overflow-hidden flex items-center justify-center shadow-xs">
              <canvas
                ref={canvasRef}
                width={500}
                height={112}
                className="w-full h-full"
              />
            </div>

            {/* Timeline Dates Marker */}
            <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-[#556e82] pt-2 border-t border-border dark:border-[#142232]/60 font-mono">
              <span>11/01</span>
              <span>11/03</span>
              <span>11/05</span>
              <span>11/07</span>
              <span>11/09</span>
              <span>11/11</span>
              <span>11/13</span>
              <span>11/15</span>
            </div>
          </div>
        </div>

        {/* ════════════ RIGHT COLUMN (6 cols): ANOMALY DETECTION CASCADE ════════════ */}
        <div className="lg:col-span-6 border border-border dark:border-[#192738] bg-slate-50/70 dark:bg-[#07111c] p-4 flex flex-col justify-between">
          <div>
            {/* Header with Months */}
            <div className="flex items-center justify-between border-b border-border dark:border-[#1b2b3d] pb-2 text-[10px] text-slate-500 dark:text-[#718b9e]">
              <span className="font-bold text-slate-900 dark:text-[#e1ebf0] uppercase">ANOMALY DETECTION CASCADE</span>
              <div className="flex gap-2 text-[9px]">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
                  <span key={m} className={m === "Oct" ? "text-primary dark:text-[#00f5d4] font-bold" : ""}>
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Satellites / Scanners row */}
            <div className="flex items-center justify-around text-[10px] text-[#718b9e] pt-3 pb-1">
              <span className="border border-[#00f5d4]/40 bg-[#00f5d4]/10 px-2 py-0.5 text-[#00f5d4]">
                ST-983 (DNS SCAN)
              </span>
              <span className="border border-[#ffb703]/40 bg-[#ffb703]/10 px-2 py-0.5 text-[#ffb703]">
                VYG1 (TLS AUDIT)
              </span>
              <span className="border border-[#00b4d8]/40 bg-[#00b4d8]/10 px-2 py-0.5 text-[#00b4d8]">
                ST-156 (PORT MAP)
              </span>
            </div>

            {/* Fiber Optic Downlink SVG Stream (Image 3 Right Diagram) */}
            <div className="relative py-2">
              <svg
                viewBox="0 0 450 280"
                className="w-full h-auto overflow-visible"
              >
                {/* Streaming fiber spline threads */}
                {/* Thread 1 (Cyan) */}
                <path
                  d="M 120 10 C 130 90, 80 180, 70 260"
                  fill="none"
                  stroke="#00f5d4"
                  strokeWidth="1.4"
                  strokeOpacity="0.7"
                />
                <path
                  d="M 140 10 C 160 80, 110 170, 95 260"
                  fill="none"
                  stroke="#00f5d4"
                  strokeWidth="1"
                  strokeOpacity="0.5"
                />
                {/* Thread 2 (Threat Red / Coral) */}
                <path
                  d="M 220 10 C 240 70, 310 160, 320 260"
                  fill="none"
                  stroke="#ff0055"
                  strokeWidth="1.8"
                  strokeOpacity="0.85"
                />
                <path
                  d="M 230 10 C 260 90, 340 170, 350 260"
                  fill="none"
                  stroke="#ff0055"
                  strokeWidth="1.2"
                  strokeDasharray="4,4"
                  strokeOpacity="0.7"
                />
                {/* Thread 3 (Blue / Gray) */}
                <path
                  d="M 320 10 C 310 80, 240 160, 210 260"
                  fill="none"
                  stroke="#00b4d8"
                  strokeWidth="1"
                  strokeOpacity="0.6"
                />
                <path
                  d="M 340 10 C 330 90, 250 170, 225 260"
                  fill="none"
                  stroke="#486581"
                  strokeWidth="1"
                  strokeOpacity="0.5"
                />

                {/* Endpoint Targets */}
                <circle cx="70" cy="260" r="3" fill="#00f5d4" />
                <circle cx="95" cy="260" r="2.5" fill="#00f5d4" />
                <circle cx="210" cy="260" r="2.5" fill="#00b4d8" />
                <circle cx="225" cy="260" r="2.5" fill="#486581" />
                <circle cx="320" cy="260" r="3" fill="#ff0055" />
                <circle cx="320" cy="260" r="3" fill="none" stroke="#ff0055" strokeWidth="1">
                  <animate attributeName="r" values="3;8" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="350" cy="260" r="2.5" fill="#ff0055" />

                {/* Floating Telemetry Callout Box (Image 3 Style) */}
                <g transform="translate(190, 45)">
                  <rect
                    width="180"
                    height="95"
                    className="fill-white dark:fill-[#050e18] stroke-slate-300 dark:stroke-[#1d3550] shadow-md"
                    strokeWidth="1"
                    rx="3"
                  />
                  <text x="12" y="20" className="fill-primary dark:fill-[#00f5d4]" fontSize="10" fontWeight="bold">
                    ANOMALY DETECTION
                  </text>
                  <text x="12" y="38" className="fill-slate-600 dark:fill-[#718b9e]" fontSize="8.5">
                    Service availability: <tspan className="fill-slate-900 dark:fill-[#e1ebf0]" fontWeight="bold">29.3%</tspan>
                  </text>
                  <text x="12" y="54" className="fill-slate-600 dark:fill-[#718b9e]" fontSize="8.5">
                    P95 resolution: <tspan className="fill-slate-900 dark:fill-[#e1ebf0]" fontWeight="bold">44 MHz / ms</tspan>
                  </text>
                  <text x="12" y="70" className="fill-slate-600 dark:fill-[#718b9e]" fontSize="8.5">
                    Overload (24h): <tspan className="fill-amber-600 dark:fill-[#ffb703]" fontWeight="bold">41 min</tspan>
                  </text>
                  <text x="12" y="86" className="fill-slate-600 dark:fill-[#718b9e]" fontSize="8.5">
                    Active alerts: <tspan className="fill-red-600 dark:fill-[#ff0055]" fontWeight="bold">+34</tspan>
                  </text>
                </g>
              </svg>
            </div>

            {/* City Downlink Telemetry Labels */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-slate-500 dark:text-[#718b9e] pt-2 border-t border-border dark:border-[#1b2b3d]">
              <div>
                <strong className="text-slate-900 dark:text-[#e1ebf0]">Los Angeles, CA</strong>
                <div className="text-[8.5px] text-slate-400 dark:text-[#556e82]">Downlink 23-02-01T 13:43:18</div>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-[#e1ebf0]">San Francisco, CA</strong>
                <div className="text-[8.5px] text-slate-400 dark:text-[#556e82]">Downlink 22-11-02T 16:08:15</div>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-[#e1ebf0]">New York, NY</strong>
                <div className="text-[8.5px] text-slate-400 dark:text-[#556e82]">Downlink 22-11-02T 05:53:15</div>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-[#e1ebf0]">Houston, TX</strong>
                <div className="text-[8.5px] text-slate-400 dark:text-[#556e82]">Downlink 22-11-02T 19:28:15</div>
              </div>
              <div>
                <strong className="text-primary dark:text-[#00f5d4]">Starlink-156</strong>
                <div className="text-[8.5px] text-slate-400 dark:text-[#556e82]">Orbit Geo-Sync</div>
              </div>
              <div>
                <strong className="text-sky-600 dark:text-[#00b4d8]">Voyager 1 Relay</strong>
                <div className="text-[8.5px] text-slate-400 dark:text-[#556e82]">Deep Perimeter Node</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

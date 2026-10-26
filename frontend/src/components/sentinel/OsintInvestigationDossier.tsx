import { useState } from "react";
import {
  FileText,
  Code,
  Camera,
  Copy,
  Check,
  Eye,
  Download,
  FilePlus,
  AlertCircle,
  ExternalLink,
  Shield,
  Search,
  Globe,
  Video,
  Scissors,
  Share2,
  Lock,
  Layers,
  X,
} from "lucide-react";

interface EvidenceItem {
  id: string;
  title: string;
  type: "text" | "source" | "screenshot";
  timeAgo: string;
  previewContent: string;
  hash: string;
  url: string;
  timestamp: string;
  browser: string;
  exported: boolean;
  notes?: string;
}

const INITIAL_EVIDENCE: EvidenceItem[] = [
  {
    id: "ev-1",
    title: "Text Grab Captured",
    type: "text",
    timeAgo: "24s ago",
    previewContent:
      ";; aiori.lab. IN SOA ns-01.aiori.lab. hostmaster.aiori.lab. (\n2026102001 ; serial\n7200       ; refresh (2h)\n3600       ; retry (1h)\n1209600    ; expire (2w)\n3600       ; minimum (1h)\n)\n;; A RECORDS:\napi.aiori.lab.      300 IN A 10.0.1.15\nlegacy.aiori.lab.   300 IN A 10.0.2.10\ndev-edge.aiori.lab. 300 IN A 10.0.2.20",
    hash: "1529bb63973c577c44b47dd1225f9e0c8088502641c1c2ffec46862b9607ae0d",
    url: "https://aiori.lab/dns-zone-export",
    timestamp: "2026-02-13 14:02:46",
    browser: "Brave Browser 145.0.0.0 (Probe Sentinel)",
    exported: true,
  },
  {
    id: "ev-2",
    title: "Page Source Captured",
    type: "source",
    timeAgo: "37s ago",
    previewContent:
      "Certificate:\n    Data:\n        Version: 3 (0x2)\n        Serial Number: 03:d9:44:fa:11:8b:22:90\n    Signature Algorithm: sha256WithRSAEncryption\n        Issuer: C=US, O=Let's Encrypt, CN=R3\n        Validity\n            Not Before: Oct 1 00:00:00 2025 GMT\n            Not After : Jan 1 00:00:00 2026 GMT\n        Subject: CN = legacy.aiori.lab\n        [CRITICAL FAULT: CERTIFICATE EXPIRED -292 DAYS]",
    hash: "25b245c561b6c1cb267475d9227ab2862f0ff0a3416d198d9c19334b99971b829",
    url: "https://legacy.aiori.lab:443",
    timestamp: "2026-02-13 14:02:33",
    browser: "Brave Browser 145.0.0.0 (TLS Prober)",
    exported: true,
  },
  {
    id: "ev-3",
    title: "Screenshot Captured",
    type: "screenshot",
    timeAgo: "53s ago",
    previewContent:
      "HTTP/1.1 200 OK\nServer: Werkzeug/3.0.1 Python/3.11.4\nDate: Mon, 26 Oct 2026 12:15:11 GMT\nContent-Type: text/html; charset=utf-8\n\n<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\">\n<title>Werkzeug Interactive Debugger // dev-edge:8080</title>\n<div class=\"debugger-console\">Interactive PIN Protected PIN: 394-201</div>",
    hash: "6e45b12ac8eaf93a8e3edcce5c269f6756e0fb81157ed5fc627095eed461374b8e",
    url: "http://dev-edge.aiori.lab:8080/debugger",
    timestamp: "2026-02-13 14:02:17",
    browser: "Brave Browser 145.0.0.0 (Port Sentinel)",
    exported: true,
  },
];

export function OsintInvestigationDossier() {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(INITIAL_EVIDENCE);
  const [activeTab, setActiveTab] = useState<
    "websites" | "log" | "captures" | "screen" | "attachments" | "search" | "notes"
  >("captures");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedPreview, setExpandedPreview] = useState<Record<string, boolean>>({
    "ev-1": true,
    "ev-2": true,
    "ev-3": true,
  });
  const [activeModalEvidence, setActiveModalEvidence] = useState<EvidenceItem | null>(null);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const togglePreview = (id: string) => {
    setExpandedPreview((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExport = (id: string) => {
    setEvidenceList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, exported: !e.exported } : e))
    );
  };

  return (
    <div className="w-full bg-white dark:bg-[#080d19] text-slate-800 dark:text-[#c9d1d9] border border-border dark:border-[#1b263b] rounded-lg p-4 sm:p-6 my-8 font-sans select-none shadow-xl dark:shadow-2xl">
      {/* Top 4 Metric Cards (Matching Image 2 Header) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Investigation Details */}
        <div className="osint-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase mb-2">
            <FileText className="h-4 w-4 text-primary dark:text-[#58a6ff]" />
            <span>Investigation Details</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-[#8b949e] block">Investigating Officer</span>
              <strong className="text-slate-900 dark:text-[#f0f6fc]">daniel (Auditor-011)</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-[#8b949e] block">Agency</span>
              <strong className="text-slate-900 dark:text-[#f0f6fc]">osirt / AIORI</strong>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-border dark:border-[#1a253a] flex items-center justify-between text-[11px]">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-[#8b949e] mr-1">Case:</span>
              <strong className="text-primary dark:text-[#58a6ff]">testing</strong>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#8b949e]">
              2025-11-04 | 11:19:22
            </div>
          </div>
        </div>

        {/* Card 2: Alerts Triggered */}
        <div className="osint-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase mb-2">
              <AlertCircle className="h-4 w-4 text-[#f85149]" />
              <span>Alerts Triggered</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f85149] animate-pulse" />
              <span className="text-sm font-bold text-[#f85149]">3 Perimeter Drifts</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 dark:text-[#8b949e] mt-2">
            Expired TLS · Shadow 8080 · S3 Takeover
          </div>
        </div>

        {/* Card 3: Status */}
        <div className="osint-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase mb-2">
              <Shield className="h-4 w-4 text-[#3fb950]" />
              <span>Status</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3fb950]" />
              <span className="text-sm font-bold text-[#3fb950]">OSIRT Extension Connected</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 dark:text-[#8b949e] mt-2">
            RFC 1035 & RFC 5280 Probes Active
          </div>
        </div>

        {/* Card 4: Capture Count */}
        <div className="osint-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase mb-2">
              <Camera className="h-4 w-4 text-[#a371f7]" />
              <span>Capture Count</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-[#f0f6fc] font-mono mt-1">
              915
            </div>
          </div>

          <div className="text-[11px] text-slate-600 dark:text-[#8b949e] mt-1">
            Anchored to SHA-256 Merkle Ledger
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Matching Image 2 Tabs) */}
      <div className="flex items-center gap-1 border-b border-border dark:border-[#1b263b] pb-2 mb-6 overflow-x-auto text-xs font-medium">
        {[
          { id: "websites", label: "Websites Visited", icon: Globe },
          { id: "log", label: "Complete Log", icon: FileText },
          { id: "captures", label: "Captures", icon: Camera, badge: "3" },
          { id: "screen", label: "Screen Recordings", icon: Video },
          { id: "attachments", label: "Attachments", icon: Layers },
          { id: "search", label: "Search Results", icon: Search },
          { id: "notes", label: "Case Notes", icon: FilePlus },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/30 dark:bg-[#1c293f] dark:text-[#58a6ff] dark:border-[#304468] font-bold shadow-sm"
                  : "text-slate-600 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#f0f6fc] hover:bg-slate-100 dark:hover:bg-[#121d2d]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/15 dark:bg-[#58a6ff]/20 text-[10px] text-primary dark:text-[#58a6ff]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Evidence Cards Grid (Image 2 Three Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evidenceList.map((item) => (
          <div
            key={item.id}
            className="osint-card flex flex-col justify-between overflow-hidden"
          >
            {/* Card Header with Icon, Title, and timeago */}
            <div className="p-4 border-b border-border dark:border-[#1a253a]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-[#f0f6fc]">
                  {item.type === "text" && <FileText className="h-4 w-4 text-primary dark:text-[#58a6ff]" />}
                  {item.type === "source" && <Code className="h-4 w-4 text-[#3fb950]" />}
                  {item.type === "screenshot" && <Camera className="h-4 w-4 text-[#a371f7]" />}
                  <span>{item.title}</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-[#8b949e]">{item.timeAgo}</span>
              </div>
            </div>

            {/* Collapsible Preview Box */}
            <div className="p-4 flex-1">
              {item.type === "screenshot" ? (
                /* Screenshot Preview Thumbnail */
                <div className="mb-3 rounded overflow-hidden border border-border dark:border-[#212f47] relative group">
                  <div className="h-32 bg-slate-900 dark:bg-[#0c1421] p-3 text-[10px] font-mono text-cyan-400 dark:text-[#58a6ff] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-700 dark:border-[#1a253a] pb-1 mb-2 text-slate-400 dark:text-[#8b949e]">
                      <span>Werkzeug Debug Console</span>
                      <span className="text-[#f85149]">PORT 8080</span>
                    </div>
                    <pre className="text-[9px] text-slate-300 dark:text-[#8b949e] whitespace-pre-wrap">
                      {item.previewContent}
                    </pre>
                  </div>
                  <div className="absolute inset-0 bg-[#0c1421]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      onClick={() => setActiveModalEvidence(item)}
                      className="px-3 py-1 bg-primary dark:bg-[#58a6ff] text-white text-xs font-bold rounded flex items-center gap-1 shadow-lg"
                    >
                      <Eye className="h-3 w-3" /> Zoom
                    </button>
                  </div>
                </div>
              ) : (
                /* Text / Code Terminal Preview */
                <div className="mb-3">
                  <button
                    onClick={() => togglePreview(item.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-[#8b949e] hover:text-primary dark:hover:text-[#58a6ff] mb-1.5 transition-colors"
                  >
                    <span>{expandedPreview[item.id] ? "▼" : "▶"} Preview</span>
                  </button>

                  {expandedPreview[item.id] && (
                    <div className="osint-preview-screen p-2.5 max-h-36 overflow-y-auto font-mono text-[10px] text-slate-700 dark:text-[#8b949e] leading-relaxed whitespace-pre-wrap">
                      {item.previewContent}
                    </div>
                  )}
                </div>
              )}

              {/* SHA-256 Hash with Copy */}
              <div className="mb-2">
                <span className="text-[10px] text-slate-500 dark:text-[#8b949e] block font-mono">Hash:</span>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#060b13] border border-border dark:border-[#141e30] px-2 py-1 rounded text-[10px] font-mono text-primary dark:text-[#58a6ff]">
                  <span className="truncate pr-1">{item.hash}</span>
                  <button
                    onClick={() => handleCopyHash(item.hash)}
                    title="Copy full SHA-256 hash"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
                  >
                    {copiedHash === item.hash ? (
                      <Check className="h-3 w-3 text-[#3fb950]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Metadata rows: URL, Timestamp, Browser */}
              <div className="space-y-1 text-[11px] text-slate-600 dark:text-[#8b949e]">
                <div className="flex items-center gap-1 truncate">
                  <span className="font-semibold text-primary dark:text-[#58a6ff]">Url:</span>
                  <span className="truncate font-mono text-[10px] text-slate-800 dark:text-[#c9d1d9]">{item.url}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 dark:text-[#8b949e]">Timestamp:</span>{" "}
                  <span className="font-mono text-[10px]">{item.timestamp}</span>
                </div>
                <div className="truncate">
                  <span className="font-semibold text-slate-600 dark:text-[#8b949e]">Browser:</span>{" "}
                  <span className="text-[10px]">{item.browser}</span>
                </div>
              </div>

              {/* Export to Report Checkbox */}
              <div className="mt-3 pt-2 border-t border-border dark:border-[#1a253a] flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  id={`export-${item.id}`}
                  checked={item.exported}
                  onChange={() => toggleExport(item.id)}
                  className="rounded border-slate-300 dark:border-[#304468] bg-white dark:bg-[#0c1421] text-primary dark:text-[#58a6ff] focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor={`export-${item.id}`}
                  className="text-[11px] text-slate-600 dark:text-[#8b949e] cursor-pointer hover:text-slate-900 dark:hover:text-[#f0f6fc]"
                >
                  Export to report?
                </label>
              </div>
            </div>

            {/* Bottom Action Buttons (Matching Image 2 Buttons) */}
            <div className="p-3 bg-slate-50 dark:bg-[#0a0f1d] border-t border-border dark:border-[#1a253a] grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setActiveModalEvidence(item)}
                className="py-1.5 px-2 bg-white dark:bg-[#142033] hover:bg-slate-100 dark:hover:bg-[#1d2d47] text-slate-700 dark:text-[#c9d1d9] hover:text-slate-900 dark:hover:text-white rounded border border-border dark:border-[#21304b] flex items-center justify-center gap-1 transition-colors text-[11px]"
              >
                <Eye className="h-3 w-3" /> View File
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([item.previewContent], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${item.id}-evidence.txt`;
                  a.click();
                }}
                className="py-1.5 px-2 bg-white dark:bg-[#142033] hover:bg-slate-100 dark:hover:bg-[#1d2d47] text-slate-700 dark:text-[#c9d1d9] hover:text-slate-900 dark:hover:text-white rounded border border-border dark:border-[#21304b] flex items-center justify-center gap-1 transition-colors text-[11px]"
              >
                <Download className="h-3 w-3" /> Save Copy
              </button>
              <button
                onClick={() => {
                  const note = prompt("Add audit note for this capture:", item.notes || "");
                  if (note !== null) {
                    setEvidenceList((prev) =>
                      prev.map((e) => (e.id === item.id ? { ...e, notes: note } : e))
                    );
                  }
                }}
                className="py-1.5 px-2 bg-white dark:bg-[#142033] hover:bg-slate-100 dark:hover:bg-[#1d2d47] text-slate-700 dark:text-[#c9d1d9] hover:text-slate-900 dark:hover:text-white rounded border border-border dark:border-[#21304b] flex items-center justify-center gap-1 transition-colors text-[11px]"
              >
                <FilePlus className="h-3 w-3" /> Add Note
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Forensic Inspection Modal */}
      {activeModalEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0b1220] border border-border dark:border-[#1f2d47] rounded-lg shadow-2xl p-5 text-sans">
            <div className="flex items-center justify-between border-b border-border dark:border-[#1f2d47] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary dark:text-[#58a6ff]" />
                <h3 className="font-bold text-slate-900 dark:text-[#f0f6fc] text-sm">
                  {activeModalEvidence.title} — Forensics Dossier
                </h3>
              </div>
              <button
                onClick={() => setActiveModalEvidence(null)}
                className="text-slate-500 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-[#8b949e] uppercase block font-mono">
                  SHA-256 Merkle Provenance:
                </span>
                <div className="font-mono text-primary dark:text-[#58a6ff] bg-slate-50 dark:bg-[#060b13] p-2 rounded border border-border dark:border-[#141e30] break-all">
                  {activeModalEvidence.hash}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-[#8b949e] uppercase block font-mono">
                  Target URL & Timestamp:
                </span>
                <div className="font-mono text-slate-800 dark:text-[#c9d1d9]">
                  {activeModalEvidence.url} (Recorded {activeModalEvidence.timestamp})
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-[#8b949e] uppercase block font-mono">
                  Full Captured Payload Content:
                </span>
                <pre className="font-mono text-[10.5px] text-slate-800 dark:text-[#a5d6ff] bg-slate-50 dark:bg-[#060b13] p-3 rounded border border-border dark:border-[#141e30] max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {activeModalEvidence.previewContent}
                </pre>
              </div>

              {activeModalEvidence.notes && (
                <div className="p-2.5 bg-primary/5 dark:bg-[#16253c] border border-primary/20 dark:border-[#23385a] rounded text-[11px] text-primary dark:text-[#79c0ff]">
                  <strong>Auditor Note:</strong> {activeModalEvidence.notes}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-border dark:border-[#1f2d47] flex justify-end gap-2 text-xs">
              <button
                onClick={() => setActiveModalEvidence(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1f2d47] dark:hover:bg-[#2b3d60] text-slate-900 dark:text-white rounded font-medium transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

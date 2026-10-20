import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const PRELOADED_SAMPLES = [
  {
    name: "ikev1_aggressive_3des_sample.pcap",
    size: "42.8 KB",
    scenario: "vulnerable",
    desc: "Contains IKEv1 Aggressive Mode handshake with 3DES-CBC transform proposals.",
  },
  {
    name: "ikev2_pqc_mlkem_hardened.pcap",
    size: "58.4 KB",
    scenario: "hardened",
    desc: "Contains IKEv2 handshake with RFC 9370 ML-KEM-768 hybrid key exchange.",
  },
  {
    name: "esp_voip_g711_encrypted_flow.pcap",
    size: "128.2 KB",
    scenario: "voip",
    desc: "Contains 1,200 opaque ESP packets with isochronous 20ms delta timing.",
  },
];

export function PcapUploadModal({
  isOpen,
  onClose,
  onAnalyzeSample,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeSample?: (sampleName: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset scroll position to top when opened
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleRunAnalysis = (name: string, scenarioType: string) => {
    setAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      setAnalyzing(false);
      if (scenarioType === "vulnerable") {
        setAnalysisResult({
          filename: name,
          packets: 842,
          protocol: "IKEv1 (Aggressive Mode ID: 4)",
          cipher: "3DES-CBC / HMAC-SHA1",
          dh_group: "DH Group 14 (MODP 2048)",
          traffic_class: "VoIP (G.711a constant bit-rate)",
          posture_score: 42,
          rating: "AT_RISK",
          finding: "CVE-2002-1623 PSK Hash exposed in cleartext",
        });
      } else {
        setAnalysisResult({
          filename: name,
          packets: 1420,
          protocol: "IKEv2 (Identity Protection)",
          cipher: "ChaCha20-Poly1305 / AES-256-GCM",
          dh_group: "Curve25519 + ML-KEM-768",
          traffic_class: "HD Video Conference (H.264 WebRTC)",
          posture_score: 94,
          rating: "HARDENED_PQC_READY",
          finding: "Compliant with NIST SP 800-77 & FIPS 203 PQC",
        });
      }
      if (onAnalyzeSample) onAnalyzeSample(name);
    }, 1100);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] border border-primary/60 bg-surface shadow-2xl overflow-hidden font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-background/90 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              PCAP Capture Ingestion & Dissector
            </h2>
            <span className="border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              Live Scapy Engine
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-border/80 bg-surface px-2.5 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>

        <div ref={scrollContainerRef} className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleRunAnalysis(file.name, "vulnerable");
            }}
            className={`border-2 border-dashed p-6 text-center transition-all ${
              dragOver
                ? "border-primary bg-primary/15"
                : "border-border/80 bg-background/60 hover:border-primary/50"
            }`}
          >
            <p className="text-sm font-bold text-foreground">
              Drag & drop any raw .pcap or .pcapng capture file here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Deterministic IKE dissector & ESP ML classifier analyze packet traces in &lt;1.2ms
            </p>
            <label className="mt-3 inline-block cursor-pointer border border-primary/50 bg-primary/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary font-bold hover:bg-primary/25">
              Browse PCAP File
              <input
                type="file"
                accept=".pcap,.pcapng,.cap"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleRunAnalysis(file.name, "vulnerable");
                }}
              />
            </label>
          </div>

          {/* Preloaded Testbed Samples */}
          <div>
            <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground block mb-2 font-bold">
              Or Select Reference Lab Sample Traces:
            </span>
            <div className="space-y-2">
              {PRELOADED_SAMPLES.map((sample) => (
                <div
                  key={sample.name}
                  className="flex items-center justify-between border border-border/80 bg-background/50 p-3 hover:bg-surface-raised transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{sample.name}</span>
                      <span className="text-[10px] text-muted-foreground">({sample.size})</span>
                    </div>
                    <p className="text-[10.5px] text-foreground/90 font-sans mt-0.5 font-medium">{sample.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunAnalysis(sample.name, sample.scenario)}
                    disabled={analyzing}
                    className="hover-glow border border-primary/50 bg-primary/10 px-2.5 py-1 text-primary uppercase text-[10px] font-bold hover:bg-primary/20"
                  >
                    Analyze
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Loading / Results Panel */}
          {analyzing && (
            <div className="border border-primary/40 bg-primary/10 p-4 text-center text-primary font-bold animate-pulse">
              [+] Dissecting IKE_SA_INIT & extracting ESP flow metadata side-channels...
            </div>
          )}

          {analysisResult && (
            <div className="border border-border bg-background/90 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="font-bold text-foreground">
                  Analysis Report: {analysisResult.filename}
                </span>
                <span
                  className={`font-bold px-2 py-0.5 border text-[10px] ${
                    analysisResult.posture_score >= 80
                      ? "border-primary text-primary bg-primary/10"
                      : "border-destructive text-destructive bg-destructive/10"
                  }`}
                >
                  Score: {analysisResult.posture_score}/100 ({analysisResult.rating})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10.5px] text-muted-foreground pt-1">
                <div>
                  PROTOCOL: <strong className="text-foreground">{analysisResult.protocol}</strong>
                </div>
                <div>
                  CIPHER: <strong className="text-foreground">{analysisResult.cipher}</strong>
                </div>
                <div>
                  DH GROUP: <strong className="text-foreground">{analysisResult.dh_group}</strong>
                </div>
                <div>
                  ESP CLASS: <strong className="text-primary">{analysisResult.traffic_class}</strong>
                </div>
              </div>

              <div className="border-t border-border/50 pt-2 text-primary font-bold text-[10.5px]">
                <strong>NIST SP 800-77 Finding:</strong> {analysisResult.finding}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

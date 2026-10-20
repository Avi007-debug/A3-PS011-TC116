import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RefreshCw } from "lucide-react";
import { isSupabaseConfigured, fetchRecentReports } from "@/lib/supabase";

export function SupabaseSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(
    typeof window !== "undefined" ? localStorage.getItem("argus_supabase_url") || "" : ""
  );
  const [key, setKey] = useState(
    typeof window !== "undefined" ? localStorage.getItem("argus_supabase_anon_key") || "" : ""
  );
  const [saved, setSaved] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const data = await fetchRecentReports();
      setRecentReports(data || []);
    } catch {
      setRecentReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("argus_supabase_url", url.trim());
      localStorage.setItem("argus_supabase_anon_key", key.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        window.location.reload();
      }, 1000);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col w-full max-w-lg max-h-[85vh] border border-primary/60 bg-surface shadow-2xl overflow-hidden font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-background/90 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Supabase Cloud Bridge & Live Sync
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-border/80 bg-surface px-2.5 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-50px)]">
          <div className="border border-border bg-background/60 p-3 text-[11px] text-muted-foreground font-sans leading-relaxed">
            Status: <span className={isSupabaseConfigured ? "text-primary font-bold" : "text-amber-400 font-bold"}>
              {isSupabaseConfigured ? "CONNECTED TO POSTGRESQL CLUSTER" : "USING LOCALSTORAGE FALLBACK"}
            </span>.
            Real-time baseline snapshots and drift alerts sync here per PS-011 schema.
          </div>

          {/* Live Recent Snapshots Section */}
          <div className="border border-teal-500/30 bg-teal-950/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                Recent Perimeter Snapshots ({recentReports.length})
              </span>
              <button
                type="button"
                onClick={loadReports}
                disabled={loadingReports}
                className="flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-200 border border-teal-500/40 px-2 py-0.5 uppercase tracking-wider cursor-pointer"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${loadingReports ? "animate-spin" : ""}`} />
                <span>{loadingReports ? "PULLING..." : "REFRESH / PULL"}</span>
              </button>
            </div>

            {recentReports.length === 0 ? (
              <p className="text-[10.5px] text-muted-foreground italic py-1">
                No external snapshots connected. Local offline engine active (Score: 68/100).
              </p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {recentReports.slice(0, 3).map((r, i) => (
                  <div key={r.id || i} className="border border-border/80 bg-background/80 p-2 text-[10.5px] space-y-0.5">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>{r.snapshot_label || r.tunnel_name || "SNAP-T0-BASELINE"}</span>
                      <span className="text-primary">{r.hygiene_score || r.posture_score || 96}/100</span>
                    </div>
                    <div className="text-muted-foreground flex justify-between">
                      <span>{r.merkle_root ? r.merkle_root.slice(0, 16) + "..." : "SHA-256 Merkle"}</span>
                      <span>{r.created_at ? new Date(r.created_at).toLocaleTimeString() : "Just now"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-muted-foreground text-[10.5px] uppercase tracking-wider mb-1 font-bold">
              Supabase Project URL:
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project-ref.supabase.co"
              className="w-full border border-border/80 bg-background/80 p-2.5 font-mono text-xs text-primary outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-muted-foreground text-[10.5px] uppercase tracking-wider mb-1 font-bold">
              Supabase Anon Public Key:
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full border border-border/80 bg-background/80 p-2.5 font-mono text-xs text-primary outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="hover-glow w-full border border-primary/70 bg-primary/20 py-2.5 font-mono text-xs uppercase tracking-widest text-primary font-bold hover:bg-primary/30 transition-all cursor-pointer"
            >
              {saved ? "CREDENTIALS SAVED! RELOADING..." : "Connect & Save to LocalStorage"}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Database Schema available at: <strong className="text-primary">supabase/schema.sql</strong>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/sentinel/Nav";
import { TacticalCyberHud } from "@/components/sentinel/TacticalCyberHud";
import { CyberDefendCascade } from "@/components/sentinel/CyberDefendCascade";
import { OsintInvestigationDossier } from "@/components/sentinel/OsintInvestigationDossier";
import { Footer } from "@/components/sentinel/Footer";
import { CliTerminalModal } from "@/components/sentinel/CliTerminalModal";
import { JudgeDefenseModal } from "@/components/sentinel/JudgeDefenseModal";
import { SupabaseSettingsModal } from "@/components/sentinel/SupabaseSettingsModal";
import { Shield, Radio, Layers, Activity } from "lucide-react";

export const Route = createFileRoute("/soc")({
  head: () => ({
    meta: [
      { title: "Tactical SOC Cyber HUD | ArgusASM Security Operations Center" },
      {
        name: "description",
        content:
          "Autonomous Security Operations Center (SOC) for ArgusASM: Interactive spider radar indicators, radial attack-surface map, global threat traffic arcs, downlink cascade, and forensic evidence.",
      },
    ],
  }),
  component: SocPage,
});

function SocPage() {
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [isQaOpen, setIsQaOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [activeCliCmd, setActiveCliCmd] = useState<string | undefined>(undefined);
  const [activeView, setActiveView] = useState<"hud" | "cascade" | "osint">("hud");

  const handleOpenCliWithCmd = (cmd?: string) => {
    setActiveCliCmd(cmd);
    setIsCliOpen(true);
  };

  return (
    <div className="page-enter min-h-screen bg-slate-50 dark:bg-[#030708] text-foreground selection:bg-primary/30 dark:selection:bg-[#00f5d4]/30 selection:text-primary dark:selection:text-[#00f5d4] transition-colors">
      <Nav
        onOpenCli={() => handleOpenCliWithCmd()}
        onOpenQa={() => setIsQaOpen(true)}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
      />

      <main className="pt-24 pb-16">
        {/* SOC Dedicated Page Header */}
        <div className="border-b border-border dark:border-[#00f5d4]/20 bg-white/95 dark:bg-[#040e14]/80 px-4 py-8 sm:px-8 lg:px-12 backdrop-blur-md transition-colors">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary dark:text-[#00f5d4] mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary dark:bg-[#00f5d4] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary dark:bg-[#00f5d4]" />
                  </span>
                  <span>Autonomous SOC Facility</span>
                  <span>/</span>
                  <span className="font-bold">PS-011 Cyber Defense Console</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-mono tracking-tight text-foreground dark:text-white">
                  Security Operations Center (SOC)
                </h1>

                <p className="mt-2 max-w-3xl text-sm sm:text-base leading-relaxed text-muted-foreground dark:text-[#8ea8a7] font-sans">
                  Real-time attack-surface vector monitoring, interactive radial network telemetry, global probe traffic mapping, and cryptographic forensic verification.
                </p>
              </div>

              {/* View Mode Switcher Pills */}
              <div className="flex items-center border border-border dark:border-[#00f5d4]/40 bg-slate-100 dark:bg-[#06121a] p-1 font-mono text-xs">
                <button
                  onClick={() => setActiveView("hud")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 transition-all uppercase tracking-wider text-xs cursor-pointer ${
                    activeView === "hud"
                      ? "bg-primary dark:bg-[#00f5d4] text-white dark:text-black font-bold shadow-[0_0_12px_rgba(2,132,199,0.3)] dark:shadow-[0_0_12px_rgba(0,245,212,0.5)]"
                      : "text-muted-foreground dark:text-[#719694] hover:text-primary dark:hover:text-[#00f5d4]"
                  }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>[01] Tactical HUD</span>
                </button>
                <button
                  onClick={() => setActiveView("cascade")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 transition-all uppercase tracking-wider text-xs cursor-pointer ${
                    activeView === "cascade"
                      ? "bg-primary dark:bg-[#00f5d4] text-white dark:text-black font-bold shadow-[0_0_12px_rgba(2,132,199,0.3)] dark:shadow-[0_0_12px_rgba(0,245,212,0.5)]"
                      : "text-muted-foreground dark:text-[#719694] hover:text-primary dark:hover:text-[#00f5d4]"
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>[02] Downlink Cascade</span>
                </button>
                <button
                  onClick={() => setActiveView("osint")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 transition-all uppercase tracking-wider text-xs cursor-pointer ${
                    activeView === "osint"
                      ? "bg-primary dark:bg-[#00f5d4] text-white dark:text-black font-bold shadow-[0_0_12px_rgba(2,132,199,0.3)] dark:shadow-[0_0_12px_rgba(0,245,212,0.5)]"
                      : "text-muted-foreground dark:text-[#719694] hover:text-primary dark:hover:text-[#00f5d4]"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>[03] OSINT Forensics</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Console View Rendering */}
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 mt-6">
          {activeView === "hud" && <TacticalCyberHud />}
          {activeView === "cascade" && <CyberDefendCascade />}
          {activeView === "osint" && <OsintInvestigationDossier />}
        </div>
      </main>

      <Footer />

      {/* Interactive Modals */}
      <CliTerminalModal
        isOpen={isCliOpen}
        onClose={() => setIsCliOpen(false)}
        initialCmd={activeCliCmd}
      />

      <JudgeDefenseModal
        open={isQaOpen}
        onClose={() => setIsQaOpen(false)}
      />

      <SupabaseSettingsModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
      />
    </div>
  );
}

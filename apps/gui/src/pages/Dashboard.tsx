import { useMemo } from "react";
import { t, type Locale } from "../i18n";
import { StatCard } from "../components/StatCard";
import { Sparkline } from "../components/Sparkline";
import { ProcessTable } from "../components/ProcessTable";
import type { SystemSnapshot } from "../types";

interface DashboardProps {
  snapshot: SystemSnapshot | null;
  locale: Locale;
  onViewAll: () => void;
}

export function Dashboard({ snapshot, locale, onViewAll }: DashboardProps) {

  const topProcesses = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.processes.slice(0, 5);
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center text-slate-600">
        <p>Connecting to system monitor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title={t(locale, "cpu")}
          value={`${snapshot.cpu_usage_pct.toFixed(1)}%`}
          percentage={snapshot.cpu_usage_pct}
        />
        <StatCard
          title={t(locale, "memory")}
          value={`${snapshot.memory_used_gb.toFixed(1)} GB`}
          subValue={`/ ${snapshot.memory_total_gb.toFixed(0)} GB`}
          percentage={snapshot.memory_usage_pct}
        />
        <StatCard
          title={t(locale, "disk")}
          value={`${snapshot.disk_usage_pct.toFixed(1)}%`}
          percentage={snapshot.disk_usage_pct}
        />
      </div>

      {/* CPU History sparkline */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-400">{t(locale, "cpuHistory")}</h3>
        <Sparkline data={snapshot.cpu_history} />
      </div>

      {/* Top 5 processes */}
      <ProcessTable processes={topProcesses} maxRows={5} onViewAll={onViewAll} />
    </div>
  );
}

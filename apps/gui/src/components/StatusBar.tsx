import { t, type Locale } from "../i18n";
import type { RefreshInterval } from "../App";

interface StatusBarProps {
  isRefreshing: boolean;
  refreshInterval: RefreshInterval;
  onIntervalCycle: () => void;
  timestamp: string;
  error: string | null;
  locale: Locale;
}

export function StatusBar({
  isRefreshing,
  refreshInterval,
  onIntervalCycle,
  timestamp,
  error,
  locale,
}: StatusBarProps) {
  return (
    <footer className={`flex items-center gap-4 border-t px-4 py-1 text-xs transition-colors ${
      isRefreshing ? "border-yellow-800 bg-yellow-900/20 text-yellow-400" : "border-slate-800 bg-slate-900 text-slate-400"
    }`}>
      <span>{isRefreshing ? "⟳" : "●"}</span>
      <span>{isRefreshing ? t(locale, "refreshing") : t(locale, "idle")}</span>
      <span className="text-slate-600">│</span>
      <button onClick={onIntervalCycle} className="hover:text-slate-200 transition-colors">
        {t(locale, "refresh")}: {refreshInterval}s
      </button>
      <span className="text-slate-600">│</span>
      <span>{locale.toUpperCase()}</span>
      <span className="text-slate-600">│</span>
      <span>{timestamp}</span>
      {error && (
        <>
          <span className="text-slate-600">│</span>
          <span className="text-red-400">{error}</span>
        </>
      )}
    </footer>
  );
}

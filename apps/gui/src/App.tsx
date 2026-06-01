import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useSystemSnapshot } from "./hooks/useSystemSnapshot";
import { getLocale, t, toggleLocale, type Locale } from "./i18n";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import { Dashboard } from "./pages/Dashboard";
import { Processes } from "./pages/Processes";
import { About } from "./pages/About";
import type { ProcessInfo } from "./types";

export type RefreshInterval = 1 | 2 | 5;

export default function App() {
  const [demoMode] = useState(() => new URLSearchParams(window.location.search).has("demo"));
  const [locale, setLocale] = useState<Locale>(getLocale);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { snapshot, error } = useSystemSnapshot(demoMode, refreshInterval * 1000);

  useEffect(() => {
    setIsRefreshing(true);
    const id = setTimeout(() => setIsRefreshing(false), 300);
    return () => clearTimeout(id);
  }, [snapshot]);

  const handleToggleLang = useCallback(() => {
    setLocale(toggleLocale);
  }, []);

  const handleCycleInterval = useCallback(() => {
    setRefreshInterval((prev) => (prev === 1 ? 2 : prev === 2 ? 5 : 1));
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.replace("/", "") || "dashboard";

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <Header title="{{ project-name }}" locale={locale} onToggleLang={handleToggleLang} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage={activePage} />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  snapshot={snapshot}
                  locale={locale}
                  onViewAll={() => navigate("/processes")}
                />
              }
            />
            <Route
              path="/processes"
              element={
                <Processes processes={snapshot?.processes ?? []} locale={locale} />
              }
            />
            <Route
              path="/about"
              element={<About locale={locale} />}
            />
          </Routes>
        </main>
      </div>

      <StatusBar
        isRefreshing={isRefreshing}
        refreshInterval={refreshInterval}
        onIntervalCycle={handleCycleInterval}
        timestamp={snapshot?.timestamp ?? ""}
        error={error}
        locale={locale}
      />
    </div>
  );
}

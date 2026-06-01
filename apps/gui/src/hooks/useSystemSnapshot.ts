import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { SystemSnapshot } from "../types";

/** Polls `get_system_snapshot` at the given interval. */
export function useSystemSnapshot(demoMode: boolean, intervalMs: number = 1000) {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval>;

    const fetchSnapshot = async () => {
      try {
        const data = await invoke<SystemSnapshot>("get_system_snapshot", {
          demoMode,
        });
        if (!cancelled) {
          setSnapshot(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
        }
      }
    };

    fetchSnapshot();
    timer = setInterval(fetchSnapshot, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [demoMode, intervalMs]);

  return { snapshot, error };
}

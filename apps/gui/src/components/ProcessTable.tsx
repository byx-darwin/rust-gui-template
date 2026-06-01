import { useState } from "react";
import type { ProcessInfo } from "../types";

type SortColumn = "pid" | "name" | "cpu_usage_pct" | "memory_usage_pct" | "status";
type SortDir = "asc" | "desc";

interface ProcessTableProps {
  processes: ProcessInfo[];
  maxRows?: number;
  onViewAll?: () => void;
}

export function ProcessTable({ processes, maxRows, onViewAll }: ProcessTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn>("cpu_usage_pct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (col: SortColumn) => {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sorted = [...processes].sort((a, b) => {
    const av = a[sortCol];
    const bv = b[sortCol];
    if (typeof av === "string" && typeof bv === "string") {
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    const an = typeof av === "number" ? av : parseFloat(av as string);
    const bn = typeof bv === "number" ? bv : parseFloat(bv as string);
    return sortDir === "asc" ? an - bn : bn - an;
  });

  const display = maxRows ? sorted.slice(0, maxRows) : sorted;

  const sortArrow = (col: SortColumn) => {
    if (sortCol !== col) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const columns: { key: SortColumn; label: string; align: "left" | "right" }[] = [
    { key: "pid", label: "PID", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "cpu_usage_pct", label: "CPU%", align: "right" },
    { key: "memory_usage_pct", label: "Mem%", align: "right" },
    { key: "status", label: "St", align: "left" },
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Processes</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
            View All →
          </button>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800 text-slate-300">
              {columns.map(({ key, label, align }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`cursor-pointer px-3 py-2 text-${align} hover:text-slate-100 select-none`}
                >
                  {label}{sortArrow(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((p) => (
              <tr
                key={p.pid}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-3 py-1.5 font-mono text-slate-400">{p.pid}</td>
                <td className="px-3 py-1.5 text-slate-300">{p.name}</td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-400">
                  {p.cpu_usage_pct.toFixed(1)}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-400">
                  {p.memory_usage_pct.toFixed(1)}
                </td>
                <td className="px-3 py-1.5 text-slate-500">{p.status}</td>
              </tr>
            ))}
            {display.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-slate-600">
                  No processes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

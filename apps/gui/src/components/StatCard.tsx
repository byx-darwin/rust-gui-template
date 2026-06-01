interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  percentage: number;
}

function gaugeColor(pct: number): { bar: string; text: string } {
  if (pct >= 90) return { bar: "bg-red-500", text: "text-red-400" };
  if (pct >= 70) return { bar: "bg-yellow-500", text: "text-yellow-400" };
  return { bar: "bg-green-500", text: "text-green-400" };
}

export function StatCard({ title, value, subValue, percentage }: StatCardProps) {
  const { bar, text } = gaugeColor(percentage);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-1 text-xs text-slate-500">{title}</div>
      <div className={`text-2xl font-bold ${text}`}>{value}</div>
      {subValue && <div className="mt-0.5 text-xs text-slate-500">{subValue}</div>}
      <div className="mt-2 h-1.5 rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className={`mt-1 text-right text-xs ${text}`}>{percentage.toFixed(1)}%</div>
    </div>
  );
}

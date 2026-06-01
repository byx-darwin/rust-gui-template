import { getLocale, t } from "../i18n";
import { ProcessTable } from "../components/ProcessTable";
import type { ProcessInfo } from "../types";

interface ProcessesProps {
  processes: ProcessInfo[];
}

export function Processes({ processes }: ProcessesProps) {
  const locale = getLocale();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-slate-200">{t(locale, "processes")}</h2>
      <ProcessTable processes={processes} />
    </div>
  );
}

import { getLocale, t } from "../i18n";

export function About() {
  const locale = getLocale();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-slate-200">{t(locale, "about")}</h2>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-2 text-lg font-bold text-cyan-400">{"{{ project-name }}"}</h3>
        <p className="mb-4 text-sm text-slate-400">{t(locale, "aboutDesc")}</p>

        <h4 className="mb-2 text-sm font-semibold text-slate-300">{t(locale, "keybindings")}</h4>
        <div className="grid grid-cols-2 gap-1 text-xs text-slate-400">
          <p>{t(locale, "quit")}</p>
          <p>{t(locale, "toggleLang")}</p>
          <p>{t(locale, "tab")}</p>
          <p>{t(locale, "cycleInterval")}</p>
          <p>{t(locale, "nav")}</p>
          <p>{t(locale, "manualRefresh")}</p>
        </div>

        <h4 className="mb-2 mt-4 text-sm font-semibold text-slate-300">{t(locale, "mouse")}</h4>
        <p className="text-xs text-slate-400">{t(locale, "scrollHint")}</p>

        <p className="mt-6 text-xs text-slate-600 font-mono">
          {t(locale, "version")}: 0.1.0
        </p>
      </div>
    </div>
  );
}

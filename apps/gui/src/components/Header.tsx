import type { Locale } from "../i18n";

interface HeaderProps {
  title: string;
  locale: Locale;
  onToggleLang: () => void;
}

export function Header({ title, locale, onToggleLang }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
      <h1 className="text-lg font-bold text-cyan-400">{title}</h1>
      <button
        onClick={onToggleLang}
        className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
      >
        {locale === "en" ? "EN" : "中文"}
      </button>
    </header>
  );
}

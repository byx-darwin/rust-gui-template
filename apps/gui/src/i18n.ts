//! Internationalization — zero external dependencies.
//! Add languages by adding entries to the `translations` object.

export type Locale = "en" | "zh";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    processes: "Processes",
    about: "About",
    cpu: "CPU",
    memory: "Memory",
    disk: "Disk",
    pid: "PID",
    name: "Name",
    cpuPercent: "CPU%",
    memPercent: "Mem%",
    memMB: "Mem MB",
    status: "Status",
    idle: "Idle",
    refreshing: "Refreshing",
    refresh: "Refresh",
    topProcesses: "Top Processes",
    viewAll: "View All →",
    cpuHistory: "CPU History (60s)",
    systemMonitor: "System Monitor",
    version: "Version",
    keybindings: "Keybindings",
    mouse: "Mouse",
    aboutDesc: "A system monitoring dashboard built with Tauri + React + Tailwind.",
    scrollHint: "Scroll to browse the process list.",
    quit: "q / Esc — Quit",
    tab: "1 2 3 — Switch tab",
    nav: "↑ ↓ — Navigate",
    manualRefresh: "r — Manual refresh",
    cycleInterval: "f — Cycle refresh interval",
    cycleSort: "s — Cycle sort column",
    toggleHelp: "? — Toggle help bar",
    toggleLang: "L — Switch language",
  },
  zh: {
    dashboard: "仪表盘",
    processes: "进程",
    about: "关于",
    cpu: "CPU",
    memory: "内存",
    disk: "磁盘",
    pid: "PID",
    name: "名称",
    cpuPercent: "CPU%",
    memPercent: "内存%",
    memMB: "内存 MB",
    status: "状态",
    idle: "空闲",
    refreshing: "刷新中",
    refresh: "刷新",
    topProcesses: "进程 TOP5",
    viewAll: "查看全部 →",
    cpuHistory: "CPU 历史 (60秒)",
    systemMonitor: "系统监控",
    version: "版本",
    keybindings: "快捷键",
    mouse: "鼠标",
    aboutDesc: "基于 Tauri + React + Tailwind 构建的系统监控仪表盘。",
    scrollHint: "滚轮浏览进程列表。",
    quit: "q / Esc — 退出",
    tab: "1 2 3 — 切换标签",
    nav: "↑ ↓ — 导航",
    manualRefresh: "r — 手动刷新",
    cycleInterval: "f — 循环刷新间隔",
    cycleSort: "s — 循环排序",
    toggleHelp: "? — 切换帮助栏",
    toggleLang: "L — 切换语言",
  },
};

/** Returns the translated string for a given locale and key. */
export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

/** Detect locale from browser language. */
export function getLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.startsWith("zh") ? "zh" : "en";
}

/** Toggle to the next locale. */
export function toggleLocale(current: Locale): Locale {
  return current === "en" ? "zh" : "en";
}

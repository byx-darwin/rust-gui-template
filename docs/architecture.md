# Architecture

## Workspace Layout

```
{{ project-name }}/
├── apps/gui/                # Tauri desktop application
│   ├── src-tauri/           # Rust backend (Tauri commands)
│   │   ├── src/main.rs      # Entry point + tracing init
│   │   ├── src/lib.rs       # Tauri commands (thin bridge to core)
│   │   └── src/monitor.rs   # System data types
│   ├── src/                 # React frontend (TypeScript + Tailwind)
│   │   ├── App.tsx          # Root layout + router + state
│   │   ├── i18n.ts          # Internationalization (EN/ZH)
│   │   ├── components/      # Shared UI components
│   │   ├── hooks/           # Tauri invoke wrappers
│   │   └── pages/           # Page components
│   └── package.json
├── crates/core/             # Shared domain library
│   └── src/lib.rs           # SafePath, Config, CoreError
└── configs/                 # Template configuration files
```

## Dependency Flow

```
apps/gui (React + Tauri)
  ├──➔ @tauri-apps/api (invoke bridge)
  └──➔ crates/core (domain types, validation)

crates/core
  No dependencies on any app crate — pure domain logic.
```

## Design Principles

- **Thin Tauri bridge**: Commands are simple wrappers that delegate to `crates/core` or `sysinfo`.
- **Single data endpoint**: One `get_system_snapshot` command returns all dashboard data.
- **Frontend owns state**: React hooks manage polling, sorting, and UI state.
- **Zero charting deps**: SVG polyline for sparkline — no recharts/echarts.

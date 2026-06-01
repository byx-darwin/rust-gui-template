# GUI Patterns

This guide covers the canonical patterns for building Tauri desktop applications with React + TypeScript.

## Tauri Architecture

Tauri apps have two processes:

- **Rust backend** (`src-tauri/`): Tauri commands, system access, state management
- **Web frontend** (`src/`): React UI rendered in a system WebView

Communication between them happens via Tauri's `invoke()` IPC bridge.

## IPC Pattern

**Rust side** — expose a function with `#[tauri::command]`:

```rust
#[tauri::command]
async fn get_data(state: tauri::State<'_, AppState>) -> Result<Data, String> {
    // ...
}
```

**TypeScript side** — call it with typed `invoke()`:

```typescript
import { invoke } from "@tauri-apps/api/core";
const data = await invoke<Data>("get_data");
```

Tauri automatically converts snake_case Rust parameter names to camelCase for the frontend.

## State Management

Use `tauri::State<T>` for managed application state:

```rust
pub struct AppState {
    pub db: Mutex<Database>,
}

tauri::Builder::default()
    .manage(AppState { ... })
    .invoke_handler(tauri::generate_handler![...])
    .run(...)?;
```

## Frontend Patterns

- **HashRouter**: Use `HashRouter` from `react-router-dom` for Tauri compatibility.
- **Polling**: Use `useEffect` + `setInterval` for periodic data refresh.
- **Single endpoint**: One `invoke()` call per refresh cycle returns all data — avoid N+1 IPC calls.
- **Zero charting deps**: SVG polyline for sparklines, Tailwind for styling.
- **No state library**: For 3-5 pages, React props drilling is sufficient.

## Error Handling

- Rust: Tauri commands return `Result<T, String>`. The frontend catches errors and displays them.
- Frontend: Error state in React hooks, displayed in StatusBar.

## Build and Bundle

```bash
# Dev (hot reload)
make dev

# Production build (platform installer)
make bundle
```

Tauri produces `.dmg`, `.msi`, `.deb`, `.AppImage` depending on the build platform.

## Testing

- Rust unit tests: standard `#[test]` in `crates/` and `apps/gui/src-tauri/`.
- Frontend: `pnpm tauri dev` for manual testing in the WebView.
- For CI, `cargo test --workspace` covers all Rust logic.

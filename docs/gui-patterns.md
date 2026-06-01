# GUI Patterns

This guide covers the canonical patterns for building Tauri 2 desktop applications with React 19 + TypeScript + Tailwind CSS. For mandatory non-negotiable rules, see [CLAUDE.md](../CLAUDE.md).

## Tauri Architecture

Tauri apps have two processes communicating via IPC:

- **Rust backend** (`src-tauri/`): System access, state management, file I/O. Exposes commands via `#[tauri::command]`.
- **Web frontend** (`src/`): React UI rendered in the platform's native WebView (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux).

Communication: frontend calls `invoke()` → Tauri serializes args to JSON → Rust deserializes → Rust returns serialized response → Tauri sends JSON back to frontend.

## IPC Pattern: The Single-Invoke Rule

**One `invoke()` call per data refresh cycle.** Batch all related data into one response struct. Never make N+1 IPC calls in a polling loop -- each `invoke()` crosses the process boundary and has serialization overhead.

**Rust side** — a single command returns all dashboard data:

```rust
#[tauri::command]
async fn get_system_snapshot(
    state: tauri::State<'_, AppState>,
    demo_mode: bool,
) -> Result<SystemSnapshot, CommandError> {
    // Collect CPU, memory, disk, processes in one pass
    // Return one struct with everything the frontend needs
}
```

**TypeScript side** — typed `invoke()` with a single call:

```typescript
import { invoke } from "@tauri-apps/api/core";
const data = await invoke<SystemSnapshot>("get_system_snapshot", {
  demoMode: false,
});
```

**Naming convention**: Tauri auto-converts Rust `snake_case` parameter names to `camelCase` for the frontend. So `demo_mode: bool` in Rust becomes `{ demoMode }` in TypeScript. The command name string in `invoke()` must match the Rust function name exactly (snake_case): `invoke("get_system_snapshot", ...)`.

## Type Sharing Across the Bridge

### Recommended: Auto-Generated Types with `ts-rs`

Every Rust struct crossing the IPC bridge needs a matching TypeScript interface. **Prefer auto-generation over manual mirroring.**

Add `ts-rs` to `Cargo.toml`:

```toml
[dependencies]
ts-rs = "10"
```

Annotate bridge types in Rust:

```rust
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../../src/bindings/")]
pub struct SystemSnapshot {
    pub cpu_usage_pct: f64,
    pub memory_used_gb: f64,
    // ...
}
```

Then `cargo test` exports `bindings/SystemSnapshot.ts`. Import it in the frontend:

```typescript
import type { SystemSnapshot } from "./bindings/SystemSnapshot";
```

Add a Makefile target for type generation:

```makefile
.PHONY: generate-types
generate-types:
	cargo test -p {{ project-name }}-gui -- generate_types
```

Commit the generated files so frontend developers don't need a Rust toolchain.

### Fallback: Manual Mirroring

If `ts-rs` is infeasible, mirror types with cross-reference comments:

```rust
// Rust — monitor.rs
// Keep in sync with: apps/gui/src/types.ts SystemSnapshot
pub struct SystemSnapshot {
    pub cpu_usage_pct: f64,  // TS: cpuUsagePct: number
}
```

```typescript
// TypeScript — types.ts
// Keep in sync with: apps/gui/src-tauri/src/monitor.rs SystemSnapshot
export interface SystemSnapshot {
  cpuUsagePct: number;
}
```

Use `#[serde(rename_all = "camelCase")]` on Rust structs so JSON keys are idiomatic JavaScript. TypeScript interfaces should use camelCase.

## Command Design

### Error Handling: Structured Errors

Use `thiserror` + `Serialize` for command error types so the frontend receives structured errors it can switch on:

```rust
#[derive(Debug, thiserror::Error, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum CommandError {
    #[error("State lock poisoned: {0}")]
    Internal(String),

    #[error("System data unavailable: {0}")]
    SystemUnavailable(String),

    #[error("Invalid input: {0}")]
    Validation(String),
}

#[tauri::command]
async fn get_data() -> Result<Data, CommandError> {
    // ...
}
```

In TypeScript, handle different error kinds:

```typescript
try {
  const data = await invoke<Data>("get_data");
} catch (e) {
  if (typeof e === "object" && e !== null && "kind" in e) {
    switch (e.kind) {
      case "Validation": showValidationError(e.message); break;
      case "SystemUnavailable": showRetryButton(); break;
      default: showGenericError(e.message);
    }
  }
}
```

For a minimal template, `Result<T, String>` is acceptable during prototyping. Upgrade to structured errors before adding the second command.

### Parameter Validation

Rust commands deserialize parameters via serde. Use newtypes and custom deserializers for validation:

```rust
#[derive(Deserialize)]
pub struct FilePath(String);

impl<'de> Deserialize<'de> for FilePath {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where D: Deserializer<'de> {
        let path = String::deserialize(deserializer)?;
        // Reject path traversal, NUL bytes, absolute paths
        if path.contains("..") || path.contains('\0') {
            return Err(de::Error::custom("Invalid file path"));
        }
        Ok(FilePath(path))
    }
}
```

## State Management

### Rust Side: Tauri Managed State

```rust
pub struct AppState {
    pub sys: Mutex<sysinfo::System>,
    pub config: RwLock<AppConfig>,
}

// In main.rs:
tauri::Builder::default()
    .manage(AppState { sys: Mutex::new(System::new_all()), config: ... })
    .invoke_handler(tauri::generate_handler![...])
    .run(tauri::generate_context!())?;

// In commands:
#[tauri::command]
async fn get_data(state: tauri::State<'_, AppState>) -> Result<Data, Error> {
    let sys = state.sys.lock().map_err(|e| CommandError::Internal(e.to_string()))?;
    // ...
}
```

- Use `std::sync::Mutex` for synchronous state access in commands.
- Use `tokio::sync::Mutex` only when holding the lock across `.await` points.
- Use `std::sync::RwLock` for read-heavy state like configuration.

### Frontend Side: Progressive Complexity

**Level 1: Props (current template)** — sufficient for <= 3 levels of prop drilling and <= 5 pages.

**Level 2: React Context** — use when multiple unrelated subtrees need the same data (theme, locale, auth, current project).

```typescript
const SnapshotContext = createContext<SystemSnapshot | null>(null);

export function SnapshotProvider({ children }: { children: ReactNode }) {
  const { snapshot } = useSystemSnapshot(demoMode, intervalMs);
  return (
    <SnapshotContext.Provider value={snapshot}>
      {children}
    </SnapshotContext.Provider>
  );
}
```

**Level 3: Zustand (lightweight external store)** — use when state has:
- Multiple producers and consumers
- Complex update logic (derived state, optimistic updates)
- Middleware needs (persist to disk, devtools, undo/redo)

```typescript
import { create } from "zustand";

interface AppStore {
  snapshot: SystemSnapshot | null;
  demoMode: boolean;
  setSnapshot: (s: SystemSnapshot) => void;
}

const useStore = create<AppStore>((set) => ({
  snapshot: null,
  demoMode: false,
  setSnapshot: (s) => set({ snapshot: s }),
}));
```

**Never**: Redux, MobX, or other heavy state libraries without explicit justification. Zustand handles all Tauri-appropriate state patterns.

**Anti-pattern**: Putting raw `invoke()` results directly into a global store without a selector causes every component to re-render on every poll. Use selectors:

```typescript
// Good: only re-renders when cpuUsagePct changes
const cpuUsage = useStore((s) => s.snapshot?.cpuUsagePct);

// Bad: re-renders on every poll
const snapshot = useStore((s) => s.snapshot);
```

## Frontend Patterns

### Routing: HashRouter

Use `HashRouter` from `react-router-dom` for Tauri compatibility. Tauri serves from `tauri://localhost` where `BrowserRouter` doesn't work.

```typescript
import { HashRouter } from "react-router-dom";

root.render(
  <HashRouter>
    <App />
  </HashRouter>
);
```

### Polling with Hooks

Encapsulate polling logic in a custom hook with cleanup:

```typescript
export function useSystemSnapshot(demoMode: boolean, intervalMs: number = 1000) {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
        if (!cancelled) setError(String(e));
      }
    };

    fetchSnapshot(); // immediate first fetch
    const timer = setInterval(fetchSnapshot, intervalMs);
    return () => { cancelled = true; clearInterval(timer); };
  }, [demoMode, intervalMs]);

  return { snapshot, error };
}
```

Key patterns:
- `cancelled` flag prevents state updates after unmount.
- Immediate first fetch (not waiting for the first interval tick).
- Dependencies array includes `demoMode` and `intervalMs` so the effect re-runs when they change.

### Zero Charting Dependencies

Use SVG for simple visualizations (sparklines) and Tailwind for styling. Avoid charting libraries (recharts, d3, chart.js) unless the UI requires interactive or complex charts.

Example sparkline:
```tsx
<svg viewBox="0 0 240 60" className="h-12 w-full">
  <polyline
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    points={history.map((v, i) => `${(i / 59) * 240},${60 - (v / 100) * 60}`).join(" ")}
    className="text-blue-400"
  />
</svg>
```

## Security

### Content Security Policy (CSP)

The `tauri.conf.json` CSP field is **NOT optional for production**. Set a restrictive policy:

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    }
  }
}
```

- `default-src 'self'` — block all external resources by default.
- `style-src 'unsafe-inline'` — required by Tailwind's Vite plugin which injects inline `<style>` tags during development. For production, Tailwind v4's Vite plugin generates a static CSS file, but the inline style CSP allowance remains needed for hot-reload.
- `img-src data:` — allow data URIs for inline icons if used.

**When to tighten further**: If the app loads no external images, remove `data:` from `img-src`. If Tailwind's JIT compiler generates all styles at build time (production build), test removing `unsafe-inline` from `style-src`.

**When to relax**: If the app must load images from a CDN, add `img-src 'self' https://cdn.example.com`. If using a web font service, add `font-src https://fonts.gstatic.com`. Always use the narrowest possible allowlist.

### XSS Prevention

- **Forbidden**: `dangerouslySetInnerHTML`. There is no legitimate use case in a Tauri dashboard app.
- If HTML rendering is unavoidable (e.g., rendering markdown or user-generated content), use DOMPurify on the frontend AND validate the sanitized output on the Rust side.
- User input displayed in the UI should be escaped by React's default JSX escaping. Do not bypass it.

### File Path Security

Any file path originating from the frontend (file pickers, drag-and-drop, text input) must be validated on the Rust side before filesystem operations:

```rust
fn validate_safe_path(base: &Path, user_path: &str) -> Result<PathBuf, CommandError> {
    // Reject path traversal
    if user_path.contains("..") || user_path.contains('\0') {
        return Err(CommandError::Validation("Invalid path".into()));
    }

    let resolved = base.join(user_path);
    let canonical = std::fs::canonicalize(&resolved)
        .map_err(|e| CommandError::Validation(format!("Path does not exist: {e}")))?;

    // Ensure resolved path is within the allowed directory
    if !canonical.starts_with(base) {
        return Err(CommandError::Validation("Path traversal detected".into()));
    }

    Ok(canonical)
}
```

### Secrets and Tokens

- Never pass API keys, tokens, or passwords as `invoke()` parameters. They pass through the WebView's JavaScript context where any script (or devtools) can read them.
- Use Tauri's [secure storage plugin](https://v2.tauri.app/plugin/secure-storage/) or environment variables read from the Rust side.
- If OAuth is needed, use Tauri's deep-link plugin for the redirect flow rather than embedding client secrets in the frontend.

## Build and Bundle

```bash
# Dev (hot reload for both Rust and frontend)
make dev

# Production build (platform-specific installer)
make bundle
```

Tauri produces:
- macOS: `.dmg` (Intel + Apple Silicon universal binary)
- Windows: `.msi` installer
- Linux: `.deb` and `.AppImage`

## Testing

### Rust Tests

Unit test commands in isolation with a mock `AppState`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_return_demo_snapshot() {
        let result = get_system_snapshot_demo(); // extract pure logic
        assert!(result.is_ok());
        let snapshot = result.unwrap();
        assert!(snapshot.cpu_usage_pct > 0.0);
        assert!(!snapshot.processes.is_empty());
    }
}
```

Extract pure logic from command functions so they can be tested without a running Tauri runtime:

```rust
// Command: thin wrapper that extracts state
#[tauri::command]
async fn get_snapshot(state: tauri::State<'_, AppState>) -> Result<SystemSnapshot, Error> {
    let sys = state.sys.lock()...;
    Ok(build_snapshot(&sys)) // pure function, testable
}

// Pure logic: testable without Tauri
fn build_snapshot(sys: &sysinfo::System) -> SystemSnapshot { ... }
```

### Frontend Tests

Add Vitest to the project:

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

`vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

**What's worth testing:**

1. **Hook tests** (highest value) — mock `@tauri-apps/api/core` to verify the IPC contract:

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useSystemSnapshot } from "../hooks/useSystemSnapshot";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

test("should return snapshot on successful invoke", async () => {
  const mockSnapshot = { cpuUsagePct: 42.0, /* ... */ };
  vi.mocked(invoke).mockResolvedValue(mockSnapshot);

  const { result } = renderHook(() => useSystemSnapshot(false, 100));
  await waitFor(() => expect(result.current.snapshot).toEqual(mockSnapshot));
});

test("should set error on failed invoke", async () => {
  vi.mocked(invoke).mockRejectedValue(new Error("IPC failed"));

  const { result } = renderHook(() => useSystemSnapshot(false, 100));
  await waitFor(() => expect(result.current.error).toBe("Error: IPC failed"));
});
```

2. **Component smoke tests** — render with mock data, assert key UI elements exist:

```typescript
test("should render CPU usage gauge", () => {
  render(<Dashboard snapshot={mockSnapshot} onViewAll={vi.fn()} />);
  expect(screen.getByText(/CPU/i)).toBeInTheDocument();
  expect(screen.getByText("42%")).toBeInTheDocument(); // from mock data
});
```

3. **Type-level tests** (if using `ts-rs`): a test that imports generated types and asserts they compile.

### CI Integration

```makefile
.PHONY: test-frontend
test-frontend:
	cd apps/gui && pnpm test

.PHONY: test
test: test-rust test-frontend  # update existing target
```

## Template Placeholders

When working on this template (not an instantiated project):
- Preserve `{{ project-name }}` in all files.
- Do not replace template variables with concrete names during maintenance.
- Use `{{ project-name }}` in Cargo.toml, package.json, tauri.conf.json, and documentation.

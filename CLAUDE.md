# {{ project-name }} Agent Guide

This repository is a reusable Rust 2024 workspace template for GUI (Tauri) applications. These rules are mandatory when working in this template.

## Non-negotiables

- Never enter plan mode automatically.
- Preserve template placeholders such as `{{ project-name }}` unless the user explicitly asks to instantiate the template.
- Do not replace template variables with concrete project names during maintenance.
- Use `CLAUDE.md` as the single project-level agent instruction file.
- Use Ruflo for agent workflow/orchestration. Do not maintain project-local `.claude/skills` unless explicitly requested.
- Do not commit, push, merge, release, deploy, install dependencies, or change ticket state without explicit user permission.
- Never run `cargo clean`; ask first if it is truly required.
- Never write `TODO`, `todo!()`, temporary stubs, or incomplete code.
- Remove dead code instead of suppressing it.
- Never expose secrets in commands, logs, URLs, comments, errors, or tool arguments.

### Completion Discipline

- **Do Not Stop Early**: Continue reviewing and improving until the request is genuinely handled.
- **Polish Bar**: Ask whether the result is fully polished, concrete, correct, complete, and elegant.
- **Honest Status**: Do not claim a task is finished when it is only a first pass.

### Code Quality

## Working Process

- Start by understanding the relevant files, symbols, tests, and specs before editing.
- Keep changes minimal, cohesive, and aligned with SOLID, DRY, and KISS.
- Prefer existing Makefile targets.
- For docs, inspect `docs/`, place new files there, and update `docs/index.md`.

## Required Validation

- Prefer the smallest validation that proves the change.
- Prefer existing Makefile targets: `make build`, `make test`, `make fmt`, `make clippy`, `make lint`.
- When touching production Rust code, run `cargo clippy --all-targets --all-features -- -D warnings -W clippy::pedantic`.
- Run `cargo audit` and `cargo deny check` when dependency, license, or supply-chain risk changes are involved.
- Do not hide failing checks. Diagnose, fix, and rerun.

## Rust Baseline

- Use Rust 2024 and the pinned toolchain in `rust-toolchain.toml`.
- Forbid unsafe code at crate roots with `#![forbid(unsafe_code)]`.
- Enable core lint coverage such as `missing_docs` and `missing_debug_implementations`.
- All public items require documentation.
- Derive or implement `Debug` for all types; redact sensitive fields manually.

## Toolchain & Build

- Always use Rust 2024 edition with latest stable version.
- Run the full Rust gate set when Rust source changes.
- Use `cargo clippy -- -D warnings -W clippy::pedantic` for stricter linting.
- Run `cargo audit` and `cargo deny check` when dependencies change.
- DO NOT use `cargo clean` at any time.

## TypeScript Baseline

### Type Safety

- **Forbid `any`**: Equivalent to `forbid(unsafe_code)`. Use `unknown` instead and narrow with type guards.
- **Forbid bare `as` assertions**: Use type guards (`typeof`, `instanceof`, custom predicates) or `satisfies`. `as const` is the sole exception.
- **Prefer `import type`**: Use `import type { Foo }` for type-only imports.

### Types vs Interfaces

- Use `type` for: unions, primitives, tuples, mapped/conditional types.
- Use `interface` for: object shapes, especially React component props.
- Prefer string union types over enums. Use `as const` arrays when you need both a type and a runtime iterable.

### Exports and Signatures

- Exported functions require explicit return types. React components may infer.
- Use discriminated unions for variant states: `type State = { status: "loading" } | { status: "loaded"; data: T }`.

### Naming

- PascalCase: types, interfaces, React components.
- camelCase: variables, functions, hooks, properties.
- kebab-case: file names (`process-table.tsx`).
- Hooks MUST start with `use`.

## React Baseline

### Components

- Function components only. One component per file.
- PascalCase filenames. Prefer named exports over `export default`.
- Always define a typed interface for props. Destructure in function signature.
- Order: imports, type/interface definitions, component function.

### State and Effects

- `useState` for local state. No Redux/Zustand unless the app outgrows prop drilling.
- `useMemo` only for expensive computations. `useCallback` only for stable prop references.
- Every `useEffect` with timers or subscriptions must return a cleanup function.
- Never mutate state directly; always use the setter.
- Hooks must be called unconditionally at the top level.

### Linting (Mandatory)

- ESLint 9 with flat config (`eslint.config.mjs`).
- `typescript-eslint` for TypeScript-aware rules.
- `eslint-plugin-react-hooks` with `rules-of-hooks: error`, `exhaustive-deps: warn`.
- Run `npm run lint` or `make lint` before committing.

### Testing

- Use Vitest + React Testing Library for component tests.
- Test user-visible behavior, not implementation details.
- Name tests `test_should_<expected_behavior>`.

## Tauri/GUI Bridge (Non-Negotiable)

These rules apply whenever Rust and TypeScript code communicates across the Tauri IPC bridge.

### Command Naming

- Rust command functions MUST use `snake_case` (e.g., `get_system_snapshot`).
- Frontend `invoke()` calls MUST use the exact Rust function name string (snake_case) -- Tauri does NOT convert command names.
- Rust parameter names MUST be `snake_case`; Tauri auto-converts them to `camelCase` in the frontend. Example: Rust `demo_mode: bool` becomes `{ demoMode }` in `invoke()` args.
- All bridge-facing structs MUST use `#[serde(rename_all = "camelCase")]` so JSON keys are idiomatic JavaScript. TypeScript interfaces MUST use camelCase to match.

### Type Sharing

- TypeScript types for bridge data MUST be generated from Rust structs, not hand-written.
- Use the `ts-rs` crate: add `#[derive(TS)]` and `#[ts(export)]` to all `#[derive(Serialize, Deserialize)]` structs in `monitor.rs` (or equivalent bridge type modules).
- Run `make generate-types` to regenerate TypeScript bindings after any Rust struct change.
- The generated TypeScript file MUST be committed to the repository so frontend builds do not require a Rust toolchain.
- If `ts-rs` is infeasible (rare), mirror types manually with cross-reference comments on every field naming both files. Add a CI check that compares field names and types between Rust and TypeScript.

### Command Design

- Every Tauri command MUST return `Result<T, E>`, never panic or call `expect()`/`unwrap()`.
- The error type `E` MUST implement `Serialize` (via `serde`) and `Display` (via `thiserror`) so structured errors reach the frontend. Never use `String` as the error type in production commands.
- One `invoke()` call per data refresh cycle. Batch related data into a single response struct. Never make N+1 IPC calls in a polling loop.
- All command parameters MUST be validated on the Rust side at deserialization boundaries. Do not trust TypeScript types to enforce invariants.

### State Management

- Rust-side global state MUST use `tauri::State<T>` with `Mutex<T>` (or `tokio::sync::Mutex<T>` for async). Example: `pub struct AppState { pub sys: Mutex<sysinfo::System> }`.
- Frontend state MUST live in React hooks or Context. Props are acceptable for up to 3 levels of drilling and up to 5 pages.
- For complex frontend state (multiple producers/consumers, middleware, persistence), use Zustand. Never introduce Redux or MobX without explicit justification.
- Do NOT put raw `invoke()` results directly into a global store without a selector/memoization layer -- this causes unnecessary re-renders on every poll.

### Security: Frontend-Backend Boundary

- The Tauri CSP (`tauri.conf.json` `app.security.csp`) MUST be set to a restrictive policy. At minimum: `"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"`. The `unsafe-inline` for styles is required by Tailwind's Vite plugin. Document any relaxation in a comment.
- `dangerouslySetInnerHTML` is FORBIDDEN. If HTML rendering is unavoidable, sanitize with DOMPurify on the frontend and validate on the Rust side.
- All user-originated data crossing the IPC bridge MUST be validated on both sides: frontend validates before `invoke()`, Rust validates at deserialization.
- File paths originating from the frontend (file pickers, drag-and-drop, user input) MUST be:
  - Canonicalized on the Rust side via `std::fs::canonicalize`.
  - Checked against a configured allowlist of permitted directories.
  - Rejected if they contain `..`, NUL bytes, or resolve outside the allowlist.
- Never pass secrets (tokens, keys, passwords) as `invoke()` parameters. Use Tauri's secure storage plugin or environment variables on the Rust side.

### Testing the Bridge

- Every Tauri command MUST have at least one Rust unit test that calls the command function with a mock `AppState`.
- Frontend tests MUST use Vitest with `@testing-library/react` and `jsdom`.
- Hook tests that call `invoke()` MUST mock `@tauri-apps/api/core` to avoid needing a running Tauri process. Test both success and error return paths.
- Add `pnpm test` to CI (via `make test-frontend` or integrated into `make test`).
- For component tests: render with mock data, assert key UI elements exist. Do not test Tailwind visual output.

## Error Handling

- Never use `unwrap()` or `expect()` in production code.
- Return `Result<T>` for fallible operations.
- Use `thiserror` for library error enums and `anyhow` for application-level error context.

## Type and API Design

- Make illegal states unrepresentable with private fields, newtypes, `#[non_exhaustive]`.
- Use `typed-builder` for structs with >5 fields. Prefer `From`/`TryFrom`/`FromStr`.
- Avoid unnecessary allocation: prefer `Cow<str>`, `Bytes`, `Arc`. Pre-allocate with `Vec::with_capacity()`.

## Async and Concurrency

- Use Tokio with explicit features. Never block inside async code — use `spawn_blocking`.
- Prefer `DashMap` over `Mutex<HashMap>`. Use `ArcSwap` for rarely-updated shared config.
- Handle all spawned task results. Prefer `JoinSet` for task groups.
- Use `tracing`; never `println!` or `dbg!`. Add `#[instrument]` on async boundaries.

## Security and Secrets

- Validate immediately at deserialization boundaries. Bound all strings and collections.
- Use `SafePath` from `{{ project-name }}-core` for externally-supplied file paths.
- Prevent SSRF: parse URLs, allowlist schemes, reject private IPs.
- Use parameterized DB APIs. Never concatenate user input into SQL or shell commands.
- Use `rustls` with `aws-lc-rs`. Use Argon2id for passwords, `OsRng` for keys.
- Wrap secrets with `secrecy` types. Use constant-time comparison for tokens. Design for key rotation.

## Serialization and Dependencies

- Use strongly typed `serde`. Validate deserialized data immediately.
- Minimize dependency count. Use workspace deps. Audit before adding.

## Code Style

- Import order: std, external, local. Run `rustfmt`, don't hand-format.
- Write doc comments for all public items. Document `# Errors`, `# Panics`, `# Safety`.
- Pass `cargo clippy --all-targets --all-features -- -D warnings -W clippy::pedantic`.

## Testing (TDD)

Follow TDD for every feature and bug fix: **RED → GREEN → REFACTOR**.

- **RED first**: Write a failing test before writing implementation.
- **GREEN second**: Write minimal code to pass.
- **REFACTOR third**: Clean up while keeping tests green.
- Use `make test-watch` during active development.
- Name tests `test_should_<expected_behavior>`.
- Use `rstest` for parameterized cases, `proptest` for invariants.

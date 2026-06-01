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

## Tauri/GUI Development

- Use Tauri 2 for cross-platform desktop applications.
- Frontend lives in `apps/gui/src/` (React + TypeScript + Tailwind CSS + Vite).
- Backend lives in `apps/gui/src-tauri/src/` (Tauri Rust commands).
- Tauri commands bridge frontend to backend via `#[tauri::command]`.
- Use `tauri::State<T>` for managed application state.
- `std::fs` is allowed for startup config loading. Prefer `tokio::fs` in async command handlers.
- Frontend state lives in React hooks. Single `invoke()` call per data refresh cycle.
- Test Rust logic in isolation; test React components separately.

## Error Handling

- Never use `unwrap()` or `expect()` in production code.
- Return `Result<T>` for fallible operations.
- Use `thiserror` for library error enums and `anyhow` for application-level error context.

## Testing (TDD)

Follow TDD for every feature and bug fix: **RED → GREEN → REFACTOR**.

- **RED first**: Write a failing test before writing implementation.
- **GREEN second**: Write minimal code to pass.
- **REFACTOR third**: Clean up while keeping tests green.
- Use `make test-watch` during active development.
- Name tests `test_should_<expected_behavior>`.
- Use `rstest` for parameterized cases, `proptest` for invariants.

# {{ project-name }}

A Rust GUI application built with Tauri + React + Tailwind, from the [rust-gui-template](https://github.com/byx-darwin/rust-gui-template).

## Quickstart

```bash
# Install frontend deps
cd apps/gui && pnpm install

# Run in dev mode (hot reload)
make dev

# Build platform installer
make bundle
```

## Development

```bash
# Install all dev tools
make install-tools

# Rust checks
make build
make test
make lint

# Frontend only (Vite dev server)
make frontend
```

## Configuration

{{ project-name }} reads config from:

1. Built-in defaults
2. CLI flags (`--demo` for simulated data)

## License

MIT — see [LICENSE.md](LICENSE.md).

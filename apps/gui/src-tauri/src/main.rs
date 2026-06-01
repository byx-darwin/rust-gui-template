//! {{ project-name }} GUI entry point.
//!
//! Parses `--demo` from CLI arguments and launches the Tauri application.

mod lib;

use std::sync::Mutex;

use lib::AppState;
use tracing::info;
use tracing_subscriber::EnvFilter;

fn main() {
    init_tracing();

    let demo_mode = std::env::args().any(|arg| arg == "--demo");
    info!(demo_mode, "Starting Tauri application");

    let state = AppState {
        sys: Mutex::new(sysinfo::System::new_all()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![lib::get_system_snapshot])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}

/// Initialize the tracing subscriber.
///
/// - TTY (terminal): human-readable output with ANSI colours unless `NO_COLOR` is set.
/// - Pipe / redirect: JSON-formatted output, unless `CLICOLOR_FORCE` is set.
fn init_tracing() {
    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .with_target(false)
        .init();
}

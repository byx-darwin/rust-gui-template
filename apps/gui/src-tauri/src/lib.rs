//! Tauri command bridge for {{ project-name }}.
//!
//! Thin layer that translates sysinfo data into JSON for the React frontend.

mod monitor;

use std::sync::Mutex;

use monitor::SystemSnapshot;

/// Application state managed by Tauri.
pub struct AppState {
    /// sysinfo system handle for real-data collection.
    pub sys: Mutex<sysinfo::System>,
}

/// Returns a complete system monitoring snapshot.
///
/// This is the single Tauri command — the frontend polls it on a timer
/// to drive the dashboard.
#[tauri::command]
pub async fn get_system_snapshot(
    state: tauri::State<'_, AppState>,
    demo_mode: bool,
) -> Result<SystemSnapshot, String> {
    if demo_mode {
        let mut snapshot = SystemSnapshot::new();
        snapshot.refresh_demo();
        snapshot.timestamp = chrono::Local::now()
            .format("%Y-%m-%d %H:%M:%S")
            .to_string();
        return Ok(snapshot);
    }

    let mut sys = state.sys.lock().map_err(|e| format!("State lock poisoned: {e}"))?;
    sys.refresh_all();
    let snapshot = build_snapshot(&sys);
    Ok(snapshot)
}

/// Builds a `SystemSnapshot` from a refreshed `sysinfo::System` handle.
fn build_snapshot(sys: &sysinfo::System) -> SystemSnapshot {
    let cpu_pct = sys.global_cpu_usage() as f64;

    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();
    let mem_total_gb = total_mem as f64 / 1_073_741_824.0;
    let mem_used_gb = used_mem as f64 / 1_073_741_824.0;
    let mem_pct = if total_mem > 0 {
        (used_mem as f64 / total_mem as f64) * 100.0
    } else {
        0.0
    };

    let disks = sysinfo::Disks::new_with_refreshed_list();
    let total_disk: u64 = disks.iter().map(|d| d.total_space()).sum();
    let used_disk: u64 = disks
        .iter()
        .map(|d| d.total_space().saturating_sub(d.available_space()))
        .sum();
    let disk_pct = if total_disk > 0 {
        (used_disk as f64 / total_disk as f64) * 100.0
    } else {
        0.0
    };

    let mut procs: Vec<monitor::ProcessInfo> = sys
        .processes()
        .iter()
        .map(|(pid, p)| {
            let mem_bytes = p.memory();
            monitor::ProcessInfo {
                pid: pid.as_u32().to_string(),
                name: p.name().to_string_lossy().into_owned(),
                cpu_usage_pct: p.cpu_usage() as f64,
                memory_usage_pct: (mem_bytes as f64 / total_mem.max(1) as f64) * 100.0,
                memory_mb: mem_bytes as f64 / 1_048_576.0,
                status: format!("{:?}", p.status()),
            }
        })
        .collect();
    procs.sort_by(|a, b| {
        b.cpu_usage_pct
            .partial_cmp(&a.cpu_usage_pct)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    procs.truncate(50);

    SystemSnapshot {
        cpu_usage_pct: cpu_pct,
        memory_used_gb: mem_used_gb,
        memory_total_gb: mem_total_gb,
        memory_usage_pct: mem_pct,
        disk_usage_pct: disk_pct,
        cpu_history: vec![cpu_pct], // frontend accumulates history
        processes: procs,
        timestamp: chrono::Local::now()
            .format("%Y-%m-%d %H:%M:%S")
            .to_string(),
    }
}

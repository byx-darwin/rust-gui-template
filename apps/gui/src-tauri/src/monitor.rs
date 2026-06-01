//! System data collection types.
//!
//! All structs derive `Serialize + Deserialize` so Tauri can serialize
//! them as JSON across the IPC bridge to the React frontend.

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

/// A snapshot of system state taken at one refresh cycle.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemSnapshot {
    /// Overall CPU usage percentage (0.0–100.0).
    pub cpu_usage_pct: f64,
    /// Used memory in GB.
    pub memory_used_gb: f64,
    /// Total memory in GB.
    pub memory_total_gb: f64,
    /// Memory usage percentage (0.0–100.0).
    pub memory_usage_pct: f64,
    /// Disk usage percentage (0.0–100.0).
    pub disk_usage_pct: f64,
    /// Last 60 CPU readings for the sparkline chart.
    pub cpu_history: Vec<f64>,
    /// Top processes by CPU usage (max 50).
    pub processes: Vec<ProcessInfo>,
    /// Formatted timestamp of this snapshot.
    pub timestamp: String,
}

/// Information about a single running process.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    /// Process ID.
    pub pid: String,
    /// Process name.
    pub name: String,
    /// CPU usage percentage.
    pub cpu_usage_pct: f64,
    /// Memory usage percentage.
    pub memory_usage_pct: f64,
    /// Memory usage in megabytes.
    pub memory_mb: f64,
    /// Process status string.
    pub status: String,
}

impl SystemSnapshot {
    /// Creates an empty snapshot.
    #[must_use]
    pub fn new() -> Self {
        Self {
            cpu_usage_pct: 0.0,
            memory_used_gb: 0.0,
            memory_total_gb: 0.0,
            memory_usage_pct: 0.0,
            disk_usage_pct: 0.0,
            cpu_history: Vec::with_capacity(60),
            processes: Vec::with_capacity(50),
            timestamp: String::new(),
        }
    }

    /// Fills the snapshot with simulated data for demo mode.
    #[allow(clippy::cast_precision_loss, reason = "Timestamp values fit in f64")]
    pub fn refresh_demo(&mut self) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs_f64();
        let base = 45.0 + (now * 0.5).sin() * 15.0;
        self.cpu_usage_pct = (base * 10.0).round() / 10.0;

        // Build 60-point history from sine wave
        self.cpu_history = (0..60)
            .map(|i| {
                let t = now - (59 - i) as f64;
                45.0 + (t * 0.5).sin() * 15.0
            })
            .collect();

        self.memory_total_gb = 32.0;
        self.memory_used_gb = 20.1;
        self.memory_usage_pct = 62.8;
        self.disk_usage_pct = 71.3;

        self.processes = vec![
            ProcessInfo { pid: "1234".into(), name: "firefox".into(), cpu_usage_pct: 12.3, memory_usage_pct: 8.7, memory_mb: 2784.3, status: "Running".into() },
            ProcessInfo { pid: "5678".into(), name: "cargo".into(), cpu_usage_pct: 8.9, memory_usage_pct: 2.1, memory_mb: 672.0, status: "Running".into() },
            ProcessInfo { pid: "9012".into(), name: "rust-analyzer".into(), cpu_usage_pct: 5.4, memory_usage_pct: 3.2, memory_mb: 1024.0, status: "Sleeping".into() },
            ProcessInfo { pid: "3456".into(), name: "terminal".into(), cpu_usage_pct: 2.1, memory_usage_pct: 1.5, memory_mb: 480.0, status: "Sleeping".into() },
            ProcessInfo { pid: "7890".into(), name: "spotify".into(), cpu_usage_pct: 1.8, memory_usage_pct: 4.3, memory_mb: 1376.0, status: "Sleeping".into() },
        ];
    }
}

impl Default for SystemSnapshot {
    fn default() -> Self {
        Self::new()
    }
}

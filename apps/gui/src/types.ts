export interface SystemSnapshot {
  cpu_usage_pct: number;
  memory_used_gb: number;
  memory_total_gb: number;
  memory_usage_pct: number;
  disk_usage_pct: number;
  cpu_history: number[];
  processes: ProcessInfo[];
  timestamp: string;
}

export interface ProcessInfo {
  pid: string;
  name: string;
  cpu_usage_pct: number;
  memory_usage_pct: number;
  memory_mb: number;
  status: string;
}

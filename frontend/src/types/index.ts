export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 
  | 'DETECTED' 
  | 'INVESTIGATING' 
  | 'REMEDIATING' 
  | 'VERIFYING' 
  | 'RESOLVED' 
  | 'FAILED';

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network_mb_s: number;
  uptime_seconds: number;
  uptime_formatted: string;
  status: HealthStatus;
  timestamp: string;
  active_incidents_count: number;
  is_simulated: boolean;
}

export interface TelemetrySnapshot {
  id?: number;
  cpu: number;
  memory: number;
  disk: number;
  network_mb_s: number;
  timestamp: string;
}

export interface IncidentEvent {
  id?: number;
  incident_id: string;
  event_type: string;
  message: string;
  timestamp: string;
  incident_type?: string;
  severity?: Severity;
}

export interface RecoveryAction {
  id?: number;
  incident_id: string;
  runbook_id: string;
  action_name: string;
  status: 'EXECUTING' | 'SUCCESSFUL' | 'FAILED' | string;
  before_value?: number;
  after_value?: number;
  started_at: string;
  completed_at?: string;
  incident_type?: string;
  severity?: Severity;
  metric?: string;
  threshold?: number;
}

export interface Incident {
  id: string;
  type: string;
  severity: Severity;
  status: IncidentStatus;
  metric: string;
  current_value: number;
  threshold: number;
  root_cause?: string;
  confidence?: number;
  evidence?: string;
  recommended_action?: string;
  created_at: string;
  resolved_at?: string;
  events?: IncidentEvent[];
  recovery_action?: RecoveryAction;
}

export interface Runbook {
  id: string;
  name: string;
  description: string;
  trigger: string;
  preconditions: string;
  action: string;
  verification_condition: string;
  success_condition: string;
  failure_condition: string;
}

export interface SystemSettings {
  cpu_threshold: number;
  memory_threshold: number;
  disk_threshold: number;
  auto_remediation_enabled: boolean;
  polling_interval_sec: number;
}

export interface SimulationResult {
  success: boolean;
  scenario: string;
  message: string;
  incident_id?: string;
  initial_metric_value?: number;
  rca?: {
    root_cause: string;
    confidence: number;
    evidence: string;
    recommended_action: string;
  };
  remediation?: {
    action_id: number;
    status: string;
    runbook: Runbook;
  };
  verification?: {
    is_recovered: boolean;
    status: string;
    before_value: number;
    after_value: number;
    message: string;
  };
}

export interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

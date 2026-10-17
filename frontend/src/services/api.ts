import { 
  SystemMetrics, 
  TelemetrySnapshot, 
  Incident, 
  RecoveryAction, 
  IncidentEvent, 
  Runbook, 
  SystemSettings, 
  SimulationResult, 
  LogEntry 
} from '../types';

const API_BASE = '/api';

export async function fetchCurrentMetrics(): Promise<SystemMetrics> {
  const res = await fetch(`${API_BASE}/metrics/current`);
  if (!res.ok) throw new Error('Failed to fetch current telemetry metrics');
  return res.json();
}

export async function fetchTelemetryHistory(limit = 30): Promise<TelemetrySnapshot[]> {
  const res = await fetch(`${API_BASE}/metrics/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch telemetry history');
  return res.json();
}

export async function fetchIncidents(status?: string, limit = 50): Promise<Incident[]> {
  const url = status ? `${API_BASE}/incidents?status=${encodeURIComponent(status)}&limit=${limit}` : `${API_BASE}/incidents?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncidentById(id: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
  return res.json();
}

export async function triggerRCA(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(id)}/rca`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger RCA for ${id}`);
  return res.json();
}

export async function triggerRemediation(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/recovery/incidents/${encodeURIComponent(id)}/remediate`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger remediation for ${id}`);
  return res.json();
}

export async function triggerVerification(id: string, simulateFailure = false): Promise<any> {
  const res = await fetch(`${API_BASE}/recovery/incidents/${encodeURIComponent(id)}/verify?simulate_failure=${simulateFailure}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to verify recovery for ${id}`);
  return res.json();
}

export async function clearAllIncidents(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/incidents/clear`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear incidents');
  return res.json();
}

export async function fetchActiveRemediations(): Promise<RecoveryAction[]> {
  const res = await fetch(`${API_BASE}/recovery/active`);
  if (!res.ok) throw new Error('Failed to fetch active remediations');
  return res.json();
}

export async function fetchRecoveryHistory(limit = 50): Promise<RecoveryAction[]> {
  const res = await fetch(`${API_BASE}/recovery/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recovery history');
  return res.json();
}

export async function fetchRunbooks(): Promise<Runbook[]> {
  const res = await fetch(`${API_BASE}/runbooks`);
  if (!res.ok) throw new Error('Failed to fetch runbooks');
  return res.json();
}

export async function triggerSimulatorScenario(scenario: string, autoExecute = true): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulate/${scenario}?auto_execute=${autoExecute}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger simulator scenario '${scenario}'`);
  return res.json();
}

export async function resetSimulator(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/simulate/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset simulation');
  return res.json();
}

export async function fetchAllEvents(limit = 50): Promise<IncidentEvent[]> {
  const res = await fetch(`${API_BASE}/events?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchSystemLogs(limit = 50): Promise<LogEntry[]> {
  const res = await fetch(`${API_BASE}/events/logs?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function fetchSettings(): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch system settings');
  return res.json();
}

export async function updateSettings(settings: SystemSettings): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update system settings');
  return res.json();
}

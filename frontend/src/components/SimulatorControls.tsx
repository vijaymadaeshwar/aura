import React, { useState } from 'react';
import { 
  Flame, 
  Cpu, 
  Database, 
  AlertOctagon, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Zap,
  Terminal,
  Play
} from 'lucide-react';
import { triggerSimulatorScenario, resetSimulator } from '../services/api';
import { SimulationResult } from '../types';

interface SimulatorControlsProps {
  onSimulationTriggered?: () => void;
  compact?: boolean;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  onSimulationTriggered,
  compact = false,
}) => {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSimulationLogs((prev) => [...prev, `${time} — ${msg}`]);
  };

  const handleSimulate = async (scenario: string, scenarioName: string) => {
    try {
      setActiveScenario(scenario);
      setSimulationLogs([]);
      setLastResult(null);

      addLog(`Simulation started: [${scenarioName}]`);
      addLog(`Injecting telemetry anomaly into observability layer...`);

      const result = await triggerSimulatorScenario(scenario, true);
      setLastResult(result);

      if (result.incident_id) {
        addLog(`Incident ${result.incident_id} DETECTED (Threshold breached)`);
      }

      if (result.rca) {
        addLog(`RCA completed: Probable Cause -> "${result.rca.root_cause}" (${result.rca.confidence}% confidence)`);
        addLog(`Runbook selected: ${result.rca.recommended_action}`);
      }

      if (result.remediation) {
        addLog(`Remediation executed: "${result.remediation.runbook.action}"`);
      }

      if (result.verification) {
        if (result.verification.is_recovered) {
          addLog(`Recovery verified: ${result.verification.before_value}% → ${result.verification.after_value}%`);
          addLog(`✓ RECOVERY SUCCESSFUL — Incident marked RESOLVED.`);
        } else {
          addLog(`Recovery verified: Post-check measured ${result.verification.after_value}% (Threshold exceeded)`);
          addLog(`✗ RECOVERY FAILED — Incident marked FAILED & ESCALATED to Tier-2 SRE.`);
        }
      }

      if (onSimulationTriggered) {
        onSimulationTriggered();
      }
    } catch (err: any) {
      addLog(`Simulation error: ${err.message || 'Execution error'}`);
    } finally {
      setActiveScenario(null);
    }
  };

  const handleReset = async () => {
    try {
      await resetSimulator();
      addLog(`Simulation overrides cleared. Returned to live hardware monitoring.`);
      setLastResult(null);
      if (onSimulationTriggered) onSimulationTriggered();
    } catch (err: any) {
      addLog(`Failed to reset simulation: ${err.message}`);
    }
  };

  return (
    <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 fill-current" />
            <span>Interactive Incident Simulator</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Simulate Reliability Incidents
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely simulate reliability incidents to observe AURA's autonomous closed-loop recovery workflow in real-time.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Overrides</span>
        </button>
      </div>

      {/* Simulator Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Scenario 1: High CPU */}
        <button
          onClick={() => handleSimulate('high-cpu', 'High CPU Spike (94%)')}
          disabled={activeScenario !== null}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-700 hover:border-amber-500/60 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
              94.2% CPU
            </span>
          </div>
          <div className="font-bold text-sm text-white group-hover:text-amber-300">
            SIMULATE HIGH CPU
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            Triggers CPU spike → RCA diagnoses process → Runbook restarts worker → Verifies drop to 42%.
          </p>
        </button>

        {/* Scenario 2: High Memory */}
        <button
          onClick={() => handleSimulate('high-memory', 'Memory Leak (94%)')}
          disabled={activeScenario !== null}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-700 hover:border-blue-500/60 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/50">
              94.5% RAM
            </span>
          </div>
          <div className="font-bold text-sm text-white group-hover:text-blue-300">
            SIMULATE HIGH MEMORY
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            Triggers RAM saturation → RCA identifies buffer leak → Runbook flushes cache → Verifies recovery.
          </p>
        </button>

        {/* Scenario 3: Application Failure */}
        <button
          onClick={() => handleSimulate('application-failure', 'Database Pool Timeout')}
          disabled={activeScenario !== null}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-700 hover:border-purple-500/60 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
              HTTP 500
            </span>
          </div>
          <div className="font-bold text-sm text-white group-hover:text-purple-300">
            APPLICATION FAILURE
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            Simulates DB pool deadlock → RCA detects pool stall → Runbook restarts app pool → Verifies 200 OK.
          </p>
        </button>

        {/* Scenario 4: Recovery Failure (Escalation) */}
        <button
          onClick={() => handleSimulate('recovery-failure', 'Unsuccessful Recovery')}
          disabled={activeScenario !== null}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-700 hover:border-red-500/60 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-red-400 font-bold bg-red-950/80 px-2 py-0.5 rounded border border-red-800/50">
              ESCALATION DEMO
            </span>
          </div>
          <div className="font-bold text-sm text-white group-hover:text-red-300">
            SIMULATE RECOVERY FAILURE
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-normal">
            Simulates stubborn bottleneck: Remediation runs, post-check fails (91% &gt; 80%) → Autonomous escalation.
          </p>
        </button>
      </div>

      {/* Live Simulation Terminal Output */}
      {simulationLogs.length > 0 && (
        <div className="mt-5 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-300">Simulation Execution Trace</span>
            </div>
            <span className="text-[10px] text-emerald-400">● LIVE TRACE</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
            {simulationLogs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-emerald-500 select-none">&gt;</span>
                <span className={log.includes('✓') ? 'text-emerald-300 font-bold' : log.includes('✗') ? 'text-red-400 font-bold' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

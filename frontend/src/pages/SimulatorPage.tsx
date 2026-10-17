import React from 'react';
import { SimulatorControls } from '../components/SimulatorControls';
import { Flame, ShieldCheck, CheckCircle2, HelpCircle } from 'lucide-react';

interface SimulatorPageProps {
  onSimulationTriggered: () => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ onSimulationTriggered }) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-amber-400" />
          Reliability Incident Simulator
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Module 7: Safely inject controlled anomalies into AURA's observability pipeline to demonstrate autonomous recovery.
        </p>
      </div>

      {/* Main Simulator Control Center */}
      <SimulatorControls onSimulationTriggered={onSimulationTriggered} />

      {/* Educational Walkthrough Guide */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>Interview Demonstration Workflow</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="font-mono text-emerald-400 font-bold block mb-1">
              SCENARIO 1 — HIGH CPU SPIKE
            </span>
            <p className="text-slate-400 font-normal">
              Click <strong className="text-white">SIMULATE HIGH CPU</strong>. AURA detects the 94% threshold breach, runs RCA to identify the CPU-intensive process, selects runbook <span className="font-mono text-emerald-300">RB-CPU-01</span>, executes remediation, verifies CPU drops to 42%, and marks the incident <strong className="text-emerald-400">RESOLVED</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="font-mono text-blue-400 font-bold block mb-1">
              SCENARIO 2 — MEMORY LEAK
            </span>
            <p className="text-slate-400 font-normal">
              Click <strong className="text-white">SIMULATE HIGH MEMORY</strong>. Demonstrates memory saturation (94.5%). AURA identifies buffer leaks, flushes application caches, reclaims heap, and verifies RAM stabilization.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="font-mono text-red-400 font-bold block mb-1">
              SCENARIO 3 — RECOVERY FAILURE
            </span>
            <p className="text-slate-400 font-normal">
              Click <strong className="text-white">SIMULATE RECOVERY FAILURE</strong>. Demonstrates that AURA never assumes success: post-remediation measurement detects the metric is still high (91% &gt; 80%), marks the attempt <strong className="text-red-400">FAILED</strong>, and autonomously escalates to Tier-2 SRE.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

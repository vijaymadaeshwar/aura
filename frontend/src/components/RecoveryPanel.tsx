import React from 'react';
import { RecoveryAction } from '../types';
import { StatusBadge } from './StatusBadge';
import { RotateCcw, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Terminal, Play } from 'lucide-react';

interface RecoveryPanelProps {
  activeActions: RecoveryAction[];
  recoveryHistory: RecoveryAction[];
  onSelectAction?: (action: RecoveryAction) => void;
}

export const RecoveryPanel: React.FC<RecoveryPanelProps> = ({
  activeActions,
  recoveryHistory,
}) => {
  return (
    <div className="space-y-6">
      {/* Active Autonomous Actions Section */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-400">
              <RotateCcw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Autonomous Recovery Engine
              </h3>
              <p className="text-xs text-slate-400">
                Live monitoring of automated runbook remediations &amp; verification checks.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-blue-950 text-blue-400 rounded-full border border-blue-800">
            Active: {activeActions.length}
          </span>
        </div>

        {activeActions.length > 0 ? (
          <div className="space-y-4">
            {activeActions.map((action) => (
              <div
                key={action.id}
                className="bg-slate-900/90 border border-blue-500/50 rounded-xl p-5 shadow-lg shadow-blue-500/10"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      Incident {action.incident_id} — Runbook {action.runbook_id}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {action.action_name}
                    </h4>
                  </div>
                  <StatusBadge status={action.status} />
                </div>

                {/* 4-Stage Autonomous Pipeline */}
                <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                    <div className="font-bold">1. DETECT</div>
                    <div className="text-[10px] text-emerald-400">✓ Anomaly Found</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-300">
                    <div className="font-bold">2. DIAGNOSE</div>
                    <div className="text-[10px] text-purple-400">✓ RCA Match</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-950/90 border border-blue-500 text-blue-300 animate-pulse">
                    <div className="font-bold">3. REMEDIATE</div>
                    <div className="text-[10px] text-blue-400">Executing Action...</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-500">
                    <div className="font-bold">4. VERIFY</div>
                    <div className="text-[10px]">Awaiting Delta</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">No active remediation in progress</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              System is operating safely within bounds. Use the Incident Simulator to trigger autonomous closed-loop recovery.
            </p>
          </div>
        )}
      </div>

      {/* Recovery History Audit Table */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Autonomous Recovery History &amp; Verification Audit
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Closed-loop log recording Before vs After metric measurements for every autonomous action.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Actions: {recoveryHistory.length}
          </span>
        </div>

        {recoveryHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-[11px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Action ID</th>
                  <th className="py-3 px-4">Incident</th>
                  <th className="py-3 px-4">Runbook</th>
                  <th className="py-3 px-4">Remediation Executed</th>
                  <th className="py-3 px-4">Verification Delta</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
                {recoveryHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      ACT-#{rec.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {rec.incident_id}
                    </td>
                    <td className="py-3.5 px-4 text-blue-400 font-semibold">
                      {rec.runbook_id}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-300">
                      {rec.action_name}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rec.before_value !== null && rec.after_value !== null ? (
                        <div className="flex items-center space-x-1.5 font-bold">
                          <span className="text-red-400">{rec.before_value}%</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          <span className={rec.status === 'SUCCESSFUL' ? 'text-emerald-400' : 'text-red-400'}>
                            {rec.after_value}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-sans italic">In progress</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={rec.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {rec.started_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No recovery actions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

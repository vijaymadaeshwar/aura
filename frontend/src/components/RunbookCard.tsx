import React from 'react';
import { Runbook } from '../types';
import { BookOpen, Zap, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

interface RunbookCardProps {
  runbook: Runbook;
  onExecute?: (runbook: Runbook) => void;
}

export const RunbookCard: React.FC<RunbookCardProps> = ({ runbook, onExecute }) => {
  return (
    <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {runbook.id}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                {runbook.name}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            PREDEFINED
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-4 font-normal">
          {runbook.description}
        </p>

        {/* Key Specs */}
        <div className="space-y-2.5 text-xs bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 font-mono">
          <div>
            <span className="text-slate-400 font-sans text-[11px] uppercase font-bold tracking-wider block">
              Trigger
            </span>
            <span className="text-amber-400 font-semibold">{runbook.trigger}</span>
          </div>

          <div>
            <span className="text-slate-400 font-sans text-[11px] uppercase font-bold tracking-wider block">
              Remediation Action
            </span>
            <span className="text-blue-400 font-semibold">{runbook.action}</span>
          </div>

          <div>
            <span className="text-slate-400 font-sans text-[11px] uppercase font-bold tracking-wider block">
              Verification Condition
            </span>
            <span className="text-emerald-400 font-semibold">{runbook.verification_condition}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autonomous Loop Ready</span>
        </div>
      </div>
    </div>
  );
};

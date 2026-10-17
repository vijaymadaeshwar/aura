import React from 'react';
import { RecoveryAction, Incident } from '../types';
import { RecoveryPanel } from '../components/RecoveryPanel';
import { RotateCcw, ShieldCheck, Zap } from 'lucide-react';

interface RecoveryPageProps {
  activeActions: RecoveryAction[];
  recoveryHistory: RecoveryAction[];
  onRefresh: () => void;
}

export const RecoveryPage: React.FC<RecoveryPageProps> = ({
  activeActions,
  recoveryHistory,
  onRefresh,
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-blue-400" />
            Autonomous Recovery &amp; Verification
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Module 5 &amp; 6: Automated runbook execution, post-remediation measurement, and verified recovery.
          </p>
        </div>
      </div>

      <RecoveryPanel
        activeActions={activeActions}
        recoveryHistory={recoveryHistory}
      />
    </div>
  );
};

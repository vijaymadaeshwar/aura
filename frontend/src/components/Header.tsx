import React from 'react';
import { RefreshCw, Zap, Shield, AlertCircle } from 'lucide-react';
import { HealthStatus } from '../types';

interface HeaderProps {
  status: HealthStatus;
  lastUpdated: string;
  isSimulated: boolean;
  onRefresh: () => void;
  onQuickSimulate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  lastUpdated,
  isSimulated,
  onRefresh,
  onQuickSimulate,
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/80 border-red-800 text-red-400',
          dot: 'bg-red-500 animate-ping',
          label: 'CRITICAL ALERT',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-950/80 border-amber-800 text-amber-400',
          dot: 'bg-amber-500 animate-ping',
          label: 'DEGRADED',
        };
      case 'HEALTHY':
      default:
        return {
          bg: 'bg-emerald-950/80 border-emerald-800 text-emerald-400',
          dot: 'bg-emerald-500',
          label: 'HEALTHY',
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <header className="bg-[#0D1527] border-b border-slate-800/90 px-8 py-4 sticky top-0 z-10 flex items-center justify-between shadow-md">
      <div>
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-white tracking-wide">
            AURA <span className="text-emerald-400 font-extrabold">MINI</span>
          </h2>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider bg-slate-800/90 px-2.5 py-1 rounded border border-slate-700">
            Autonomous Reliability Agent
          </span>
          {isSimulated && (
            <span className="text-xs font-bold text-amber-400 bg-amber-950/90 px-2.5 py-1 rounded border border-amber-700/60 animate-pulse flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> SIMULATION ACTIVE
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Closed-Loop: <strong className="text-slate-300">Observe → Detect → Diagnose → Remediate → Verify</strong>
        </p>
      </div>

      <div className="flex items-center space-x-4">
        {/* Status Pill */}
        <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold ${statusInfo.bg}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot}`}></span>
          <span>SYSTEM: {statusInfo.label}</span>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-slate-400 font-mono hidden md:block">
          Updated: <span className="text-slate-200">{lastUpdated || 'Just now'}</span>
        </div>

        {/* Quick Simulator CTA */}
        <button
          onClick={onQuickSimulate}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Spike</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Refresh Telemetry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

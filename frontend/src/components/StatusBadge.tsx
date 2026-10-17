import React from 'react';
import { Severity, IncidentStatus, HealthStatus } from '../types';

interface StatusBadgeProps {
  status?: IncidentStatus | HealthStatus | string;
  severity?: Severity;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, severity, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }[size];

  if (severity) {
    const severityStyles: Record<Severity, string> = {
      CRITICAL: 'bg-red-950/80 text-red-400 border border-red-800/60',
      HIGH: 'bg-orange-950/80 text-orange-400 border border-orange-800/60',
      MEDIUM: 'bg-amber-950/80 text-amber-400 border border-amber-800/60',
      LOW: 'bg-blue-950/80 text-blue-400 border border-blue-800/60',
    };

    return (
      <span className={`inline-flex items-center rounded-md uppercase tracking-wider ${severityStyles[severity] || severityStyles.MEDIUM} ${sizeClasses}`}>
        {severity}
      </span>
    );
  }

  if (status) {
    const statusStyles: Record<string, string> = {
      HEALTHY: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
      WARNING: 'bg-amber-950/80 text-amber-400 border border-amber-800/60',
      CRITICAL: 'bg-red-950/80 text-red-400 border border-red-800/60',
      DETECTED: 'bg-red-950/80 text-red-400 border border-red-800/60',
      INVESTIGATING: 'bg-purple-950/80 text-purple-400 border border-purple-800/60',
      REMEDIATING: 'bg-blue-950/80 text-blue-400 border border-blue-800/60 animate-pulse',
      VERIFYING: 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 animate-pulse',
      RESOLVED: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
      SUCCESSFUL: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
      FAILED: 'bg-rose-950/80 text-rose-400 border border-rose-800/60',
      EXECUTING: 'bg-blue-950/80 text-blue-400 border border-blue-800/60 animate-pulse',
    };

    const style = statusStyles[status.toUpperCase()] || 'bg-slate-800 text-slate-300 border border-slate-700';

    return (
      <span className={`inline-flex items-center rounded-md uppercase tracking-wider ${style} ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80"></span>
        {status}
      </span>
    );
  }

  return null;
};

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  threshold?: number;
  icon: LucideIcon;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'HIGH';
  subtext?: string;
  isSimulated?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  threshold,
  icon: Icon,
  status,
  subtext,
  isSimulated,
}) => {
  const isBreached = threshold ? value > threshold : status === 'CRITICAL' || status === 'HIGH';

  const getStatusColor = () => {
    switch (status) {
      case 'CRITICAL':
      case 'HIGH':
        return 'text-red-400';
      case 'WARNING':
        return 'text-amber-400';
      default:
        return 'text-emerald-400';
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'CRITICAL':
      case 'HIGH':
        return 'border-red-500/60 bg-red-950/10 shadow-lg shadow-red-500/5';
      case 'WARNING':
        return 'border-amber-500/60 bg-amber-950/10 shadow-lg shadow-amber-500/5';
      default:
        return 'border-slate-800 bg-[#111827]';
    }
  };

  const getBarColor = () => {
    switch (status) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-500';
      case 'WARNING':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-200 ${getBorderColor()}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${getStatusColor()}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
            {threshold && (
              <span className="text-[11px] text-slate-400 font-mono">Limit: {threshold}{unit}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isSimulated && (
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
              SIM
            </span>
          )}
          <StatusBadge status={status === 'NORMAL' ? 'HEALTHY' : status} size="sm" />
        </div>
      </div>

      {/* Large Metric Number */}
      <div className="flex items-baseline space-x-1 my-2">
        <span className={`text-4xl lg:text-5xl font-black font-mono tracking-tight ${getStatusColor()}`}>
          {value}
        </span>
        <span className="text-lg font-bold text-slate-400 font-mono">{unit}</span>
      </div>

      {/* Mini Progress Bar with Threshold Marker */}
      {unit === '%' && (
        <div className="mt-3 relative">
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor()}`}
              style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            ></div>
          </div>
          {threshold && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
              style={{ left: `${threshold}%` }}
              title={`Threshold: ${threshold}%`}
            ></div>
          )}
        </div>
      )}

      {/* Subtext */}
      {subtext && (
        <p className="text-xs text-slate-400 mt-2 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
};

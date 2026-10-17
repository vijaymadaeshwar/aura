import React from 'react';
import { Incident } from '../types';
import { StatusBadge } from './StatusBadge';
import { ChevronRight, AlertOctagon, CheckCircle, Clock } from 'lucide-react';

interface IncidentTableProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  title?: string;
  emptyMessage?: string;
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  incidents,
  onSelectIncident,
  title = 'System Incidents',
  emptyMessage = 'No active incidents detected. All subsystems operating within safety thresholds.',
}) => {
  if (incidents.length === 0) {
    return (
      <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-8 text-center shadow-lg">
        <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
        </div>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any incident to inspect root cause analysis, evidence, and verification timeline.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
          Total: {incidents.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Incident ID</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Metric Value</th>
              <th className="py-3 px-4">Root Cause</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Detected At</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 font-mono">
            {incidents.map((inc) => (
              <tr
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className="hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                  {inc.id}
                </td>
                <td className="py-3.5 px-4 font-sans font-medium text-slate-200 whitespace-nowrap">
                  {inc.type}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge severity={inc.severity} size="sm" />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-100">
                  <span className={inc.current_value > inc.threshold ? 'text-red-400' : 'text-slate-200'}>
                    {inc.current_value}%
                  </span>
                  <span className="text-xs text-slate-500 ml-1 font-normal font-sans">
                    (&gt;{inc.threshold}%)
                  </span>
                </td>
                <td className="py-3.5 px-4 font-sans text-xs text-slate-300 max-w-xs truncate">
                  {inc.root_cause || (
                    <span className="text-slate-500 italic">Pending RCA...</span>
                  )}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={inc.status} size="sm" />
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{inc.created_at}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <button className="inline-flex items-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 font-sans">
                    <span>Inspect</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

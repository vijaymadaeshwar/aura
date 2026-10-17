import React from 'react';
import { IncidentEvent, LogEntry } from '../types';
import { Terminal, Shield, Activity, RefreshCw } from 'lucide-react';

interface EventLogStreamProps {
  events: IncidentEvent[];
  systemLogs: LogEntry[];
  onRefresh?: () => void;
}

export const EventLogStream: React.FC<EventLogStreamProps> = ({
  events,
  systemLogs,
  onRefresh,
}) => {
  const [tab, setTab] = React.useState<'events' | 'logs'>('events');

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'DETECTION':
        return 'bg-red-950/80 text-red-400 border border-red-800/60';
      case 'RCA_COMPLETED':
        return 'bg-purple-950/80 text-purple-400 border border-purple-800/60';
      case 'REMEDIATION_STARTED':
      case 'REMEDIATION_FINISHED':
        return 'bg-blue-950/80 text-blue-400 border border-blue-800/60';
      case 'VERIFICATION_PASSED':
        return 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60';
      case 'VERIFICATION_FAILED':
      case 'ESCALATED':
        return 'bg-rose-950/80 text-rose-400 border border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="bg-[#111827] border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg flex flex-col h-full">
      {/* Header with Tabs */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTab('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'events'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reliability Events ({events.length})
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'logs'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Agent Logs ({systemLogs.length})
          </button>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Stream */}
      <div className="p-4 overflow-y-auto max-h-96 space-y-2.5 font-mono text-xs flex-1">
        {tab === 'events' ? (
          events.length > 0 ? (
            events.map((ev, i) => (
              <div
                key={ev.id || i}
                className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start space-x-3 hover:border-slate-700 transition-colors"
              >
                <span className="text-[11px] text-slate-500 whitespace-nowrap pt-0.5">
                  {ev.timestamp}
                </span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-white">
                      {ev.incident_id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getEventBadge(ev.event_type)}`}>
                      {ev.event_type}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-slate-300 font-normal">
                    {ev.message}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 font-sans">
              ● System healthy. No reliability events recorded.
            </div>
          )
        ) : (
          systemLogs.length > 0 ? (
            systemLogs.map((log, i) => (
              <div
                key={i}
                className="p-2.5 bg-slate-950/70 border border-slate-800/70 rounded-lg flex items-start space-x-2.5"
              >
                <span className="text-[11px] text-slate-500 whitespace-nowrap">
                  {log.timestamp}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    log.level === 'ERROR'
                      ? 'bg-red-950 text-red-400'
                      : log.level === 'WARNING'
                      ? 'bg-amber-950 text-amber-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-emerald-400 text-[11px] font-bold">
                  [{log.source}]
                </span>
                <span className="text-slate-300 font-sans text-xs flex-1">
                  {log.message}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 font-sans">
              No recent logs.
            </div>
          )
        )}
      </div>
    </div>
  );
};

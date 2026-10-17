import React, { useState } from 'react';
import { Incident } from '../types';
import { IncidentTable } from '../components/IncidentTable';
import { AlertTriangle, Filter, Trash2, Search, Zap } from 'lucide-react';
import { clearAllIncidents } from '../services/api';

interface IncidentsPageProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onRefresh: () => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  incidents,
  onSelectIncident,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncidents = incidents.filter((inc) => {
    // Status Filter
    if (filter === 'ACTIVE' && inc.status === 'RESOLVED') return false;
    if (filter === 'RESOLVED' && inc.status !== 'RESOLVED') return false;
    if (filter === 'FAILED' && inc.status !== 'FAILED') return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.id.toLowerCase().includes(q) ||
        inc.type.toLowerCase().includes(q) ||
        (inc.root_cause && inc.root_cause.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleClear = async () => {
    if (window.confirm('Clear all incident records?')) {
      try {
        await clearAllIncidents();
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            Reliability Incident Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Module 2 &amp; 3: Threshold anomaly detection, Rule-based RCA, and closed-loop resolution state.
          </p>
        </div>

        <button
          onClick={handleClear}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Incident Records</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#111827] p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'RESOLVED', 'FAILED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, type, root cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Incidents Table */}
      <IncidentTable
        incidents={filteredIncidents}
        onSelectIncident={onSelectIncident}
        title={`Incidents (${filteredIncidents.length})`}
        emptyMessage="No incidents match the selected filter criteria."
      />
    </div>
  );
};

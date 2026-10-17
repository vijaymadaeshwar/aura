import React from 'react';
import { Incident, RecoveryAction } from '../types';
import { IncidentTable } from '../components/IncidentTable';
import { History, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryPageProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ incidents, onSelectIncident }) => {
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'FAILED');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-slate-400" />
          Reliability Incident &amp; Recovery Audit History
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical record of all resolved and escalated reliability incidents with verification proof.
        </p>
      </div>

      {/* Incident Table showing historical resolved/failed incidents */}
      <IncidentTable
        incidents={resolvedIncidents}
        onSelectIncident={onSelectIncident}
        title="Resolved &amp; Closed Incidents Audit Trail"
        emptyMessage="No historical incidents found. Use the simulator to generate incidents and observe autonomous resolution."
      />
    </div>
  );
};

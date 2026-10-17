import React from 'react';
import { Runbook } from '../types';
import { RunbookCard } from '../components/RunbookCard';
import { BookOpen, ShieldCheck, Terminal } from 'lucide-react';

interface RunbooksPageProps {
  runbooks: Runbook[];
}

export const RunbooksPage: React.FC<RunbooksPageProps> = ({ runbooks }) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-400" />
          Reliability Runbook Catalog
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Module 4: Predefined, deterministic operational runbooks matched by the RCA engine for autonomous remediation.
        </p>
      </div>

      {/* Grid of Runbook Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {runbooks.map((rb) => (
          <RunbookCard key={rb.id} runbook={rb} />
        ))}
      </div>
    </div>
  );
};

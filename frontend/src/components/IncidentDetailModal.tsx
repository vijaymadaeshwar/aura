import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Microscope, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Play,
  Check
} from 'lucide-react';
import { Incident } from '../types';
import { StatusBadge } from './StatusBadge';
import { triggerRCA, triggerRemediation, triggerVerification } from '../services/api';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onIncidentUpdated: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onIncidentUpdated,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!incident) return null;

  const handleRunRCA = async () => {
    try {
      setLoadingAction('rca');
      setErrorMsg(null);
      await triggerRCA(incident.id);
      onIncidentUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'RCA execution failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemediate = async () => {
    try {
      setLoadingAction('remediate');
      setErrorMsg(null);
      await triggerRemediation(incident.id);
      onIncidentUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Remediation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVerify = async (simulateFailure = false) => {
    try {
      setLoadingAction(simulateFailure ? 'verify-fail' : 'verify-success');
      setErrorMsg(null);
      await triggerVerification(incident.id, simulateFailure);
      onIncidentUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const recoveryAction = incident.recovery_action;
  const isResolved = incident.status === 'RESOLVED';
  const isFailed = incident.status === 'FAILED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-700/90 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black font-mono text-white tracking-wide">
                  {incident.id}
                </h2>
                <StatusBadge status={incident.status} />
                <StatusBadge severity={incident.severity} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {incident.type} — Detected at <span className="font-mono text-slate-300">{incident.created_at}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Top Row: Problem & Root Cause Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Problem Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Problem Definition</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {incident.type} exceeded safety threshold.
              </p>
              <div className="mt-3 flex items-center justify-between p-3 bg-slate-950/80 rounded-lg border border-slate-800/90 font-mono">
                <div>
                  <div className="text-[11px] text-slate-400">Current Value</div>
                  <div className="text-xl font-bold text-red-400">{incident.current_value}%</div>
                </div>
                <div className="text-slate-600 font-sans font-bold text-lg">&gt;</div>
                <div>
                  <div className="text-[11px] text-slate-400">Safety Threshold</div>
                  <div className="text-xl font-bold text-slate-300">{incident.threshold}%</div>
                </div>
              </div>
            </div>

            {/* Root Cause Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Microscope className="w-4 h-4 text-purple-400" />
                  <span>Root Cause Analysis (RCA)</span>
                </div>
                {incident.confidence && (
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
                    Confidence: {incident.confidence}%
                  </span>
                )}
              </div>
              {incident.root_cause ? (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-purple-200">
                    {incident.root_cause}
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <strong className="text-slate-300">Evidence:</strong> {incident.evidence}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400 mb-2">RCA has not been performed yet.</p>
                  <button
                    onClick={handleRunRCA}
                    disabled={loadingAction === 'rca'}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    {loadingAction === 'rca' ? 'Analyzing...' : 'Run RCA'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Action & Remediation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span>Recommended Remediation Runbook</span>
            </div>
            <div className="text-sm font-semibold text-slate-200 mb-3">
              {incident.recommended_action || 'Determined during Root Cause Analysis.'}
            </div>

            {/* Verification Comparison Box */}
            <div className="mt-4 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Closed-Loop Verification (Before vs After)</span>
                {isResolved && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                    <Check className="w-3.5 h-3.5" /> RECOVERY SUCCESSFUL
                  </span>
                )}
                {isFailed && (
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1 font-mono">
                    <XCircle className="w-3.5 h-3.5" /> RECOVERY FAILED (ESCALATED)
                  </span>
                )}
              </div>

              {recoveryAction && recoveryAction.after_value !== null ? (
                <div className="grid grid-cols-3 gap-3 items-center text-center font-mono py-2">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-sans">Before Action</div>
                    <div className="text-2xl font-black text-red-400">{recoveryAction.before_value}%</div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-sans">After Action</div>
                    <div className={`text-2xl font-black ${isResolved ? 'text-emerald-400' : 'text-red-400'}`}>
                      {recoveryAction.after_value}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2 text-center">
                  Verification measurement will take place immediately after remediation execution.
                </div>
              )}
            </div>
          </div>

          {/* Visual Step-by-Step Incident Timeline */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Incident Event Timeline</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {incident.events && incident.events.length > 0 ? (
                incident.events.map((ev, i) => (
                  <div key={ev.id || i} className="flex items-start space-x-3 group">
                    <div className="w-16 text-slate-500 text-[11px] pt-0.5 flex-shrink-0">
                      {ev.timestamp}
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 mt-1.5 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 text-slate-300 flex-1 font-sans">
                      <span className="font-mono text-xs font-bold text-emerald-400 uppercase mr-2">
                        [{ev.event_type}]
                      </span>
                      {ev.message}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">No events recorded.</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center space-x-2">
            {!isResolved && !isFailed && (
              <>
                <button
                  onClick={handleRemediate}
                  disabled={loadingAction === 'remediate'}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{loadingAction === 'remediate' ? 'Executing...' : 'Execute Remediation'}</span>
                </button>

                <button
                  onClick={() => handleVerify(false)}
                  disabled={loadingAction === 'verify-success'}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{loadingAction === 'verify-success' ? 'Verifying...' : 'Verify Recovery'}</span>
                </button>

                <button
                  onClick={() => handleVerify(true)}
                  disabled={loadingAction === 'verify-fail'}
                  className="px-3 py-2 rounded-lg bg-red-950/80 hover:bg-red-900/90 border border-red-800 text-red-300 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  title="Simulate failed recovery to demonstrate escalation"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Simulate Failure / Escalate</span>
                </button>
              </>
            )}

            {isResolved && (
              <div className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800/80 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>INCIDENT FULLY RESOLVED &amp; VERIFIED</span>
              </div>
            )}

            {isFailed && (
              <div className="text-xs font-bold text-red-400 bg-red-950/80 px-3 py-1.5 rounded-lg border border-red-800/80 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>ESCALATED TO TIER-2 ON-CALL</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

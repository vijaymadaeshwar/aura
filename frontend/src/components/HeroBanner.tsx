import React from 'react';
import { Eye, AlertCircle, Microscope, Wrench, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { HealthStatus, IncidentStatus } from '../types';

interface HeroBannerProps {
  healthStatus: HealthStatus;
  currentIncidentStatus?: IncidentStatus;
  activeIncidentsCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  healthStatus,
  currentIncidentStatus,
  activeIncidentsCount,
}) => {
  // Determine which step in the closed loop is currently highlighted
  const getActiveStep = () => {
    if (!currentIncidentStatus || currentIncidentStatus === 'RESOLVED') return 'OBSERVE';
    if (currentIncidentStatus === 'DETECTED') return 'DETECT';
    if (currentIncidentStatus === 'INVESTIGATING') return 'DIAGNOSE';
    if (currentIncidentStatus === 'REMEDIATING') return 'REMEDIATE';
    if (currentIncidentStatus === 'VERIFYING') return 'VERIFY';
    if (currentIncidentStatus === 'FAILED') return 'ESCALATE';
    return 'OBSERVE';
  };

  const activeStep = getActiveStep();

  const steps = [
    { key: 'OBSERVE', label: '1. OBSERVE', icon: <Eye className="w-4 h-4" />, desc: 'psutil Telemetry' },
    { key: 'DETECT', label: '2. DETECT', icon: <AlertCircle className="w-4 h-4" />, desc: 'Threshold Breach' },
    { key: 'DIAGNOSE', label: '3. DIAGNOSE', icon: <Microscope className="w-4 h-4" />, desc: 'Rule-Based RCA' },
    { key: 'REMEDIATE', label: '4. REMEDIATE', icon: <Wrench className="w-4 h-4" />, desc: 'Runbook Action' },
    { key: 'VERIFY', label: '5. VERIFY', icon: <CheckCircle2 className="w-4 h-4" />, desc: 'Post-Delta Check' },
  ];

  return (
    <div className="bg-gradient-to-r from-[#111827] via-[#161F33] to-[#111827] border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden mb-6">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Autonomous Reliability Platform</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Observe. Diagnose. Recover. Verify.
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl font-normal">
            Automating the reliability loop from incident detection to verified recovery. 
            Deterministic rule-based RCA with closed-loop post-remediation verification.
          </p>
        </div>

        {/* Big Health Badge Card */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-5 py-3.5 rounded-xl self-start lg:self-auto shadow-inner">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System State</div>
            <div className={`text-xl font-extrabold tracking-wide font-mono ${
              healthStatus === 'CRITICAL' ? 'text-red-400' :
              healthStatus === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {healthStatus}
            </div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Incidents</div>
            <div className={`text-xl font-extrabold font-mono ${activeIncidentsCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {activeIncidentsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Loop Visual Stepper */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Reliability Automation Loop
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 lg:gap-3">
          {steps.map((s, idx) => {
            const isCurrent = activeStep === s.key;
            return (
              <div
                key={s.key}
                className={`relative rounded-xl p-3 border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-emerald-950/60 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400'
                    : 'bg-slate-900/60 border-slate-800/70 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold font-mono ${isCurrent ? 'text-emerald-300' : 'text-slate-300'}`}>
                    {s.label}
                  </span>
                  <span className={isCurrent ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}>
                    {s.icon}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium truncate">
                  {s.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

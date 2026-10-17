import React from 'react';
import { SystemMetrics, TelemetrySnapshot } from '../types';
import { HealthChart } from '../components/HealthChart';
import { MetricCard } from '../components/MetricCard';
import { Activity, Clock, ShieldCheck, Server, Cpu, HardDrive, Zap, Network } from 'lucide-react';

interface SystemHealthPageProps {
  metrics: SystemMetrics | null;
  history: TelemetrySnapshot[];
}

export const SystemHealthPage: React.FC<SystemHealthPageProps> = ({ metrics, history }) => {
  const cpuVal = metrics?.cpu ?? 15.0;
  const memVal = metrics?.memory ?? 52.0;
  const diskVal = metrics?.disk ?? 48.0;
  const netVal = metrics?.network_mb_s ?? 1.2;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            System Health &amp; Observability
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Module 1: Real-time telemetry monitoring via psutil kernel metrics collector.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Host Uptime:</span>
          <span className="text-emerald-400 font-bold">{metrics?.uptime_formatted || 'Online'}</span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Utilization"
          value={cpuVal}
          unit="%"
          threshold={80}
          icon={Cpu}
          status={cpuVal >= 80 ? 'CRITICAL' : cpuVal >= 70 ? 'WARNING' : 'NORMAL'}
          subtext="psutil.cpu_percent"
          isSimulated={metrics?.is_simulated}
        />
        <MetricCard
          title="RAM Memory"
          value={memVal}
          unit="%"
          threshold={85}
          icon={Zap}
          status={memVal >= 85 ? 'CRITICAL' : memVal >= 75 ? 'WARNING' : 'NORMAL'}
          subtext="psutil.virtual_memory"
          isSimulated={metrics?.is_simulated}
        />
        <MetricCard
          title="Storage (Disk)"
          value={diskVal}
          unit="%"
          threshold={90}
          icon={HardDrive}
          status={diskVal >= 90 ? 'CRITICAL' : 'NORMAL'}
          subtext="psutil.disk_usage"
        />
        <MetricCard
          title="Network Throughput"
          value={netVal}
          unit="MB/s"
          icon={Network}
          status="NORMAL"
          subtext="psutil.net_io_counters"
        />
      </div>

      {/* Real-Time Telemetry Chart */}
      <HealthChart data={history} cpuThreshold={80} memoryThreshold={85} />

      {/* Host Architecture Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Telemetry Engine</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Collector:</span>
              <span>Python psutil</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Protocol:</span>
              <span>REST API JSON</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Sampling Rate:</span>
              <span>3.0s</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-sans">Simulation Mode:</span>
              <span className={metrics?.is_simulated ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {metrics?.is_simulated ? 'ACTIVE' : 'HARDWARE LIVE'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Safety Thresholds</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">CPU Limit:</span>
              <span className="text-amber-400 font-bold">80.0%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Memory Limit:</span>
              <span className="text-amber-400 font-bold">85.0%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Disk Limit:</span>
              <span className="text-amber-400 font-bold">90.0%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-sans">Auto-Remediation:</span>
              <span className="text-emerald-400 font-bold">ENABLED</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Reliability Loop State</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Stage 1 (Observe):</span>
              <span className="text-emerald-400">ACTIVE</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Stage 2 (Detect):</span>
              <span className="text-emerald-400">ONLINE</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500 font-sans">Stage 3 (Diagnose):</span>
              <span className="text-purple-400">RULE-BASED</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-sans">Stage 4-5 (Recover):</span>
              <span className="text-blue-400">CLOSED-LOOP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

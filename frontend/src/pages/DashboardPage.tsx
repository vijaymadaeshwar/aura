import React from 'react';
import { 
  SystemMetrics, 
  TelemetrySnapshot, 
  Incident, 
  IncidentEvent, 
  LogEntry, 
  RecoveryAction 
} from '../types';
import { HeroBanner } from '../components/HeroBanner';
import { MetricCard } from '../components/MetricCard';
import { HealthChart } from '../components/HealthChart';
import { IncidentTable } from '../components/IncidentTable';
import { SimulatorControls } from '../components/SimulatorControls';
import { EventLogStream } from '../components/EventLogStream';
import { Cpu, HardDrive, Zap, Network, ShieldCheck } from 'lucide-react';

interface DashboardPageProps {
  metrics: SystemMetrics | null;
  history: TelemetrySnapshot[];
  incidents: Incident[];
  events: IncidentEvent[];
  systemLogs: LogEntry[];
  activeActions: RecoveryAction[];
  onSelectIncident: (inc: Incident) => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  history,
  incidents,
  events,
  systemLogs,
  activeActions,
  onSelectIncident,
  onRefresh,
}) => {
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const latestIncident = activeIncidents.length > 0 ? activeIncidents[0] : incidents[0];

  const getMetricStatus = (val: number, threshold: number): 'NORMAL' | 'WARNING' | 'CRITICAL' => {
    if (val >= threshold) return 'CRITICAL';
    if (val >= threshold - 10) return 'WARNING';
    return 'NORMAL';
  };

  const cpuVal = metrics?.cpu ?? 15.0;
  const memVal = metrics?.memory ?? 52.0;
  const diskVal = metrics?.disk ?? 48.0;
  const netVal = metrics?.network_mb_s ?? 1.2;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <HeroBanner
        healthStatus={metrics?.status || 'HEALTHY'}
        currentIncidentStatus={latestIncident?.status}
        activeIncidentsCount={activeIncidents.length}
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Utilization"
          value={cpuVal}
          unit="%"
          threshold={80}
          icon={Cpu}
          status={getMetricStatus(cpuVal, 80)}
          subtext="psutil hardware metric"
          isSimulated={metrics?.is_simulated}
        />
        <MetricCard
          title="Memory (RAM)"
          value={memVal}
          unit="%"
          threshold={85}
          icon={Zap}
          status={getMetricStatus(memVal, 85)}
          subtext="Virtual memory heap"
          isSimulated={metrics?.is_simulated}
        />
        <MetricCard
          title="Disk Space"
          value={diskVal}
          unit="%"
          threshold={90}
          icon={HardDrive}
          status={getMetricStatus(diskVal, 90)}
          subtext="Root partition volume"
        />
        <MetricCard
          title="Network I/O"
          value={netVal}
          unit="MB/s"
          icon={Network}
          status="NORMAL"
          subtext="Combined transfer rate"
        />
      </div>

      {/* Interactive Simulator Section */}
      <SimulatorControls onSimulationTriggered={onRefresh} />

      {/* Real-Time Health Chart */}
      <HealthChart data={history} cpuThreshold={80} memoryThreshold={85} />

      {/* Active Incidents & Live Event Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <IncidentTable
            incidents={activeIncidents}
            onSelectIncident={onSelectIncident}
            title="Active Incidents"
            emptyMessage="All subsystems healthy. No open reliability incidents."
          />
        </div>
        <div className="lg:col-span-5">
          <EventLogStream
            events={events}
            systemLogs={systemLogs}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </div>
  );
};

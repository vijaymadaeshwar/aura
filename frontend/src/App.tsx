import React, { useState, useEffect, useCallback } from 'react';
import { 
  SystemMetrics, 
  TelemetrySnapshot, 
  Incident, 
  IncidentEvent, 
  LogEntry, 
  RecoveryAction, 
  Runbook 
} from './types';
import { 
  fetchCurrentMetrics, 
  fetchTelemetryHistory, 
  fetchIncidents, 
  fetchActiveRemediations, 
  fetchRecoveryHistory, 
  fetchAllEvents, 
  fetchSystemLogs, 
  fetchRunbooks,
  triggerSimulatorScenario
} from './services/api';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { IncidentDetailModal } from './components/IncidentDetailModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { RunbooksPage } from './pages/RunbooksPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<TelemetrySnapshot[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeActions, setActiveActions] = useState<RecoveryAction[]>([]);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryAction[]>([]);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [
        metricsData, 
        historyData, 
        incidentsData, 
        activeData, 
        recHistData, 
        eventsData, 
        logsData, 
        runbooksData
      ] = await Promise.all([
        fetchCurrentMetrics(),
        fetchTelemetryHistory(30),
        fetchIncidents(undefined, 50),
        fetchActiveRemediations(),
        fetchRecoveryHistory(50),
        fetchAllEvents(50),
        fetchSystemLogs(50),
        fetchRunbooks(),
      ]);

      setMetrics(metricsData);
      setHistory(historyData);
      setIncidents(incidentsData);
      setActiveActions(activeData);
      setRecoveryHistory(recHistData);
      setEvents(eventsData);
      setSystemLogs(logsData);
      setRunbooks(runbooksData);
      setLastUpdated(new Date().toLocaleTimeString());
      setIsBackendOffline(false);

      // Keep selected incident updated if modal is open
      if (selectedIncident) {
        const updated = incidentsData.find((i) => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (err) {
      console.warn('Backend polling warning:', err);
      setIsBackendOffline(true);
    }
  }, [selectedIncident]);

  useEffect(() => {
    loadData();
    // 3-second polling interval for real-time observability
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleQuickSimulate = async () => {
    try {
      await triggerSimulatorScenario('high-cpu', true);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const activeIncidentsCount = incidents.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <div className="flex bg-[#0B1120] text-slate-100 min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        activeIncidentsCount={activeIncidentsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          status={metrics?.status || 'HEALTHY'}
          lastUpdated={lastUpdated}
          isSimulated={metrics?.is_simulated || false}
          onRefresh={loadData}
          onQuickSimulate={handleQuickSimulate}
        />

        {/* Backend Offline Warning Banner */}
        {isBackendOffline && (
          <div className="bg-amber-950/90 border-b border-amber-800 text-amber-300 px-6 py-2.5 text-xs flex items-center justify-between font-mono">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Connecting to AURA REST backend on http://localhost:8000/api...</span>
            </div>
            <button
              onClick={loadData}
              className="underline text-amber-200 hover:text-white font-sans"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              metrics={metrics}
              history={history}
              incidents={incidents}
              events={events}
              systemLogs={systemLogs}
              activeActions={activeActions}
              onSelectIncident={setSelectedIncident}
              onRefresh={loadData}
            />
          )}

          {currentPage === 'health' && (
            <SystemHealthPage metrics={metrics} history={history} />
          )}

          {currentPage === 'incidents' && (
            <IncidentsPage
              incidents={incidents}
              onSelectIncident={setSelectedIncident}
              onRefresh={loadData}
            />
          )}

          {currentPage === 'recovery' && (
            <RecoveryPage
              activeActions={activeActions}
              recoveryHistory={recoveryHistory}
              onRefresh={loadData}
            />
          )}

          {currentPage === 'runbooks' && (
            <RunbooksPage runbooks={runbooks} />
          )}

          {currentPage === 'simulator' && (
            <SimulatorPage onSimulationTriggered={loadData} />
          )}

          {currentPage === 'history' && (
            <HistoryPage
              incidents={incidents}
              onSelectIncident={setSelectedIncident}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage onSettingsUpdated={loadData} />
          )}
        </main>
      </div>

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onIncidentUpdated={loadData}
      />
    </div>
  );
};
export default App;

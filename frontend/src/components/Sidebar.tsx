import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  AlertTriangle, 
  RotateCcw, 
  BookOpen, 
  Flame, 
  History as HistoryIcon, 
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export type PageId = 
  | 'dashboard' 
  | 'health' 
  | 'incidents' 
  | 'recovery' 
  | 'runbooks' 
  | 'simulator' 
  | 'history' 
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  activeIncidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  activeIncidentsCount
}) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'health', label: 'System Health', icon: <Activity className="w-5 h-5" /> },
    { id: 'incidents', label: 'Incidents', icon: <AlertTriangle className="w-5 h-5" />, badge: activeIncidentsCount },
    { id: 'recovery', label: 'Recovery', icon: <RotateCcw className="w-5 h-5" /> },
    { id: 'runbooks', label: 'Runbooks', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'simulator', label: 'Simulator', icon: <Flame className="w-5 h-5 text-amber-400" /> },
    { id: 'history', label: 'History', icon: <HistoryIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 select-none z-20">
      {/* Brand & Logo */}
      <div>
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Cpu className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-wider font-mono">
                AURA <span className="text-emerald-400 font-black">MINI</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Reliability Agent</p>
            </div>
          </div>
          <div className="mt-4 px-2.5 py-1.5 bg-slate-900/90 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mode</span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              AUTONOMOUS
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white font-bold text-xs px-2 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium">Agent Engine</span>
          <span className="text-xs font-mono text-slate-300">v1.0.0</span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-2 bg-slate-900 rounded-lg border border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider">● ONLINE</span>
          <span className="text-slate-500 text-[11px] ml-auto">Closed-Loop</span>
        </div>
      </div>
    </aside>
  );
};

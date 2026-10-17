import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { fetchSettings, updateSettings } from '../services/api';
import { Settings, Shield, Sliders, CheckCircle2, AlertCircle, Save } from 'lucide-react';

interface SettingsPageProps {
  onSettingsUpdated?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsUpdated }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    cpu_threshold: 80.0,
    memory_threshold: 85.0,
    disk_threshold: 90.0,
    auto_remediation_enabled: true,
    polling_interval_sec: 3.0,
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((data) => setSettings(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          Reliability Agent Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure detection anomaly thresholds and autonomous closed-loop execution policies.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configuration saved successfully and updated in SQLite database.</span>
        </div>
      )}

      {/* Thresholds Card */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Incident Detection Thresholds</span>
        </div>

        {/* CPU Threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <label className="font-bold text-slate-200">CPU Breach Threshold</label>
            <span className="font-mono text-emerald-400 font-bold">{settings.cpu_threshold}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="95"
            step="1"
            value={settings.cpu_threshold}
            onChange={(e) => setSettings({ ...settings, cpu_threshold: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Triggers HIGH CPU incident and initiates RB-CPU-01 runbook diagnosis when exceeded.
          </p>
        </div>

        {/* Memory Threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <label className="font-bold text-slate-200">Memory (RAM) Breach Threshold</label>
            <span className="font-mono text-blue-400 font-bold">{settings.memory_threshold}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="98"
            step="1"
            value={settings.memory_threshold}
            onChange={(e) => setSettings({ ...settings, memory_threshold: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Triggers HIGH MEMORY incident and executes cache purge runbook RB-MEM-02 when exceeded.
          </p>
        </div>

        {/* Disk Threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <label className="font-bold text-slate-200">Disk Storage Breach Threshold</label>
            <span className="font-mono text-amber-400 font-bold">{settings.disk_threshold}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="99"
            step="1"
            value={settings.disk_threshold}
            onChange={(e) => setSettings({ ...settings, disk_threshold: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Triggers DISK PRESSURE incident and purges temporary log volume when exceeded.
          </p>
        </div>
      </div>

      {/* Autonomous Policy Card */}
      <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
          <Shield className="w-4 h-4 text-purple-400" />
          <span>Autonomous Execution Policy</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-900/80 rounded-xl border border-slate-800">
          <div>
            <div className="font-bold text-sm text-white">
              Autonomous Remediation Loop
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              When enabled, AURA automatically diagnoses, remediates, and verifies recovery without requiring human approval.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.auto_remediation_enabled}
              onChange={(e) => setSettings({ ...settings, auto_remediation_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>
    </div>
  );
};

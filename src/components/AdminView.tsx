import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Sliders,
  Flame,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building,
  Users,
  Shield,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { CampusLocation, HealthThresholds, User } from '../lib/types';
import { DEFAULT_HEALTH_THRESHOLDS } from '../lib/health-score';

interface AdminViewProps {
  locations: CampusLocation[];
  onRefreshAllData: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  locations,
  onRefreshAllData,
  onNavigateToTab,
}) => {
  const [thresholds, setThresholds] = useState<HealthThresholds>({ ...DEFAULT_HEALTH_THRESHOLDS });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [simulatingOutage, setSimulatingOutage] = useState<boolean>(false);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.weights) {
          setThresholds(data);
        }
      })
      .catch((err) => console.warn('Could not load thresholds:', err));
  }, []);

  const handleSaveThresholds = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds),
      });

      if (res.ok) {
        setSaveSuccess(true);
        onRefreshAllData();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateOutage = async () => {
    setSimulatingOutage(true);
    setSimulationMessage(null);

    try {
      const res = await fetch('/api/demo/simulate-outage', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationMessage(data.message);
        onRefreshAllData();
      }
    } catch (err) {
      console.error('Simulate outage error:', err);
    } finally {
      setSimulatingOutage(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        setSimulationMessage('Campus database has been reset to default clean seed state.');
        onRefreshAllData();
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <UserCheck className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Administrator Portal & System Configuration
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Adjust Network Health Score normalization formulas, manage campus facilities, and launch Hackathon Demo Scenarios.
        </p>
      </div>

      {/* Pitch Demo Mode Simulator Card (Crucial for the 3-minute pitch!) */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200 dark:border-amber-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500 text-white shadow-sm">
                <Flame className="w-5 h-5 fill-current" />
              </span>
              <h2 className="text-lg font-black text-amber-950 dark:text-amber-100">
                Hackathon Pitch Demo Simulator
              </h2>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              Demonstrate live reactive telemetry, automatic outage triggers, red heatmap transition, and AI diagnostics during your 3-minute presentation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDemo}
              className="py-2 px-3.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset All Demo Data
            </button>
          </div>
        </div>

        {simulationMessage && (
          <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            {simulationMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Action 1: Simulate Library Outage */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Zap className="w-4 h-4 text-rose-500" />
              Simulate Sudden Library Floor 2 Outage
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Injects 4 degraded speed tests (high ping, 12% loss) and 3 student complaints within 5 minutes.
              Watch the <strong>Automatic Outage Detector</strong> fire, the <strong>Heatmap</strong> glow Red, and the <strong>AI Incident Brief</strong> appear.
            </p>
            <div className="pt-2">
              <button
                onClick={handleSimulateOutage}
                disabled={simulatingOutage}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {simulatingOutage ? 'Simulating Traffic Degradation...' : 'Trigger Library Outage Live'}
              </button>
            </div>
          </div>

          {/* Action 2: Inspect Live Reaction */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <Activity className="w-4 h-4 text-indigo-500" />
                Live Verification Flow
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Once triggered, open the <strong>Live Heatmap</strong> or <strong>IT NOC</strong> to inspect the reactive change.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onNavigateToTab('dashboard')}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 transition-colors cursor-pointer"
              >
                View Heatmap &rarr;
              </button>
              <button
                onClick={() => onNavigateToTab('it_support')}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                View IT NOC &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Network Health Score Formula Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Network Health Score Formula Weights & Thresholds
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Governs <code className="font-mono text-indigo-600 dark:text-indigo-400">src/lib/health-score.ts</code>. Calibrate campus network performance baselines.
            </p>
          </div>

          <button
            onClick={handleSaveThresholds}
            disabled={isSaving}
            className="py-2.5 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Updating...' : saveSuccess ? 'Saved Successfully!' : 'Save New Thresholds'}
          </button>
        </div>

        {/* Weights Sliders Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Formula Component Weights (Total Must Equal 100%)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Download Weight */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Download</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {Math.round(thresholds.weights.download * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={Math.round(thresholds.weights.download * 100)}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    weights: { ...thresholds.weights, download: Number(e.target.value) / 100 },
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Default 30%</span>
            </div>

            {/* Upload Weight */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Upload</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {Math.round(thresholds.weights.upload * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={Math.round(thresholds.weights.upload * 100)}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    weights: { ...thresholds.weights, upload: Number(e.target.value) / 100 },
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Default 15%</span>
            </div>

            {/* Ping Weight */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Ping / Latency</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {Math.round(thresholds.weights.ping * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={Math.round(thresholds.weights.ping * 100)}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    weights: { ...thresholds.weights, ping: Number(e.target.value) / 100 },
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Default 25%</span>
            </div>

            {/* Packet Loss Weight */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Packet Loss</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {Math.round(thresholds.weights.packetLoss * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                step="5"
                value={Math.round(thresholds.weights.packetLoss * 100)}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    weights: { ...thresholds.weights, packetLoss: Number(e.target.value) / 100 },
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Default 20%</span>
            </div>

            {/* Jitter Weight */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Jitter</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {Math.round(thresholds.weights.jitter * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="5"
                value={Math.round(thresholds.weights.jitter * 100)}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    weights: { ...thresholds.weights, jitter: Number(e.target.value) / 100 },
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Default 10%</span>
            </div>
          </div>
        </div>

        {/* Target Benchmark Thresholds */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Target Benchmark Thresholds (What counts as 100% ideal)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-600 dark:text-slate-300 font-semibold block">
                Target Download Benchmark (Mbps)
              </label>
              <input
                type="number"
                value={thresholds.targetDownloadMbps}
                onChange={(e) =>
                  setThresholds({ ...thresholds, targetDownloadMbps: Number(e.target.value) })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Default: 50 Mbps</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-600 dark:text-slate-300 font-semibold block">
                Target Ping Benchmark (ms)
              </label>
              <input
                type="number"
                value={thresholds.targetPingMs}
                onChange={(e) =>
                  setThresholds({ ...thresholds, targetPingMs: Number(e.target.value) })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Default: 25 ms or below</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-600 dark:text-slate-300 font-semibold block">
                Target Upload Benchmark (Mbps)
              </label>
              <input
                type="number"
                value={thresholds.targetUploadMbps}
                onChange={(e) =>
                  setThresholds({ ...thresholds, targetUploadMbps: Number(e.target.value) })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400">Default: 20 Mbps</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

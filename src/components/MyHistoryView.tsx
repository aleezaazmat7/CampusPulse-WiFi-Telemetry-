import React, { useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Clock,
  Calendar,
  Download,
  Filter,
  Search,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SpeedTestResult, User } from '../lib/types';
import { getHealthStatusColors } from '../lib/health-score';

interface MyHistoryViewProps {
  tests: SpeedTestResult[];
  currentUser: User;
  onRunNewTest: () => void;
}

export const MyHistoryView: React.FC<MyHistoryViewProps> = ({
  tests,
  currentUser,
  onRunNewTest,
}) => {
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Filter for this user's tests or all tests if demo
  const userTests = tests.filter((t) => {
    if (locationFilter !== 'all' && t.locationId !== locationFilter) return false;
    return true;
  });

  const avgDownload =
    userTests.length > 0 ? userTests.reduce((a, b) => a + b.downloadSpeed, 0) / userTests.length : 0;
  const avgUpload =
    userTests.length > 0 ? userTests.reduce((a, b) => a + b.uploadSpeed, 0) / userTests.length : 0;
  const avgPing =
    userTests.length > 0 ? userTests.reduce((a, b) => a + b.ping, 0) / userTests.length : 0;

  // Locations set
  const locationsList = Array.from(new Set(tests.map((t) => t.locationName)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              My Speed Test History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your personal network measurements, historical bandwidth trendlines, and latency stability.
          </p>
        </div>

        <button
          onClick={onRunNewTest}
          className="self-start sm:self-auto py-2.5 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Activity className="w-4 h-4" /> Run New Speed Test
        </button>
      </div>

      {/* Personal KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tests Recorded</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {userTests.length}
          </span>
          <span className="text-xs text-slate-500">Across campus facilities</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Download</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {avgDownload.toFixed(1)} <span className="text-xs font-semibold text-slate-400">Mbps</span>
          </span>
          <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Multi-stream throughput</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Upload</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {avgUpload.toFixed(1)} <span className="text-xs font-semibold text-slate-400">Mbps</span>
          </span>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">File transfer rate</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Latency</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {Math.round(avgPing)} <span className="text-xs font-semibold text-slate-400">ms</span>
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Round-trip ping</span>
        </div>
      </div>

      {/* Visual Bandwidth Trend Sparkline (Clean Responsive SVG) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2">
          Historical Speed Trend (Recent 20 Tests)
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Download throughput variations across tested locations.
        </p>

        {userTests.length > 1 ? (
          <div className="w-full h-40 relative flex items-end">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 120">
              {/* Grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" />

              {/* Path */}
              {(() => {
                const sample = userTests.slice(0, 20).reverse();
                const maxSpeed = Math.max(...sample.map((s) => s.downloadSpeed), 80);
                const points = sample.map((s, idx) => {
                  const x = (idx / (sample.length - 1)) * 500;
                  const y = 110 - (s.downloadSpeed / maxSpeed) * 90;
                  return `${x},${y}`;
                });
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points.join(' ')}
                    />
                    {sample.map((s, idx) => {
                      const x = (idx / (sample.length - 1)) * 500;
                      const y = 110 - (s.downloadSpeed / maxSpeed) * 90;
                      return (
                        <circle
                          key={s.id}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#ffffff"
                          stroke="#6366f1"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            Run a few speed tests to generate a trendline.
          </div>
        )}
      </div>

      {/* Tests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Individual Test Records ({userTests.length})
          </h3>
          <span className="text-xs text-slate-400">Sorted newest first</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Location</th>
                <th className="pb-3">Building</th>
                <th className="pb-3 text-center">Download</th>
                <th className="pb-3 text-center">Upload</th>
                <th className="pb-3 text-center">Latency</th>
                <th className="pb-3 text-center">Packet Loss</th>
                <th className="pb-3 text-center">Health Score</th>
                <th className="pb-3 text-right">Tested At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {userTests.slice(0, 25).map((t) => {
                const colors = getHealthStatusColors(t.healthStatus);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      {t.locationName}
                      {t.isAnomaly && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          -40% Anomaly
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500">{t.building}</td>
                    <td className="py-3 text-center font-bold text-slate-900 dark:text-white">
                      {t.downloadSpeed} Mbps
                    </td>
                    <td className="py-3 text-center text-slate-700 dark:text-slate-300">
                      {t.uploadSpeed} Mbps
                    </td>
                    <td className="py-3 text-center text-slate-700 dark:text-slate-300">
                      {t.ping} ms
                    </td>
                    <td className="py-3 text-center text-slate-700 dark:text-slate-300">
                      {t.packetLoss}%
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                        style={{
                          backgroundColor: colors.ring + '20',
                          color: colors.ring,
                        }}
                      >
                        {t.healthScore} ({t.healthStatus})
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400">
                      {new Date(t.testedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(t.testedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  MapPin,
  TrendingUp,
  RefreshCw,
  Zap,
  ShieldAlert,
  Sparkles,
  BarChart2,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CampusLocation, SystemKPIs, SpeedTestResult, Complaint, OutageAlert } from '../lib/types';
import { CampusHeatmap } from './CampusHeatmap';
import { getHealthStatusColors } from '../lib/health-score';
import { CampusTrafficSignalBar, TrafficSignalLight, getTrafficSignalFromScore } from './TrafficSignalIndicator';

interface DashboardViewProps {
  stats: SystemKPIs;
  locations: CampusLocation[];
  tests: SpeedTestResult[];
  complaints: Complaint[];
  outages: OutageAlert[];
  onSelectLocationForTest: (locId: string) => void;
  onOpenIncidentBrief: (locId: string) => void;
  onRefreshData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  locations,
  tests,
  complaints,
  outages,
  onSelectLocationForTest,
  onOpenIncidentBrief,
  onRefreshData,
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const buildings = Array.from(new Set(locations.map((l) => l.building)));

  const filteredLocations = locations.filter((loc) => {
    if (selectedBuilding !== 'all' && loc.building !== selectedBuilding) return false;
    if (statusFilter !== 'all' && loc.currentStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.building.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeOutages = outages.filter((o) => o.status === 'active');

  return (
    <div className="space-y-8">
      {/* Active Outage Emergency Banner */}
      {activeOutages.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-400 dark:border-rose-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-rose-600 text-white shrink-0 shadow-sm animate-bounce">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-rose-900 dark:text-rose-100">
                    Active Wi-Fi Outage in Progress
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white">
                    {activeOutages.length} Alert{activeOutages.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-200 mt-1 leading-relaxed">
                  {activeOutages[0].reason}
                </p>
                {activeOutages[0].aiDiagnosis && (
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 italic">
                    AI NOC Hypothesis: "{activeOutages[0].aiDiagnosis}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenIncidentBrief(activeOutages[0].locationId)}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Inspect AI Incident Brief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campus Traffic Signals Bar (Judges' Request) */}
      <CampusTrafficSignalBar
        greenCount={locations.filter((l) => l.currentHealthScore >= 75 && !activeOutages.some((o) => o.locationId === l.id)).length}
        amberCount={locations.filter((l) => l.currentHealthScore >= 50 && l.currentHealthScore < 75 && !activeOutages.some((o) => o.locationId === l.id)).length}
        redCount={locations.filter((l) => l.currentHealthScore < 50 || activeOutages.some((o) => o.locationId === l.id)).length}
        onFilterSignal={(sig) => {
          if (sig === 'all') setStatusFilter('all');
          else if (sig === 'green') setStatusFilter('Excellent');
          else if (sig === 'amber') setStatusFilter('Fair');
          else if (sig === 'red') setStatusFilter('Critical');
        }}
        activeFilter={statusFilter === 'all' ? 'all' : statusFilter === 'Excellent' ? 'green' : statusFilter === 'Fair' ? 'amber' : 'red'}
      />

      {/* KPI Cards Row (8 KPIs required by specification) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total tests today */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tests Today</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {stats.totalTestsToday}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <Activity className="w-3 h-3" /> Live pulses
          </span>
        </div>

        {/* Avg Download */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Download</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {stats.avgDownload} <span className="text-xs font-medium text-slate-400">Mbps</span>
          </span>
          <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <ArrowDown className="w-3 h-3" /> Campuswide
          </span>
        </div>

        {/* Avg Upload */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Upload</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {stats.avgUpload} <span className="text-xs font-medium text-slate-400">Mbps</span>
          </span>
          <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <ArrowUp className="w-3 h-3" /> Campuswide
          </span>
        </div>

        {/* Avg Ping */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Latency</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {stats.avgPing} <span className="text-xs font-medium text-slate-400">ms</span>
          </span>
          <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <Clock className="w-3 h-3" /> Round-trip
          </span>
        </div>

        {/* Poor Locations */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Degraded Spots</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {stats.poorLocationsCount}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">Score &lt; 50</span>
        </div>

        {/* Open Complaints */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Open Tickets</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {stats.openComplaintsCount}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">In triage pipeline</span>
        </div>

        {/* Resolved Complaints */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {stats.resolvedComplaintsCount}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Verified fixed</span>
        </div>

        {/* Current Outages */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outages</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {stats.activeOutagesCount}
          </span>
          <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">Active alerts</span>
        </div>
      </div>

      {/* Main Interactive Campus Heatmap */}
      <CampusHeatmap
        locations={locations}
        activeOutages={outages}
        onSelectLocationForTest={onSelectLocationForTest}
        onOpenIncidentBrief={onOpenIncidentBrief}
      />

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campus facility, building, floor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Building Filter */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Buildings</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Health Statuses</option>
            <option value="Excellent">Excellent (&gt;85)</option>
            <option value="Good">Good (70-84)</option>
            <option value="Fair">Fair (50-69)</option>
            <option value="Poor">Poor (30-49)</option>
            <option value="Critical">Critical (&lt;30)</option>
          </select>

          <button
            onClick={onRefreshData}
            title="Refresh Realtime Telemetry"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Campus Location Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Monitored Campus Locations ({filteredLocations.length})
          </h3>
          <span className="text-xs text-slate-500">Live crowdsourced test averages</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLocations.map((loc) => {
            const colors = getHealthStatusColors(loc.currentStatus);
            const hasOutage = activeOutages.some((o) => o.locationId === loc.id);

            return (
              <div
                key={loc.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        {loc.building}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                        {loc.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{loc.floor}</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-xl font-black ${colors.text}`}>
                        {loc.currentHealthScore}
                      </span>
                      <span className="text-[9px] block text-slate-400 font-semibold leading-none">/100</span>
                    </div>
                  </div>

                  {/* Status & Outage Warning Pill */}
                  <div className="flex items-center gap-1.5 mt-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{
                        borderColor: colors.ring + '40',
                        backgroundColor: colors.ring + '15',
                        color: colors.ring,
                      }}
                    >
                      {loc.currentStatus}
                    </span>
                    {hasOutage && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                        OUTAGE
                      </span>
                    )}
                  </div>

                  {/* Telemetry Stats Matrix */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Avg Download</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {loc.metrics?.avgDownload || 0} Mbps
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Latency / Ping</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {loc.metrics?.avgPing || 0} ms
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tests Today</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {loc.metrics?.testsCountToday || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Complaints</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {loc.metrics?.complaintsCountToday || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectLocationForTest(loc.id)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" /> Run Test Here
                  </button>

                  <button
                    onClick={() => onOpenIncidentBrief(loc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="View AI Diagnostics"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Stream: Real-Time Speed Tests & User Complaints Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Speed Tests Feed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Live Test Telemetry Stream
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">Auto-refreshed</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {tests.slice(0, 8).map((t) => {
              const colors = getHealthStatusColors(t.healthStatus);
              return (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{t.locationName}</span>
                      {t.isAnomaly && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          Anomaly -40%
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {t.userName || 'Student'} &bull; {new Date(t.testedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-black text-slate-900 dark:text-white block">
                        {t.downloadSpeed} Mbps
                      </span>
                      <span className="text-[10px] text-slate-400">{t.ping} ms ping</span>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: colors.ring + '20',
                        color: colors.ring,
                      }}
                    >
                      {t.healthScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Complaints Feed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Recent Network Problem Reports
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">Student submissions</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {complaints.slice(0, 8).map((c) => {
              return (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{c.locationName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {c.complaintType}
                      </span>
                    </div>
                    <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                      c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                      c.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                    "{c.description}"
                  </p>

                  {c.aiLikelyCause && (
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 pt-0.5">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>AI Diagnosis: {c.aiLikelyCause}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

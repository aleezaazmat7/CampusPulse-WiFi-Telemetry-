import React, { useState } from 'react';
import {
  MapPin,
  Wifi,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { CampusLocation, HealthStatus, OutageAlert } from '../lib/types';
import { getHealthStatusColors } from '../lib/health-score';
import { TrafficSignalLight, getTrafficSignalFromScore } from './TrafficSignalIndicator';

interface CampusHeatmapProps {
  locations: CampusLocation[];
  activeOutages: OutageAlert[];
  onSelectLocationForTest?: (locationId: string) => void;
  onOpenIncidentBrief?: (locationId: string) => void;
}

export const CampusHeatmap: React.FC<CampusHeatmapProps> = ({
  locations,
  activeOutages,
  onSelectLocationForTest,
  onOpenIncidentBrief,
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[3]?.id || locations[0]?.id);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');

  const selectedLoc = locations.find((l) => l.id === selectedLocId) || locations[0];
  const locOutage = activeOutages.find((o) => o.locationId === selectedLoc?.id && o.status === 'active');

  const getStatusBg = (status: HealthStatus) => {
    switch (status) {
      case 'Excellent':
        return '#10b981'; // emerald-500
      case 'Good':
        return '#84cc16'; // lime-500
      case 'Fair':
        return '#f59e0b'; // amber-500
      case 'Poor':
        return '#f97316'; // orange-500
      case 'Critical':
      default:
        return '#f43f5e'; // rose-500
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <MapPin className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Interactive Campus Wi-Fi Heatmap
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              Live Crowdsourced Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time wireless signal dispersion & health index across 7 university facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden xl:flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-2 border-r border-slate-200 dark:border-slate-800 pr-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> &gt;85 Excellent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-500" /> 70-84 Good
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 50-69 Fair
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> 30-49 Poor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> &lt;30 Critical
            </span>
          </div>

          {/* Toggle Map / Grid View */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Architectural Map
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Facility Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Container: Map or Grid on Left, Deep-Dive Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Heatmap Area */}
        <div className="lg:col-span-8 p-4 sm:p-6 bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden flex flex-col justify-between">
          {viewMode === 'map' ? (
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[360px] rounded-xl border border-slate-800 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] p-4 flex items-center justify-center">
              {/* Campus Architectural Blueprint SVGs */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                {/* Building Boundaries */}
                <rect x="8%" y="15%" width="32%" height="45%" rx="12" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="10%" y="22%" fill="#94a3b8" fontSize="10" fontWeight="bold">SCIENCE & TECH COMPLEX</text>

                <rect x="44%" y="8%" width="26%" height="40%" rx="12" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="46%" y="15%" fill="#94a3b8" fontSize="10" fontWeight="bold">CENTRAL LIBRARY</text>

                <rect x="32%" y="58%" width="24%" height="34%" rx="12" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="34%" y="65%" fill="#94a3b8" fontSize="10" fontWeight="bold">STUDENT COMMONS</text>

                <rect x="68%" y="32%" width="24%" height="30%" rx="12" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="70%" y="39%" fill="#94a3b8" fontSize="10" fontWeight="bold">ADMINISTRATION</text>

                <rect x="70%" y="68%" width="24%" height="26%" rx="12" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="72%" y="75%" fill="#94a3b8" fontSize="10" fontWeight="bold">RESIDENTIAL QUAD</text>

                {/* Campus Walkways */}
                <path d="M 28% 40% Q 40% 45% 54% 28%" fill="none" stroke="#334155" strokeWidth="2" />
                <path d="M 54% 30% Q 60% 48% 44% 70%" fill="none" stroke="#334155" strokeWidth="2" />
                <path d="M 44% 75% Q 65% 72% 78% 50%" fill="none" stroke="#334155" strokeWidth="2" />
              </svg>

              {/* Location Heatmap Nodes */}
              {locations.map((loc) => {
                const isSelected = selectedLocId === loc.id;
                const hasOutage = activeOutages.some((o) => o.locationId === loc.id && o.status === 'active');
                const nodeColor = getStatusBg(loc.currentStatus);

                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocId(loc.id)}
                    style={{ left: `${loc.coordinates.x}%`, top: `${loc.coordinates.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer focus:outline-none"
                    title={`${loc.name} - Score: ${loc.currentHealthScore}/100 (${loc.currentStatus})`}
                  >
                    {/* Glowing outer pulse halo */}
                    <span
                      style={{ backgroundColor: nodeColor }}
                      className={`absolute -inset-3 rounded-full opacity-35 ${
                        hasOutage || loc.currentStatus === 'Critical' ? 'animate-ping' : 'animate-pulse'
                      }`}
                    />

                    {/* Secondary larger dispersion aura */}
                    <span
                      style={{
                        background: `radial-gradient(circle, ${nodeColor}44 0%, transparent 70%)`,
                      }}
                      className="absolute -inset-8 rounded-full pointer-events-none"
                    />

                    {/* Node Core */}
                    <div
                      style={{
                        borderColor: isSelected ? '#ffffff' : nodeColor,
                        backgroundColor: '#0f172a',
                      }}
                      className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 flex flex-col items-center justify-center text-white shadow-lg transition-transform ${
                        isSelected ? 'scale-125 ring-4 ring-indigo-500/50' : 'group-hover:scale-110'
                      }`}
                    >
                      <Wifi
                        style={{ color: nodeColor }}
                        className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110"
                      />
                      <span className="text-[9px] font-black leading-none mt-0.5" style={{ color: nodeColor }}>
                        {loc.currentHealthScore}
                      </span>

                      {/* Small outage warning badge */}
                      {hasOutage && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white animate-bounce shadow">
                          !
                        </span>
                      )}
                    </div>

                    {/* Tooltip Label */}
                    <div
                      className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight shadow-md transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white opacity-100 z-30 scale-105'
                          : 'bg-slate-900/90 text-slate-300 border border-slate-700 opacity-90 group-hover:opacity-100'
                      }`}
                    >
                      {loc.name}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Facility Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
              {locations.map((loc) => {
                const isSelected = selectedLocId === loc.id;
                const colors = getHealthStatusColors(loc.currentStatus);
                const hasOutage = activeOutages.some((o) => o.locationId === loc.id && o.status === 'active');

                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocId(loc.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-indigo-500 bg-slate-800/90 shadow-md ring-2 ring-indigo-500/40'
                        : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white">{loc.name}</span>
                          {hasOutage && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/50">
                              OUTAGE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{loc.building}</p>
                      </div>

                      <div className="text-right">
                        <span className={`text-base font-extrabold ${colors.text}`}>
                          {loc.currentHealthScore}
                        </span>
                        <span className="text-[10px] text-slate-500 block leading-none">/100</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">Avg Down</span>
                        <span className="font-semibold text-slate-200">{loc.metrics?.avgDownload || 0} Mbps</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Latency</span>
                        <span className="font-semibold text-slate-200">{loc.metrics?.avgPing || 0} ms</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tickets</span>
                        <span className="font-semibold text-slate-200">{loc.metrics?.complaintsCountToday || 0}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Bar Info */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sensors updating every 10s via client telemetry</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Click any campus location for deep diagnostic inspection
            </span>
          </div>
        </div>

        {/* Right Deep-Dive Drawer */}
        <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
          {selectedLoc ? (
            <div className="space-y-4">
              {/* Location Title & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {selectedLoc.building}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                    {selectedLoc.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedLoc.floor}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <TrafficSignalLight
                    signal={getTrafficSignalFromScore(selectedLoc.currentHealthScore, selectedLoc.metrics?.avgPing, selectedLoc.metrics?.avgPacketLoss).signal}
                    size="sm"
                    orientation="horizontal"
                    showLabel={true}
                    animated
                  />
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                    style={{
                      borderColor: getStatusBg(selectedLoc.currentStatus) + '60',
                      backgroundColor: getStatusBg(selectedLoc.currentStatus) + '15',
                      color: getStatusBg(selectedLoc.currentStatus)
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusBg(selectedLoc.currentStatus) }} />
                    {selectedLoc.currentStatus}
                  </div>
                </div>
              </div>

              {/* Active Outage Warning if present */}
              {locOutage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-100">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Active Outage In Progress
                  </div>
                  <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-300 leading-snug">
                    {locOutage.reason}
                  </p>
                </div>
              )}

              {/* Health Score Dial Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    Composite Health Score
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {selectedLoc.currentHealthScore}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/100</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                    AP: <code className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">{selectedLoc.accessPointName || 'AP-UNASSIGNED'}</code>
                  </span>
                </div>

                {/* Circular Score Indicator */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-16 h-16 -rotate-90 transform">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="transparent"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      stroke={getStatusBg(selectedLoc.currentStatus)}
                      strokeWidth="5"
                      strokeDasharray={163.3}
                      strokeDashoffset={163.3 - (163.3 * selectedLoc.currentHealthScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <Activity
                    className="w-5 h-5 absolute"
                    style={{ color: getStatusBg(selectedLoc.currentStatus) }}
                  />
                </div>
              </div>

              {/* Metric Breakdown Pill Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Avg Download</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedLoc.metrics?.avgDownload || 0} Mbps
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Avg Upload</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedLoc.metrics?.avgUpload || 0} Mbps
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Round-trip Ping</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedLoc.metrics?.avgPing || 0} ms
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Packet Loss</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedLoc.metrics?.avgPacketLoss || 0}%
                  </span>
                </div>
              </div>

              {/* Peak Hour Wi-Fi Weather Forecast */}
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Wi-Fi Weather (Peak Hour Forecast)</span>
                </div>
                <div className="mt-2 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Best Study Window:</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">8:00 AM - 11:00 AM</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Peak Congestion:</span>
                    <strong className="text-rose-700 dark:text-rose-300 font-semibold">1:00 PM - 3:30 PM</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Select a location to inspect health metrics.
            </div>
          )}

          {/* Action CTAs */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {onSelectLocationForTest && (
              <button
                onClick={() => onSelectLocationForTest(selectedLoc.id)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Run Real Speed Test at {selectedLoc.name}
              </button>
            )}

            {onOpenIncidentBrief && (
              <button
                onClick={() => onOpenIncidentBrief(selectedLoc.id)}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Generate AI Incident Brief
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

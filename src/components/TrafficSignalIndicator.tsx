import React from 'react';
import { HealthStatus } from '../lib/types';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

export type TrafficSignalColor = 'green' | 'amber' | 'red';

export interface TrafficSignalInfo {
  signal: TrafficSignalColor;
  statusText: string;
  badgeClass: string;
  description: string;
  recommendation: string;
  colorHex: string;
}

export function getTrafficSignalFromScore(score: number, ping?: number, packetLoss?: number): TrafficSignalInfo {
  // If severe ping or packet loss or score < 50 => RED
  if (score < 50 || (packetLoss !== undefined && packetLoss > 4) || (ping !== undefined && ping > 80)) {
    return {
      signal: 'red',
      statusText: 'RED SIGNAL — Severe Congestion / Bottleneck',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      description: 'High packet loss, channel saturation, or access point overload.',
      recommendation: 'Avoid bandwidth-heavy tasks. Apply QoS traffic reduction or switch to adjacent AP.',
      colorHex: '#ef4444',
    };
  }

  // If score 50-74 => AMBER / YELLOW
  if (score < 75 || (packetLoss !== undefined && packetLoss > 1) || (ping !== undefined && ping > 45)) {
    return {
      signal: 'amber',
      statusText: 'AMBER SIGNAL — Moderate Traffic / High Density',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      description: 'Network is stable for browsing, but 4K video or gaming may experience micro-buffering.',
      recommendation: 'Enable 5GHz band steering or schedule large downloads off-peak.',
      colorHex: '#f59e0b',
    };
  }

  // Otherwise => GREEN
  return {
    signal: 'green',
    statusText: 'GREEN SIGNAL — Optimal Flow / Clear Channel',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    description: 'Fast throughput, ultra-low latency, and zero packet loss.',
    recommendation: 'Optimal zone for video exams, HD conferencing, and research datasets.',
    colorHex: '#10b981',
  };
}

interface TrafficSignalLightProps {
  signal: TrafficSignalColor;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  orientation?: 'vertical' | 'horizontal';
  animated?: boolean;
}

export const TrafficSignalLight: React.FC<TrafficSignalLightProps> = ({
  signal,
  size = 'md',
  showLabel = false,
  orientation = 'vertical',
  animated = true,
}) => {
  const isRed = signal === 'red';
  const isAmber = signal === 'amber';
  const isGreen = signal === 'green';

  const sizeConfig = {
    sm: {
      bulb: 'w-2.5 h-2.5',
      chassis: orientation === 'vertical' ? 'p-1 gap-1' : 'p-1 gap-1',
      glowRed: 'shadow-[0_0_8px_rgba(239,68,68,0.9)]',
      glowAmber: 'shadow-[0_0_8px_rgba(245,158,11,0.9)]',
      glowGreen: 'shadow-[0_0_8px_rgba(16,185,129,0.9)]',
    },
    md: {
      bulb: 'w-3.5 h-3.5',
      chassis: orientation === 'vertical' ? 'p-1.5 gap-1.5' : 'p-1.5 gap-1.5',
      glowRed: 'shadow-[0_0_12px_rgba(239,68,68,0.9)]',
      glowAmber: 'shadow-[0_0_12px_rgba(245,158,11,0.9)]',
      glowGreen: 'shadow-[0_0_12px_rgba(16,185,129,0.9)]',
    },
    lg: {
      bulb: 'w-5 h-5',
      chassis: orientation === 'vertical' ? 'p-2.5 gap-2' : 'p-2.5 gap-2',
      glowRed: 'shadow-[0_0_18px_rgba(239,68,68,1)]',
      glowAmber: 'shadow-[0_0_18px_rgba(245,158,11,1)]',
      glowGreen: 'shadow-[0_0_18px_rgba(16,185,129,1)]',
    },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}`}>
      {/* Realistic Traffic Light Chassis */}
      <div
        className={`inline-flex ${
          orientation === 'vertical' ? 'flex-col' : 'flex-row'
        } items-center bg-slate-900 border-2 border-slate-700/80 rounded-full shadow-lg ${sizeConfig.chassis}`}
        title={`Network Traffic Signal: ${signal.toUpperCase()}`}
      >
        {/* Red Bulb */}
        <div
          className={`rounded-full transition-all duration-300 ${sizeConfig.bulb} ${
            isRed
              ? `bg-rose-500 ${sizeConfig.glowRed} ${animated ? 'animate-pulse' : ''}`
              : 'bg-rose-950/40 opacity-30'
          }`}
        />

        {/* Amber / Yellow Bulb */}
        <div
          className={`rounded-full transition-all duration-300 ${sizeConfig.bulb} ${
            isAmber
              ? `bg-amber-400 ${sizeConfig.glowAmber} ${animated ? 'animate-pulse' : ''}`
              : 'bg-amber-950/40 opacity-30'
          }`}
        />

        {/* Green Bulb */}
        <div
          className={`rounded-full transition-all duration-300 ${sizeConfig.bulb} ${
            isGreen
              ? `bg-emerald-500 ${sizeConfig.glowGreen} ${animated ? 'animate-pulse' : ''}`
              : 'bg-emerald-950/40 opacity-30'
          }`}
        />
      </div>

      {showLabel && (
        <span
          className={`text-[11px] font-extrabold uppercase tracking-wider ${
            isRed
              ? 'text-rose-600 dark:text-rose-400'
              : isAmber
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {isRed ? 'Red: Heavy Traffic' : isAmber ? 'Amber: Moderate' : 'Green: Optimal Flow'}
        </span>
      )}
    </div>
  );
};

interface CampusTrafficSignalBarProps {
  greenCount: number;
  amberCount: number;
  redCount: number;
  onFilterSignal?: (signal: TrafficSignalColor | 'all') => void;
  activeFilter?: TrafficSignalColor | 'all';
}

export const CampusTrafficSignalBar: React.FC<CampusTrafficSignalBarProps> = ({
  greenCount,
  amberCount,
  redCount,
  onFilterSignal,
  activeFilter = 'all',
}) => {
  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <TrafficSignalLight signal="green" size="sm" orientation="horizontal" animated={false} />
        <div>
          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Campus Wi-Fi Traffic Signals</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">
              Live
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Real-time traffic flow indicators across university hotspot zones
          </p>
        </div>
      </div>

      {/* Signal Counters with 1-Click Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onFilterSignal && onFilterSignal(activeFilter === 'green' ? 'all' : 'green')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'green'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
          <span>{greenCount} Green (Optimal)</span>
        </button>

        <button
          onClick={() => onFilterSignal && onFilterSignal(activeFilter === 'amber' ? 'all' : 'amber')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'amber'
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
          <span>{amberCount} Amber (Moderate)</span>
        </button>

        <button
          onClick={() => onFilterSignal && onFilterSignal(activeFilter === 'red' ? 'all' : 'red')}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'red'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-ping" />
          <span>{redCount} Red (Bottleneck)</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Activity,
  Zap,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
  Wifi,
  Radio,
  Sliders,
  Sparkles,
  Info,
  Layers,
  Users,
  Clock,
  Server,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { CampusTrafficTelemetry, TrafficReductionPolicy } from '../lib/types';
import { TrafficSignalLight, TrafficSignalColor } from './TrafficSignalIndicator';

interface TrafficOptimizationViewProps {
  onRefreshData?: () => void;
}

export const TrafficOptimizationView: React.FC<TrafficOptimizationViewProps> = ({
  onRefreshData,
}) => {
  const [trafficData, setTrafficData] = useState<CampusTrafficTelemetry | null>(null);
  const [policies, setPolicies] = useState<TrafficReductionPolicy>({
    qosStreamingCap: false,
    bandSteering5Ghz: false,
    apLoadBalancing: false,
    p2pThrottling: false,
    airtimeFairness: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingPolicy, setUpdatingPolicy] = useState<boolean>(false);

  const fetchTraffic = async () => {
    try {
      const res = await fetch('/api/traffic');
      if (res.ok) {
        const data = await res.json();
        setTrafficData(data);
        if (data.policies) {
          setPolicies(data.policies);
        }
      }
    } catch (err) {
      console.warn('Traffic fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
  }, []);

  const handleTogglePolicy = async (policyKey: keyof TrafficReductionPolicy) => {
    const updatedPolicies = {
      ...policies,
      [policyKey]: !policies[policyKey],
    };
    setPolicies(updatedPolicies);
    setUpdatingPolicy(true);

    try {
      const res = await fetch('/api/traffic/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPolicies),
      });
      if (res.ok) {
        await fetchTraffic();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Failed to update traffic policy:', err);
    } finally {
      setUpdatingPolicy(false);
    }
  };

  const handleEnableAllOptimizations = async () => {
    const allEnabled: TrafficReductionPolicy = {
      qosStreamingCap: true,
      bandSteering5Ghz: true,
      apLoadBalancing: true,
      p2pThrottling: true,
      airtimeFairness: true,
    };
    setPolicies(allEnabled);
    setUpdatingPolicy(true);

    try {
      await fetch('/api/traffic/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allEnabled),
      });
      await fetchTraffic();
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5 },
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingPolicy(false);
    }
  };

  const handleResetPolicies = async () => {
    const allDisabled: TrafficReductionPolicy = {
      qosStreamingCap: false,
      bandSteering5Ghz: false,
      apLoadBalancing: false,
      p2pThrottling: false,
      airtimeFairness: false,
    };
    setPolicies(allDisabled);
    setUpdatingPolicy(true);

    try {
      await fetch('/api/traffic/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allDisabled),
      });
      await fetchTraffic();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingPolicy(false);
    }
  };

  if (loading || !trafficData) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Measuring real-time RF airtime & traffic load...</p>
      </div>
    );
  }

  const utilizationPct = Math.round(
    (trafficData.currentUsageMbps / trafficData.totalBackhaulCapacityMbps) * 100
  );

  const activePolicyCount = Object.values(policies).filter(Boolean).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Campus Traffic Congestion & Traffic Reduction Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time wireless backhaul saturation analytics & actionable intelligent traffic reduction policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activePolicyCount > 0 ? (
            <button
              onClick={handleResetPolicies}
              className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Reset Policies
            </button>
          ) : (
            <button
              onClick={handleEnableAllOptimizations}
              className="py-2 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Apply Recommended Policies
            </button>
          )}
        </div>
      </div>

      {/* Top Graphic Traffic Gauge Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Backbone Capacity Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Campus Backhaul Throughput
              </span>
              <div className="flex items-center gap-2">
                <TrafficSignalLight
                  signal={utilizationPct > 80 ? 'red' : utilizationPct > 55 ? 'amber' : 'green'}
                  size="sm"
                  orientation="horizontal"
                  animated
                />
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  utilizationPct > 80
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : utilizationPct > 55
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {utilizationPct}% Saturated
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {trafficData.currentUsageMbps}
              </span>
              <span className="text-sm font-bold text-slate-400">
                / {trafficData.totalBackhaulCapacityMbps} Mbps Uplink
              </span>
            </div>

            {/* Visual Capacity Meter Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    utilizationPct > 80
                      ? 'bg-rose-500'
                      : utilizationPct > 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>0 Gbps</span>
                <span>1.25 Gbps</span>
                <span>2.5 Gbps (Peak Limit)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              Connected Devices:
            </span>
            <strong className="text-slate-900 dark:text-white font-bold">
              {trafficData.totalConnectedDevices} Clients
            </strong>
          </div>
        </div>

        {/* Traffic Category Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Bandwidth By Application
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Live DPI</span>
          </div>

          <div className="space-y-3">
            {trafficData.categoryBreakdown.map((cat) => (
              <div key={cat.name} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[210px]">
                    {cat.name}
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {cat.percentage}% ({cat.usageMbps} Mbps)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Traffic Reduction Impact Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl flex flex-col justify-between border border-indigo-800">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Traffic Reduction Impact
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                {activePolicyCount} Policies Active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-indigo-300 block">Bandwidth Saved</span>
                <span className="text-3xl font-black text-emerald-400">
                  {trafficData.trafficReductionImpact.bandwidthSavedMbps > 0 ? '-' : ''}
                  {trafficData.trafficReductionImpact.bandwidthSavedMbps} Mbps
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-indigo-300 block">Latency Reduced</span>
                  <span className="font-bold text-white">
                    -{trafficData.trafficReductionImpact.latencyReductionMs} ms
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-300 block">Speed Boost</span>
                  <span className="font-bold text-teal-300">
                    +{trafficData.trafficReductionImpact.speedImprovementPct}% faster
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-indigo-300 mt-4 italic">
            {activePolicyCount === 0
              ? 'Toggle policies below to immediately relieve campus Wi-Fi congestion.'
              : 'QoS policies active. High-bandwidth streaming throttled in favor of academic packets.'}
          </p>
        </div>
      </div>

      {/* "HOW TO REDUCE WI-FI TRAFFIC" Interactive Policies Center */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              How to Reduce Campus Wi-Fi Traffic (Actionable IT Controls)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toggle network mitigation techniques below to reduce interference, free up airtime, and guarantee smooth academic access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Policy 1: QoS Video Cap */}
          <div className={`p-5 rounded-2xl border transition-all ${
            policies.qosStreamingCap
              ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  1. QoS 1080p Video Streaming Cap
                </h4>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mt-0.5">
                  Saves ~360 Mbps Bandwidth
                </span>
              </div>
              <input
                type="checkbox"
                checked={policies.qosStreamingCap}
                onChange={() => handleTogglePolicy('qosStreamingCap')}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              Restricts video platforms (YouTube, Netflix, TikTok) to 1080p during class hours. Prevents a single student from eating 35 Mbps with 4K HDR streams.
            </p>
          </div>

          {/* Policy 2: 5GHz DFS Band Steering */}
          <div className={`p-5 rounded-2xl border transition-all ${
            policies.bandSteering5Ghz
              ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  2. 5GHz DFS Dynamic Band Steering
                </h4>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mt-0.5">
                  -35ms Latency &bull; -28% Airtime
                </span>
              </div>
              <input
                type="checkbox"
                checked={policies.bandSteering5Ghz}
                onChange={() => handleTogglePolicy('bandSteering5Ghz')}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              Forces modern phones/laptops off the saturated 2.4GHz spectrum onto 5GHz clean DFS channels (channels 52-64, 100-140), cutting co-channel interference.
            </p>
          </div>

          {/* Policy 3: Dynamic AP Load Offloading */}
          <div className={`p-5 rounded-2xl border transition-all ${
            policies.apLoadBalancing
              ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  3. Dynamic AP Roaming Handoff
                </h4>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mt-0.5">
                  Shifts 140 Clients to Neighbor APs
                </span>
              </div>
              <input
                type="checkbox"
                checked={policies.apLoadBalancing}
                onChange={() => handleTogglePolicy('apLoadBalancing')}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              Raises Min RSSI cutoff to -70dBm so "sticky" client devices automatically roam to adjacent uncrowded APs rather than crowding single APs like AP-LIB-203.
            </p>
          </div>

          {/* Policy 4: P2P & Torrent Throttling */}
          <div className={`p-5 rounded-2xl border transition-all ${
            policies.p2pThrottling
              ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  4. P2P & Game Patch Throttling
                </h4>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mt-0.5">
                  Saves ~290 Mbps During Peak
                </span>
              </div>
              <input
                type="checkbox"
                checked={policies.p2pThrottling}
                onChange={() => handleTogglePolicy('p2pThrottling')}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              Deprioritizes BitTorrent traffic and 50GB Steam game patches during 8:00 AM – 5:00 PM study hours, preserving high bandwidth for lab research and exams.
            </p>
          </div>

          {/* Policy 5: Airtime Fairness Scheduling */}
          <div className={`p-5 rounded-2xl border transition-all ${
            policies.airtimeFairness
              ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  5. Dynamic Airtime Fairness
                </h4>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mt-0.5">
                  +18% Speed for Fast Wi-Fi 6 Clients
                </span>
              </div>
              <input
                type="checkbox"
                checked={policies.airtimeFairness}
                onChange={() => handleTogglePolicy('airtimeFairness')}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer mt-1"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              Allocates equal radio transmission airtime instead of equal packet counts, preventing slow 802.11b devices from halting high-speed laptops.
            </p>
          </div>

          {/* Policy Summary Callout */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900 dark:text-indigo-200">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Combined Mitigation Effect
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                When all 5 policies are enabled, campus uplink saturation drops from <strong>86% &rarr; 44%</strong>, eliminating exam timeouts and dead zones.
              </p>
            </div>
            <div className="pt-3">
              <button
                onClick={handleEnableAllOptimizations}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                Apply All 5 Optimizations
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Facility-Level Congestion Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-500" />
          Facility Congestion Breakdown & Active AP Loads
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Facility Location</th>
                <th className="pb-3 text-center">Active Clients</th>
                <th className="pb-3 text-center">Capacity Load</th>
                <th className="pb-3 text-center">RF Airtime Load</th>
                <th className="pb-3 text-left">Top Bandwidth Consumer</th>
                <th className="pb-3 text-right">Congestion Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trafficData.facilityTraffic.map((fac) => (
                <tr key={fac.locationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                    {fac.name}
                    <span className="text-[10px] text-slate-400 block font-normal">{fac.building}</span>
                  </td>
                  <td className="py-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {fac.connectedDevices} <span className="text-slate-400 font-normal">/ {fac.maxCapacity}</span>
                  </td>
                  <td className="py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            fac.capacityUtilizationPct > 80 ? 'bg-rose-500' :
                            fac.capacityUtilizationPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${fac.capacityUtilizationPct}%` }}
                        />
                      </div>
                      <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        {fac.capacityUtilizationPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 text-center font-semibold text-slate-800 dark:text-slate-200">
                    {fac.channelAirtimePct}% Airtime
                  </td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">
                    {fac.topAppCategory}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      fac.congestionLevel === 'Severe' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' :
                      fac.congestionLevel === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border border-orange-300' :
                      fac.congestionLevel === 'Moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                    }`}>
                      {fac.congestionLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

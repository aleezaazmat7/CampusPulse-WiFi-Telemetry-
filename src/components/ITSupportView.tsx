import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  Send,
  Layers,
  Activity,
  HardDrive,
  Cpu,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { CampusLocation, Complaint, OutageAlert, AIIncidentBrief } from '../lib/types';
import { getHealthStatusColors } from '../lib/health-score';

interface ITSupportViewProps {
  locations: CampusLocation[];
  complaints: Complaint[];
  outages: OutageAlert[];
  onResolveOutage: (outageId: string) => void;
  onRefresh: () => void;
}

export const ITSupportView: React.FC<ITSupportViewProps> = ({
  locations,
  complaints,
  outages,
  onResolveOutage,
  onRefresh,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    locations.find((l) => l.currentStatus === 'Critical' || l.currentStatus === 'Poor')?.id || locations[0]?.id
  );
  const [incidentBrief, setIncidentBrief] = useState<AIIncidentBrief | null>(null);
  const [loadingBrief, setLoadingBrief] = useState<boolean>(false);

  const selectedLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];
  const activeOutages = outages.filter((o) => o.status === 'active');
  const poorLocations = locations.filter((l) => l.currentStatus === 'Poor' || l.currentStatus === 'Critical');

  const handleGenerateBrief = async (locationId: string) => {
    setSelectedLocationId(locationId);
    setLoadingBrief(true);
    setIncidentBrief(null);

    try {
      const res = await fetch('/api/ai/incident-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });

      if (res.ok) {
        const brief = await res.json();
        setIncidentBrief(brief);
      }
    } catch (err) {
      console.error('Error generating AI Incident Brief:', err);
    } finally {
      setLoadingBrief(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Network Operations Center (NOC) & IT Support
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time incident response, hardware telemetry analysis, and Gemini AI root-cause diagnosis.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="self-start sm:self-auto py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Outage Alerts Action Center */}
      {activeOutages.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-rose-900 dark:text-rose-100 text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-bounce" />
              Active Campus Outage Monitor ({activeOutages.length})
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-600 text-white">
              Critical Urgency
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOutages.map((outage) => (
              <div
                key={outage.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {outage.locationName}
                    </h4>
                    <p className="text-[11px] text-slate-400">{outage.building}</p>
                  </div>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    Est. {outage.affectedUsersEstimate || 50} users affected
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {outage.reason}
                </p>

                {outage.aiDiagnosis && (
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/50 text-[11px] text-indigo-900 dark:text-indigo-200 font-medium">
                    <span className="font-bold flex items-center gap-1 mb-0.5 text-indigo-700 dark:text-indigo-300">
                      <Sparkles className="w-3 h-3" /> AI Outage Hypothesis:
                    </span>
                    {outage.aiDiagnosis}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleGenerateBrief(outage.locationId)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate Incident Brief
                  </button>

                  <button
                    onClick={() => onResolveOutage(outage.id)}
                    className="py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                  >
                    Mark Outage Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problem Locations & AI Incident Brief Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Problem Locations Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Locations Requiring Attention
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ranked by composite health deficit and recent complaint volume.
            </p>

            <div className="space-y-2.5">
              {locations.map((loc) => {
                const isSelected = selectedLocationId === loc.id;
                const colors = getHealthStatusColors(loc.currentStatus);

                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white block">
                          {loc.name}
                        </span>
                        <span className="text-[10px] text-slate-500">{loc.building}</span>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-black ${colors.text}`}>
                          {loc.currentHealthScore}
                        </span>
                        <span className="text-[9px] block text-slate-400 font-semibold">{loc.currentStatus}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {loc.metrics?.avgDownload || 0} Mbps &bull; {loc.metrics?.avgPing || 0}ms
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateBrief(loc.id);
                        }}
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" /> AI Brief
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Incident Brief Display */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm min-h-[440px] flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      AI Incident Brief: {selectedLoc.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Plain-English diagnosis grounded in real client packet loss, throughput, and complaint logs.
                  </p>
                </div>

                <button
                  onClick={() => handleGenerateBrief(selectedLoc.id)}
                  disabled={loadingBrief}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loadingBrief ? (
                    <>Generating Diagnosis...</>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {incidentBrief ? 'Regenerate Brief' : 'Generate AI Brief'}
                    </>
                  )}
                </button>
              </div>

              {loadingBrief ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Querying Gemini 3.8 Flash with telemetry from {selectedLoc.name}...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Correlating 14-day rolling baseline, client ping jitter, and recent complaint texts.
                  </p>
                </div>
              ) : incidentBrief ? (
                <div className="space-y-6 animate-fadeIn">
                  {/* Executive Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Executive Summary
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        Severity: {incidentBrief.severity}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {incidentBrief.executiveSummary}
                    </p>
                  </div>

                  {/* Hardware & Resolution Window */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        Affected Hardware Reference
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {incidentBrief.affectedHardware || selectedLoc.accessPointName}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        Est. Resolution Time
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {incidentBrief.estimatedResolutionTime}
                      </span>
                    </div>
                  </div>

                  {/* Root Cause Analysis */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Suspected Root Causes
                    </h4>
                    <ul className="space-y-2">
                      {incidentBrief.rootCauseAnalysis.map((cause, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2"
                        >
                          <span className="font-bold text-amber-600 shrink-0">&bull;</span>
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Action Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Recommended IT Action Checklist
                    </h4>
                    <div className="space-y-2">
                      {incidentBrief.recommendedActions.map((action, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5 font-medium"
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No Active Incident Brief Loaded
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Click the button above to generate a real-time Gemini AI diagnostic brief for {selectedLoc.name}.
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateBrief(selectedLoc.id)}
                    className="py-2 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                  >
                    Generate Incident Brief for {selectedLoc.name}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Powered by Gemini 3.8 Flash (Server-side reasoning)</span>
              <span>Updated in real time with client tests</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

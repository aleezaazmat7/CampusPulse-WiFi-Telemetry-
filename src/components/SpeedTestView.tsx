import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Gauge,
  Play,
  RotateCcw,
  MapPin,
  Wifi,
  ArrowDown,
  ArrowUp,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Send,
  HelpCircle
} from 'lucide-react';
import { CampusLocation, SpeedTestResult, User } from '../lib/types';
import { BrowserSpeedTestRunner, SpeedTestLiveMetrics } from '../lib/speedtest-runner';
import { getHealthStatusColors } from '../lib/health-score';
import { TrafficSignalLight, getTrafficSignalFromScore } from './TrafficSignalIndicator';

interface SpeedTestViewProps {
  locations: CampusLocation[];
  currentUser: User;
  onTestCompleted: (test: SpeedTestResult) => void;
  onNavigateToComplaintWithTest: (test: SpeedTestResult) => void;
  preselectedLocationId?: string;
}

export const SpeedTestView: React.FC<SpeedTestViewProps> = ({
  locations,
  currentUser,
  onTestCompleted,
  onNavigateToComplaintWithTest,
  preselectedLocationId,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    preselectedLocationId || locations[0]?.id || 'loc-lab1'
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testMetrics, setTestMetrics] = useState<SpeedTestLiveMetrics>({
    phase: 'idle',
    progressPercent: 0,
    currentSpeedMbps: 0,
    pingMs: 0,
    jitterMs: 0,
    packetLossPct: 0,
    downloadMbps: 0,
    uploadMbps: 0,
  });
  const [savedTestResult, setSavedTestResult] = useState<SpeedTestResult | null>(null);
  const [anomalyBanner, setAnomalyBanner] = useState<string | null>(null);

  const runnerRef = useRef<BrowserSpeedTestRunner | null>(null);

  useEffect(() => {
    if (preselectedLocationId) {
      setSelectedLocationId(preselectedLocationId);
    }
  }, [preselectedLocationId]);

  const selectedLoc = locations.find((l) => l.id === selectedLocationId) || locations[0];

  const handleStartTest = async () => {
    setIsRunning(true);
    setSavedTestResult(null);
    setAnomalyBanner(null);

    runnerRef.current = new BrowserSpeedTestRunner();

    try {
      const finalMetrics = await runnerRef.current.runTest((metrics) => {
        setTestMetrics({ ...metrics });
      });

      // Fire confetti if completed with good or excellent health
      if (finalMetrics.healthResult && finalMetrics.healthResult.score >= 70) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      // Save real result to server
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLoc.id,
          downloadSpeed: finalMetrics.downloadMbps,
          uploadSpeed: finalMetrics.uploadMbps,
          ping: finalMetrics.pingMs,
          jitter: finalMetrics.jitterMs,
          packetLoss: finalMetrics.packetLossPct,
          userId: currentUser.id,
          userName: currentUser.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedTestResult(data.test);
        onTestCompleted(data.test);
        if (data.isAnomaly && data.anomalyMessage) {
          setAnomalyBanner(data.anomalyMessage);
        }
      }
    } catch (err: any) {
      console.error('Speed test error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancel = () => {
    if (runnerRef.current) {
      runnerRef.current.cancel();
    }
    setIsRunning(false);
    setTestMetrics((prev) => ({ ...prev, phase: 'idle', progressPercent: 0 }));
  };

  // Radial Gauge SVG Parameters
  // Radius = 110, Arc from 135 deg to 405 deg (270 deg span)
  const radius = 100;
  const stroke = 14;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const arcLength = circumference * 0.75; // 270 degrees arc

  // Value calculation for gauge needle and stroke
  let gaugeValue = 0;
  let maxScale = 100; // Mbps
  if (testMetrics.phase === 'ping') {
    gaugeValue = Math.min(200, testMetrics.pingMs);
    maxScale = 200; // ms
  } else if (testMetrics.phase === 'download' || testMetrics.phase === 'upload') {
    gaugeValue = Math.min(100, testMetrics.currentSpeedMbps);
    maxScale = 100;
  } else if (testMetrics.phase === 'complete' && testMetrics.healthResult) {
    gaugeValue = testMetrics.healthResult.score;
    maxScale = 100;
  }

  const strokeDashoffset = arcLength - (gaugeValue / maxScale) * arcLength;

  const currentStatusColors = testMetrics.healthResult
    ? getHealthStatusColors(testMetrics.healthResult.status)
    : { ring: '#6366f1', text: 'text-indigo-600', badgeBg: 'bg-indigo-50 text-indigo-700' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Location Selection */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Gauge className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Live Campus Wi-Fi Speed Test
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Measures real client throughput (sequential ICMP-style pings, multi-stream download, payload upload).
            </p>
          </div>

          {/* Location Selector */}
          <div className="flex items-center gap-3">
            <div className="w-full sm:w-auto">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Select Your Current Location
              </label>
              <div className="relative">
                <select
                  disabled={isRunning}
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full sm:w-72 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.building})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Location Context Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold">{selectedLoc.name}:</span>
            <span className="text-slate-500">{selectedLoc.floor}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Access Point: <code className="font-mono text-indigo-600 dark:text-indigo-400">{selectedLoc.accessPointName || 'Campus-AP'}</code>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              Baseline Status:
              <span
                className="px-2 py-0.5 rounded-full text-[10px]"
                style={{
                  backgroundColor: getHealthStatusColors(selectedLoc.currentStatus).ring + '20',
                  color: getHealthStatusColors(selectedLoc.currentStatus).ring,
                }}
              >
                {selectedLoc.currentStatus} ({selectedLoc.currentHealthScore}/100)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Speed Test Gauge Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Test Phase Flow Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className={testMetrics.phase === 'ping' ? 'text-indigo-600 font-bold' : 'text-slate-400'}>
              1. Ping & Jitter
            </span>
            <span className={testMetrics.phase === 'download' ? 'text-indigo-600 font-bold' : 'text-slate-400'}>
              2. Download Stream
            </span>
            <span className={testMetrics.phase === 'upload' ? 'text-indigo-600 font-bold' : 'text-slate-400'}>
              3. Upload Test
            </span>
            <span className={testMetrics.phase === 'complete' ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
              4. Health Score
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-teal-500 transition-all duration-300"
              style={{ width: `${testMetrics.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Circular Gauge Center */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg className="w-full h-full -rotate-[135deg] transform">
              {/* Background Arc */}
              <circle
                cx="50%"
                cy="50%"
                r={normalizedRadius}
                stroke="currentColor"
                strokeWidth={stroke}
                fill="transparent"
                strokeDasharray={`${arcLength} ${circumference}`}
                className="text-slate-100 dark:text-slate-800"
              />
              {/* Active Metric Fill Arc */}
              <circle
                cx="50%"
                cy="50%"
                r={normalizedRadius}
                stroke={currentStatusColors.ring || '#6366f1'}
                strokeWidth={stroke}
                fill="transparent"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>

            {/* Gauge Internal Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              {testMetrics.phase === 'idle' ? (
                <div className="space-y-1">
                  <Wifi className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Ready to Test</div>
                  <div className="text-xs text-slate-400">Click START below</div>
                </div>
              ) : testMetrics.phase === 'complete' && testMetrics.healthResult ? (
                <div className="space-y-1 animate-fadeIn">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Network Health</div>
                  <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {testMetrics.healthResult.score}
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: currentStatusColors.ring + '20',
                      color: currentStatusColors.ring
                    }}
                  >
                    {testMetrics.healthResult.status}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    {testMetrics.phase.toUpperCase()}
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {testMetrics.phase === 'ping'
                      ? testMetrics.pingMs
                      : testMetrics.currentSpeedMbps.toFixed(1)}
                  </div>
                  <div className="text-xs font-semibold text-slate-400">
                    {testMetrics.phase === 'ping' ? 'ms (latency)' : 'Mbps (throughput)'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="mt-4">
            {!isRunning ? (
              <button
                onClick={handleStartTest}
                className="py-3.5 px-10 rounded-2xl text-base font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                {testMetrics.phase === 'complete' ? 'RUN SPEED TEST AGAIN' : 'START WI-FI SPEED TEST'}
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="py-3 px-8 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Cancel Test
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Counter Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
          {/* Download */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              <ArrowDown className="w-3.5 h-3.5 text-teal-500" /> Download
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {testMetrics.downloadMbps ? `${testMetrics.downloadMbps} ` : '-- '}
              <span className="text-xs font-semibold text-slate-400">Mbps</span>
            </div>
          </div>

          {/* Upload */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> Upload
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {testMetrics.uploadMbps ? `${testMetrics.uploadMbps} ` : '-- '}
              <span className="text-xs font-semibold text-slate-400">Mbps</span>
            </div>
          </div>

          {/* Ping */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              <Activity className="w-3.5 h-3.5 text-blue-500" /> Ping / Latency
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {testMetrics.pingMs ? `${testMetrics.pingMs} ` : '-- '}
              <span className="text-xs font-semibold text-slate-400">ms</span>
            </div>
          </div>

          {/* Jitter */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Jitter
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {testMetrics.jitterMs ? `${testMetrics.jitterMs} ` : '-- '}
              <span className="text-xs font-semibold text-slate-400">ms</span>
            </div>
          </div>

          {/* Packet Loss */}
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Packet Loss
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {testMetrics.packetLossPct !== undefined ? `${testMetrics.packetLossPct}%` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Detection Banner if triggered */}
      {anomalyBanner && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
              Network Anomaly Detected (Rolling Baseline Deviation)
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              {anomalyBanner}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Health Score Diagnostic Card (Shown upon completion) */}
      {testMetrics.phase === 'complete' && testMetrics.healthResult && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Network Health Score Breakdown (0-100)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Formula implemented in <code className="font-mono text-indigo-600 dark:text-indigo-400">src/lib/health-score.ts</code> (Download 30%, Upload 15%, Ping 25%, Packet Loss 20%, Jitter 10%).
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedTestResult && (
                <button
                  onClick={() => onNavigateToComplaintWithTest(savedTestResult)}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Report Issue with Attached Test
                </button>
              )}
            </div>
          </div>

          {/* Primary Drag-Down Explanation with Traffic Signal */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Diagnostic Assessment
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {testMetrics.healthResult.explanation}
              </p>
              <div className="mt-2 text-xs text-slate-500">
                Primary Bottleneck: <strong className="text-indigo-600 dark:text-indigo-400">{testMetrics.healthResult.dragDownFactor}</strong>
              </div>
            </div>

            <div className="shrink-0 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Traffic Signal</span>
              <TrafficSignalLight
                signal={getTrafficSignalFromScore(testMetrics.healthResult.score, testMetrics.pingMs, testMetrics.packetLossPct).signal}
                size="md"
                orientation="horizontal"
                showLabel={true}
                animated
              />
            </div>
          </div>

          {/* Metric Sub-Score Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Download */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Download Throughput (30% weight)</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {testMetrics.healthResult.breakdown.downloadScore} / 30 pts
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${(testMetrics.healthResult.breakdown.downloadScore / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* Upload */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Upload Throughput (15% weight)</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {testMetrics.healthResult.breakdown.uploadScore} / 15 pts
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(testMetrics.healthResult.breakdown.uploadScore / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* Ping */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Latency / Ping (25% weight)</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {testMetrics.healthResult.breakdown.pingScore} / 25 pts
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(testMetrics.healthResult.breakdown.pingScore / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* Packet Loss */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Packet Stability (20% weight)</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {testMetrics.healthResult.breakdown.packetLossScore} / 20 pts
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${(testMetrics.healthResult.breakdown.packetLossScore / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Jitter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Jitter Variance (10% weight)</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {testMetrics.healthResult.breakdown.jitterScore} / 10 pts
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(testMetrics.healthResult.breakdown.jitterScore / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Failure Penalty */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Recent Location Failures Penalty</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  -{testMetrics.healthResult.breakdown.recentFailuresPenalty} pts
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{
                    width: `${Math.min(100, (testMetrics.healthResult.breakdown.recentFailuresPenalty / 18) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

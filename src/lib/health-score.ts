import { HealthStatus, HealthThresholds, HealthScoreCalculation } from './types';

/**
 * Default network health thresholds and weights.
 * Judges can review these parameters in Admin settings.
 */
export const DEFAULT_HEALTH_THRESHOLDS: HealthThresholds = {
  targetDownloadMbps: 50,  // 50+ Mbps yields 100% of download weight
  targetUploadMbps: 20,    // 20+ Mbps yields 100% of upload weight
  targetPingMs: 25,        // 25ms or lower yields 100% of ping weight (degrades up to 250ms)
  targetPacketLossPct: 0,  // 0% loss yields 100%; loss above 5% causes rapid degradation
  targetJitterMs: 5,       // 5ms or lower yields 100% of jitter weight (degrades up to 50ms)
  weights: {
    download: 0.30,   // 30% weight
    upload: 0.15,     // 15% weight
    ping: 0.25,       // 25% weight
    packetLoss: 0.20, // 20% weight
    jitter: 0.10,     // 10% weight
  }
};

/**
 * Calculates the comprehensive 0-100 Network Health Score
 * based on real measured metrics and recent location distress penalty.
 */
export function calculateHealthScore(
  metrics: {
    downloadSpeed: number; // Mbps
    uploadSpeed: number;   // Mbps
    ping: number;          // ms
    packetLoss: number;    // % (0-100)
    jitter: number;        // ms
  },
  recentContext?: {
    recentFailuresCount?: number;   // Failed or poor tests at this location in past hour
    recentComplaintsCount?: number; // Open complaints at this location
  },
  thresholds: HealthThresholds = DEFAULT_HEALTH_THRESHOLDS
): HealthScoreCalculation {
  const { downloadSpeed, uploadSpeed, ping, packetLoss, jitter } = metrics;
  const { weights } = thresholds;

  // 1. Download component (30% max)
  // Normalized logarithmically/linearly up to targetDownloadMbps
  const downloadNorm = Math.min(1, Math.max(0, downloadSpeed / thresholds.targetDownloadMbps));
  const downloadScore = downloadNorm * (weights.download * 100);

  // 2. Upload component (15% max)
  const uploadNorm = Math.min(1, Math.max(0, uploadSpeed / thresholds.targetUploadMbps));
  const uploadScore = uploadNorm * (weights.upload * 100);

  // 3. Ping component (25% max)
  // Ping is inverted: 0-25ms = 1.0; 25-250ms scales down to 0; >250ms = 0
  let pingNorm = 1;
  if (ping > thresholds.targetPingMs) {
    const excess = ping - thresholds.targetPingMs;
    pingNorm = Math.max(0, 1 - (excess / 200));
  }
  const pingScore = pingNorm * (weights.ping * 100);

  // 4. Packet Loss component (20% max)
  // Loss is severe: 0% = 1.0; 1% loss = 0.8; 5% loss = 0.2; >10% loss = 0
  let packetLossNorm = 1;
  if (packetLoss > 0) {
    packetLossNorm = Math.max(0, 1 - (packetLoss / 8));
  }
  const packetLossScore = packetLossNorm * (weights.packetLoss * 100);

  // 5. Jitter component (10% max)
  // 0-5ms = 1.0; scales down to 0 at 45ms
  let jitterNorm = 1;
  if (jitter > thresholds.targetJitterMs) {
    const excessJitter = jitter - thresholds.targetJitterMs;
    jitterNorm = Math.max(0, 1 - (excessJitter / 40));
  }
  const jitterScore = jitterNorm * (weights.jitter * 100);

  // Base raw score sum (0 - 100)
  const baseRawScore = downloadScore + uploadScore + pingScore + packetLossScore + jitterScore;

  // Recent failures & complaints penalty
  // Each recent failure subtracts 2 points; each recent complaint subtracts 1.5 points (max 15 pt penalty)
  const recentFailures = recentContext?.recentFailuresCount || 0;
  const recentComplaints = recentContext?.recentComplaintsCount || 0;
  const rawPenalty = (recentFailures * 2.0) + (recentComplaints * 1.5);
  const penalty = Math.min(18, Math.round(rawPenalty));

  const finalScore = Math.max(0, Math.min(100, Math.round(baseRawScore - penalty)));

  // Map to status
  let status: HealthStatus = 'Critical';
  if (finalScore >= 85) {
    status = 'Excellent';
  } else if (finalScore >= 70) {
    status = 'Good';
  } else if (finalScore >= 50) {
    status = 'Fair';
  } else if (finalScore >= 30) {
    status = 'Poor';
  } else {
    status = 'Critical';
  }

  // Determine primary drag-down factor
  const subScoreRatios = [
    { name: 'Download Speed', ratio: downloadNorm, max: weights.download * 100, current: downloadScore, detail: `${downloadSpeed.toFixed(1)} Mbps (target ${thresholds.targetDownloadMbps} Mbps)` },
    { name: 'Latency / Ping', ratio: pingNorm, max: weights.ping * 100, current: pingScore, detail: `${Math.round(ping)} ms (target < ${thresholds.targetPingMs} ms)` },
    { name: 'Packet Loss', ratio: packetLossNorm, max: weights.packetLoss * 100, current: packetLossScore, detail: `${packetLoss.toFixed(1)}% loss (target 0%)` },
    { name: 'Jitter Variation', ratio: jitterNorm, max: weights.jitter * 100, current: jitterScore, detail: `${jitter.toFixed(1)} ms jitter` },
    { name: 'Upload Speed', ratio: uploadNorm, max: weights.upload * 100, current: uploadScore, detail: `${uploadSpeed.toFixed(1)} Mbps` },
  ];

  subScoreRatios.sort((a, b) => a.ratio - b.ratio);
  const worstFactor = subScoreRatios[0];

  let dragDownFactor = worstFactor.name;
  let explanation = `${worstFactor.name} is the primary constraint at ${worstFactor.detail}.`;

  if (penalty > 0) {
    explanation += ` Adjusted for ${penalty} penalty points due to ${recentFailures} recent failed tests and ${recentComplaints} open complaints.`;
  }

  if (finalScore >= 85) {
    explanation = `Outstanding network health across all indicators. Bandwidth and latency optimal for 4K streaming and low-latency workloads.`;
  }

  return {
    score: finalScore,
    status,
    breakdown: {
      downloadScore: Math.round(downloadScore * 10) / 10,
      uploadScore: Math.round(uploadScore * 10) / 10,
      pingScore: Math.round(pingScore * 10) / 10,
      packetLossScore: Math.round(packetLossScore * 10) / 10,
      jitterScore: Math.round(jitterScore * 10) / 10,
      recentFailuresPenalty: penalty,
    },
    dragDownFactor,
    explanation,
  };
}

/**
 * Returns the semantic theme colors for a health score or status.
 */
export function getHealthStatusColors(status: HealthStatus) {
  switch (status) {
    case 'Excellent':
      return {
        badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500',
        ring: '#10b981', // emerald-500
        gradient: 'from-emerald-500 to-teal-600',
        glow: 'rgba(16, 185, 129, 0.35)',
      };
    case 'Good':
      return {
        badgeBg: 'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30',
        text: 'text-lime-600 dark:text-lime-400',
        border: 'border-lime-500',
        ring: '#84cc16', // lime-500
        gradient: 'from-lime-500 to-emerald-600',
        glow: 'rgba(132, 204, 22, 0.35)',
      };
    case 'Fair':
      return {
        badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500',
        ring: '#f59e0b', // amber-500
        gradient: 'from-amber-500 to-yellow-600',
        glow: 'rgba(245, 158, 11, 0.35)',
      };
    case 'Poor':
      return {
        badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500',
        ring: '#f97316', // orange-500
        gradient: 'from-orange-500 to-red-500',
        glow: 'rgba(249, 115, 22, 0.35)',
      };
    case 'Critical':
    default:
      return {
        badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500',
        ring: '#f43f5e', // rose-500
        gradient: 'from-rose-500 to-red-600',
        glow: 'rgba(244, 63, 94, 0.4)',
      };
  }
}

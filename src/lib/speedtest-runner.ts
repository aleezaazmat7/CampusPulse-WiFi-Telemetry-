import { calculateHealthScore } from './health-score';
import { HealthScoreCalculation } from './types';

export type SpeedTestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'analyzing' | 'complete' | 'error';

export interface SpeedTestLiveMetrics {
  phase: SpeedTestPhase;
  progressPercent: number; // 0 - 100
  currentSpeedMbps: number; // Current instantaneous speed for gauge
  pingMs: number;
  jitterMs: number;
  packetLossPct: number;
  downloadMbps: number;
  uploadMbps: number;
  healthResult?: HealthScoreCalculation;
  errorMessage?: string;
}

export type SpeedTestCallback = (metrics: SpeedTestLiveMetrics) => void;

export class BrowserSpeedTestRunner {
  private abortController: AbortController | null = null;
  private isRunning = false;

  public async runTest(
    onUpdate: SpeedTestCallback,
    recentContext?: { recentFailuresCount?: number; recentComplaintsCount?: number }
  ): Promise<SpeedTestLiveMetrics> {
    if (this.isRunning) {
      throw new Error('A speed test is already in progress');
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const metrics: SpeedTestLiveMetrics = {
      phase: 'idle',
      progressPercent: 0,
      currentSpeedMbps: 0,
      pingMs: 0,
      jitterMs: 0,
      packetLossPct: 0,
      downloadMbps: 0,
      uploadMbps: 0,
    };

    try {
      // ========================================================
      // 1. PING & JITTER & PACKET LOSS PHASE (10 requests)
      // ========================================================
      metrics.phase = 'ping';
      metrics.progressPercent = 5;
      onUpdate({ ...metrics });

      const pings: number[] = [];
      let timeoutsCount = 0;
      const totalPingIterations = 10;

      for (let i = 0; i < totalPingIterations; i++) {
        if (signal.aborted) throw new Error('Test cancelled');

        const startTime = performance.now();
        try {
          const pingPromise = fetch(`/api/ping?_t=${Date.now()}_${i}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : signal,
          });

          const res = await pingPromise;
          if (!res.ok) {
            timeoutsCount++;
          } else {
            await res.json();
            const latency = performance.now() - startTime;
            pings.push(latency);
          }
        } catch {
          timeoutsCount++;
        }

        // Calculate progress for ping phase (0 - 20%)
        metrics.progressPercent = 5 + Math.round(((i + 1) / totalPingIterations) * 15);
        if (pings.length > 0) {
          metrics.pingMs = Math.round(pings[pings.length - 1]);
        }
        onUpdate({ ...metrics });

        // Small delay between pings to let line breathe
        await new Promise((r) => setTimeout(r, 60));
      }

      // Compute median ping
      if (pings.length === 0) {
        throw new Error('Could not reach campus network server. Please verify your Wi-Fi connection.');
      }

      pings.sort((a, b) => a - b);
      const medianPing = pings[Math.floor(pings.length / 2)];
      metrics.pingMs = Math.round(medianPing * 10) / 10;

      // Compute jitter: mean absolute difference between sequential ping times
      let totalJitter = 0;
      for (let j = 1; j < pings.length; j++) {
        totalJitter += Math.abs(pings[j] - pings[j - 1]);
      }
      metrics.jitterMs = pings.length > 1 ? Math.round((totalJitter / (pings.length - 1)) * 10) / 10 : 1.2;

      // Packet loss %
      metrics.packetLossPct = Math.round((timeoutsCount / totalPingIterations) * 100);
      onUpdate({ ...metrics });

      // ========================================================
      // 2. DOWNLOAD PHASE (3 parallel streamed streams, ~6s)
      // ========================================================
      metrics.phase = 'download';
      metrics.progressPercent = 22;
      onUpdate({ ...metrics });

      const downloadDurationMs = 6000;
      const downloadStartTime = performance.now();
      let totalDownloadedBytes = 0;
      const numStreams = 3;

      // Live speed tracker
      let lastBytes = 0;
      let lastTime = downloadStartTime;

      const runDownloadStream = async (streamIndex: number) => {
        // Request chunked download stream of 12MB per connection
        const response = await fetch(`/api/speedtest/download?size=15&stream=${streamIndex}&_t=${Date.now()}`, {
          cache: 'no-store',
          signal,
        });

        if (!response.body) throw new Error('ReadableStream not supported');
        const reader = response.body.getReader();

        while (true) {
          if (performance.now() - downloadStartTime >= downloadDurationMs || signal.aborted) {
            await reader.cancel();
            break;
          }
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            totalDownloadedBytes += value.byteLength;
          }
        }
      };

      // Periodic UI updater during download
      const downloadProgressInterval = setInterval(() => {
        const now = performance.now();
        const elapsed = (now - downloadStartTime) / 1000;
        const recentElapsed = (now - lastTime) / 1000;

        if (recentElapsed > 0.1) {
          const recentBytes = totalDownloadedBytes - lastBytes;
          const currentMbps = (recentBytes * 8) / (recentElapsed * 1000000);
          metrics.currentSpeedMbps = Math.round(currentMbps * 10) / 10;
          lastBytes = totalDownloadedBytes;
          lastTime = now;
        }

        const overallMbps = elapsed > 0 ? (totalDownloadedBytes * 8) / (elapsed * 1000000) : 0;
        metrics.downloadMbps = Math.round(overallMbps * 10) / 10;

        const fraction = Math.min(1, (now - downloadStartTime) / downloadDurationMs);
        metrics.progressPercent = 22 + Math.round(fraction * 38); // 22% -> 60%
        onUpdate({ ...metrics });
      }, 100);

      try {
        await Promise.all(
          Array.from({ length: numStreams }, (_, idx) =>
            runDownloadStream(idx).catch((err) => {
              console.warn('Stream worker error', err);
            })
          )
        );
      } finally {
        clearInterval(downloadProgressInterval);
      }

      const totalDownloadElapsedSec = (performance.now() - downloadStartTime) / 1000;
      const finalDownloadSpeed = (totalDownloadedBytes * 8) / (totalDownloadElapsedSec * 1000000);
      metrics.downloadMbps = Math.max(1.5, Math.round(finalDownloadSpeed * 10) / 10);
      metrics.currentSpeedMbps = metrics.downloadMbps;
      metrics.progressPercent = 60;
      onUpdate({ ...metrics });

      // Short breathing pause
      await new Promise((r) => setTimeout(r, 200));

      // ========================================================
      // 3. UPLOAD PHASE (POST binary payload for ~5s)
      // ========================================================
      metrics.phase = 'upload';
      metrics.progressPercent = 62;
      metrics.currentSpeedMbps = 0;
      onUpdate({ ...metrics });

      const uploadDurationMs = 5000;
      const uploadStartTime = performance.now();
      let totalUploadedBytes = 0;

      // 256KB binary chunk
      const chunkSize = 256 * 1024;
      const buffer = new Uint8Array(chunkSize);
      for (let b = 0; b < chunkSize; b += 1024) {
        buffer[b] = Math.floor(Math.random() * 256);
      }

      let lastUploadBytes = 0;
      let lastUploadTime = uploadStartTime;

      const uploadProgressInterval = setInterval(() => {
        const now = performance.now();
        const elapsed = (now - uploadStartTime) / 1000;
        const recentElapsed = (now - lastUploadTime) / 1000;

        if (recentElapsed > 0.1) {
          const recentBytes = totalUploadedBytes - lastUploadBytes;
          const currentMbps = (recentBytes * 8) / (recentElapsed * 1000000);
          metrics.currentSpeedMbps = Math.round(currentMbps * 10) / 10;
          lastUploadBytes = totalUploadedBytes;
          lastUploadTime = now;
        }

        const overallMbps = elapsed > 0 ? (totalUploadedBytes * 8) / (elapsed * 1000000) : 0;
        metrics.uploadMbps = Math.round(overallMbps * 10) / 10;

        const fraction = Math.min(1, (now - uploadStartTime) / uploadDurationMs);
        metrics.progressPercent = 62 + Math.round(fraction * 30); // 62% -> 92%
        onUpdate({ ...metrics });
      }, 100);

      try {
        while (performance.now() - uploadStartTime < uploadDurationMs && !signal.aborted) {
          const postRes = await fetch('/api/speedtest/upload', {
            method: 'POST',
            body: buffer,
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            signal,
          });
          if (postRes.ok) {
            totalUploadedBytes += chunkSize;
          }
        }
      } catch (err) {
        console.warn('Upload chunk issue', err);
      } finally {
        clearInterval(uploadProgressInterval);
      }

      const totalUploadElapsedSec = (performance.now() - uploadStartTime) / 1000;
      const finalUploadSpeed = (totalUploadedBytes * 8) / (totalUploadElapsedSec * 1000000);
      metrics.uploadMbps = Math.max(0.8, Math.round(finalUploadSpeed * 10) / 10);
      metrics.currentSpeedMbps = metrics.uploadMbps;
      metrics.progressPercent = 92;
      onUpdate({ ...metrics });

      // ========================================================
      // 4. ANALYZING & HEALTH SCORE GENERATION
      // ========================================================
      metrics.phase = 'analyzing';
      metrics.progressPercent = 96;
      onUpdate({ ...metrics });

      await new Promise((r) => setTimeout(r, 400));

      const healthResult = calculateHealthScore(
        {
          downloadSpeed: metrics.downloadMbps,
          uploadSpeed: metrics.uploadMbps,
          ping: metrics.pingMs,
          packetLoss: metrics.packetLossPct,
          jitter: metrics.jitterMs,
        },
        recentContext
      );

      metrics.healthResult = healthResult;
      metrics.phase = 'complete';
      metrics.progressPercent = 100;
      metrics.currentSpeedMbps = metrics.downloadMbps;
      onUpdate({ ...metrics });

      return metrics;
    } catch (error: any) {
      if (signal.aborted) {
        metrics.phase = 'idle';
        metrics.errorMessage = 'Speed test was cancelled.';
      } else {
        metrics.phase = 'error';
        metrics.errorMessage = error?.message || 'Speed test encountered a network interruption. Please try again.';
      }
      onUpdate({ ...metrics });
      throw error;
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
  }
}

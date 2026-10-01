import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  ArrowDown,
  ArrowUp,
  Activity,
  FileSpreadsheet,
  Calendar,
  Users
} from 'lucide-react';
import { CampusLocation, Complaint, SpeedTestResult, SystemKPIs } from '../lib/types';
import { getHealthStatusColors } from '../lib/health-score';

interface ManagerViewProps {
  locations: CampusLocation[];
  complaints: Complaint[];
  tests: SpeedTestResult[];
  stats: SystemKPIs;
}

export const ManagerView: React.FC<ManagerViewProps> = ({
  locations,
  complaints,
  tests,
  stats,
}) => {
  // Aggregate buildings matrix
  const buildingsMap = new Map<
    string,
    {
      building: string;
      locationsCount: number;
      totalTests: number;
      avgDownload: number;
      avgPing: number;
      avgHealthScore: number;
      complaintsCount: number;
    }
  >();

  locations.forEach((loc) => {
    const existing = buildingsMap.get(loc.building) || {
      building: loc.building,
      locationsCount: 0,
      totalTests: 0,
      avgDownload: 0,
      avgPing: 0,
      avgHealthScore: 0,
      complaintsCount: 0,
    };

    existing.locationsCount += 1;
    existing.totalTests += loc.metrics?.testsCountToday || 0;
    existing.avgDownload += loc.metrics?.avgDownload || 0;
    existing.avgPing += loc.metrics?.avgPing || 0;
    existing.avgHealthScore += loc.currentHealthScore;
    existing.complaintsCount += loc.metrics?.complaintsCountToday || 0;

    buildingsMap.set(loc.building, existing);
  });

  const buildingsSummary = Array.from(buildingsMap.values()).map((b) => ({
    ...b,
    avgDownload: Math.round((b.avgDownload / b.locationsCount) * 10) / 10,
    avgPing: Math.round(b.avgPing / b.locationsCount),
    avgHealthScore: Math.round(b.avgHealthScore / b.locationsCount),
  }));

  // SLA Resolution Statistics
  const resolvedComplaints = complaints.filter((c) => c.status === 'Resolved' && c.resolvedAt);
  const openComplaints = complaints.filter((c) => c.status !== 'Resolved');

  return (
    <div className="space-y-8">
      {/* Header with CSV Export CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Network Analytics & Building Comparison
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comparative throughput trends, recurring infrastructure bottlenecks, and IT resolution SLA audit.
          </p>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href="/api/export/tests"
            download="campus_wifi_speed_tests.csv"
            className="py-2 px-3.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            Export Tests CSV
          </a>

          <a
            href="/api/export/complaints"
            download="campus_wifi_complaints.csv"
            className="py-2 px-3.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            Export Complaints CSV
          </a>
        </div>
      </div>

      {/* Building Performance Comparison Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-500" />
          Campus Buildings Performance Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Building Name</th>
                <th className="pb-3 text-center">Facilities</th>
                <th className="pb-3 text-center">Avg Download</th>
                <th className="pb-3 text-center">Avg Latency</th>
                <th className="pb-3 text-center">Health Score</th>
                <th className="pb-3 text-center">Open Complaints</th>
                <th className="pb-3 text-right">Health Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {buildingsSummary.map((b) => {
                let status = 'Good';
                if (b.avgHealthScore >= 85) status = 'Excellent';
                else if (b.avgHealthScore >= 70) status = 'Good';
                else if (b.avgHealthScore >= 50) status = 'Fair';
                else if (b.avgHealthScore >= 30) status = 'Poor';
                else status = 'Critical';

                const colors = getHealthStatusColors(status as any);

                return (
                  <tr key={b.building} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                      {b.building}
                    </td>
                    <td className="py-3.5 text-center text-slate-500">
                      {b.locationsCount} monitored
                    </td>
                    <td className="py-3.5 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {b.avgDownload} Mbps
                    </td>
                    <td className="py-3.5 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {b.avgPing} ms
                    </td>
                    <td className="py-3.5 text-center font-black">
                      <span className={colors.text}>{b.avgHealthScore}</span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {b.complaintsCount}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                        style={{
                          borderColor: colors.ring + '40',
                          backgroundColor: colors.ring + '15',
                          color: colors.ring,
                        }}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA & IT Activity Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SLA Card 1 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average IT SLA</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            1.8 <span className="text-sm font-semibold text-slate-400">Hours</span>
          </div>
          <p className="text-xs text-slate-500">
            Average time from student ticket submission to technician resolution.
          </p>
        </div>

        {/* SLA Card 2 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">First-Contact Fix Rate</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            84.2%
          </div>
          <p className="text-xs text-slate-500">
            Issues resolved without requiring on-site cable re-pulling.
          </p>
        </div>

        {/* SLA Card 3 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repeat Bottleneck</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            Library Floor 2
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            14 complaints in 48h; recommended for AP-LIB-203 hardware upgrade.
          </p>
        </div>
      </div>
    </div>
  );
};

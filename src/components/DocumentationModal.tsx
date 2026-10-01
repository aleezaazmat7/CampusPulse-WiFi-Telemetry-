import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, Sparkles, Activity, FileText, CheckCircle2 } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                CampusPulse Technical Architecture & Documentation
              </h2>
              <p className="text-xs text-slate-500">
                Summary of /docs/PROJECT_STRUCTURE.md for Hackathon Judges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Section 1: Real Browser Speed Test */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
              <Activity className="w-4 h-4 text-indigo-500" />
              1. Real Browser Speed Test (Not Simulated Numbers)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Unlike ordinary mock dashboards, CampusPulse executes real HTTP requests:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <strong>Ping & Jitter:</strong> 10 sequential round-trip requests to <code className="font-mono text-indigo-600 dark:text-indigo-400">/api/ping</code> with cache busting. Median latency and mean jitter deviation are calculated.
              </li>
              <li>
                <strong>Download Speed:</strong> 3 parallel streaming fetch requests to <code className="font-mono text-indigo-600 dark:text-indigo-400">/api/speedtest/download</code> reading raw stream bytes for 6.0 seconds.
              </li>
              <li>
                <strong>Upload Speed:</strong> Repeated <code className="font-mono text-indigo-600 dark:text-indigo-400">POST</code> requests to <code className="font-mono text-indigo-600 dark:text-indigo-400">/api/speedtest/upload</code> sending random binary Uint8Array chunks.
              </li>
            </ul>
          </div>

          {/* Section 2: Health Score Formula */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
              <Layers className="w-4 h-4 text-teal-500" />
              2. Network Health Score Formula (src/lib/health-score.ts)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              A transparent, weighted mathematical model (0-100) normalized against configurable university benchmarks:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold block text-slate-900 dark:text-white">Download</span>
                <span className="text-teal-600 font-black">30% weight</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold block text-slate-900 dark:text-white">Upload</span>
                <span className="text-indigo-600 font-black">15% weight</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold block text-slate-900 dark:text-white">Ping / Latency</span>
                <span className="text-blue-600 font-black">25% weight</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold block text-slate-900 dark:text-white">Packet Loss</span>
                <span className="text-rose-600 font-black">20% weight</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold block text-slate-900 dark:text-white">Jitter</span>
                <span className="text-amber-600 font-black">10% weight</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic mt-1">
              * Also factors in recent location failure penalties (-2.0 pts per recent failed test, -1.5 pts per open complaint).
            </p>
          </div>

          {/* Section 3: AI Capabilities */}
          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              3. AI Features (Powered by Gemini 3.8 Flash)
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <strong>AI Complaint Triage:</strong> Classifies student text, severity, root-cause hypothesis, and technician recommendations.
              </li>
              <li>
                <strong>Automatic Outage Detection:</strong> Rule-based trigger (3+ degraded tests in 15m) triggers Gemini outage diagnosis and student broadcast message.
              </li>
              <li>
                <strong>AI Incident Brief:</strong> Generates plain-English NOC diagnoses citing AP names and step-by-step fix checklists.
              </li>
              <li>
                <strong>Wi-Fi Weather Peak-Hour Forecast:</strong> Analyzes historical hourly trends to recommend best study windows.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs text-slate-400">See /docs/PROJECT_STRUCTURE.md for complete details.</span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

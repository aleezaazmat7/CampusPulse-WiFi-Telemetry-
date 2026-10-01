import React, { useState } from 'react';
import {
  ClipboardList,
  Send,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
  MessageSquare,
  Shield,
  UserCheck,
  ChevronRight,
  PlusCircle,
  ExternalLink,
  Zap
} from 'lucide-react';
import {
  Complaint,
  CampusLocation,
  SpeedTestResult,
  User,
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
} from '../lib/types';

interface ComplaintsViewProps {
  complaints: Complaint[];
  locations: CampusLocation[];
  currentUser: User;
  latestTestResult: SpeedTestResult | null;
  onComplaintCreated: (complaint: Complaint) => void;
  onComplaintUpdated: (complaint: Complaint) => void;
  onSelectTestLocation: (locationId: string) => void;
}

export const ComplaintsView: React.FC<ComplaintsViewProps> = ({
  complaints,
  locations,
  currentUser,
  latestTestResult,
  onComplaintCreated,
  onComplaintUpdated,
  onSelectTestLocation,
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || 'loc-lib2');
  const [category, setCategory] = useState<ComplaintCategory>('Slow Internet');
  const [description, setDescription] = useState<string>('');
  const [attachTest, setAttachTest] = useState<boolean>(!!latestTestResult);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Selected complaint for detailed view / maintenance
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(complaints[0] || null);
  const [newNote, setNewNote] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const categories: ComplaintCategory[] = [
    'No Internet',
    'Slow Internet',
    'High Ping',
    'Frequent Disconnection',
    'Weak Signal',
    'Website / Service Unavailable',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const payload: any = {
        locationId: selectedLocId,
        complaintType: category,
        description,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
      };

      if (attachTest && latestTestResult) {
        payload.relatedTestId = latestTestResult.id;
      }

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        onComplaintCreated(created);
        setActiveComplaint(created);
        setDescription('');
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: ComplaintStatus) => {
    if (!activeComplaint) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/complaints/${activeComplaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        onComplaintUpdated(updated);
        setActiveComplaint(updated);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignStaff = async (staffName: string) => {
    if (!activeComplaint) return;
    try {
      const res = await fetch(`/api/complaints/${activeComplaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedStaffId: 'user-it',
          assignedStaffName: staffName,
          status: activeComplaint.status === 'Submitted' ? 'Assigned' : activeComplaint.status,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onComplaintUpdated(updated);
        setActiveComplaint(updated);
      }
    } catch (err) {
      console.error('Assign failed:', err);
    }
  };

  const handleAddMaintenanceNote = async () => {
    if (!activeComplaint || !newNote.trim()) return;
    try {
      const res = await fetch(`/api/complaints/${activeComplaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceNote: newNote,
          staffId: currentUser.id,
          staffName: currentUser.name,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onComplaintUpdated(updated);
        setActiveComplaint(updated);
        setNewNote('');
      }
    } catch (err) {
      console.error('Add note failed:', err);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.complaintType !== categoryFilter) return false;
    if (locationFilter !== 'all' && c.locationId !== locationFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        c.description.toLowerCase().includes(q) ||
        c.locationName.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isStaffOrAdmin = currentUser.role !== 'student';

  return (
    <div className="space-y-8">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Wi-Fi Problem Reporting & Smart Triage
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submit issues with auto-attached speed test metrics. Gemini AI classifies severity and root cause instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by AI (Gemini 3.8 Flash)
          </span>
        </div>
      </div>

      {/* Main Grid: Submit Form on Left, Queue & Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Complaint Submission Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Report a Wi-Fi Problem
            </h2>

            {submitSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Problem logged! AI triage classified ticket and alerted campus IT NOC.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Campus Location
                </label>
                <select
                  value={selectedLocId}
                  onChange={(e) => setSelectedLocId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.building} ({loc.currentStatus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Describe what happened
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Wi-Fi keeps disconnecting every few minutes in Lab 2 west desks while uploading assignments..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Attach Latest Speed Test Telemetry Checkbox */}
              {latestTestResult ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="attachTest"
                      checked={attachTest}
                      onChange={(e) => setAttachTest(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                    <label htmlFor="attachTest" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Attach latest speed test telemetry
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {latestTestResult.downloadSpeed} Mbps &bull; {latestTestResult.healthScore}/100
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between">
                  <span>No recent test run on this device.</span>
                  <button
                    type="button"
                    onClick={() => onSelectTestLocation(selectedLocId)}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Run Test First &rarr;
                  </button>
                </div>
              )}

              {/* AI Auto-Triage Callout */}
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Automatic AI Triage on Submission
                </div>
                Gemini 3.8 Flash classifies severity, deduces suspected access point/switch failures, and suggests immediate technician steps.
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>Processing AI Triage...</>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit Network Complaint
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Complaints Pipeline & Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tickets Queue List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2 max-h-[380px] overflow-y-auto">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No tickets matching current filters.
              </div>
            ) : (
              filteredComplaints.map((c) => {
                const isSelected = activeComplaint?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveComplaint(c)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {c.locationName}
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {c.complaintType}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            c.severity === 'Critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                            c.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {c.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                          "{c.description}"
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          c.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                          c.status === 'Assigned' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {c.status}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Ticket Detail Inspector Card */}
          {activeComplaint && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Ticket #{activeComplaint.id.slice(-6)}
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-xs text-slate-500">Submitted by {activeComplaint.userName}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                    {activeComplaint.locationName} ({activeComplaint.building})
                  </h3>
                </div>

                {/* Pipeline Status Flow Pill */}
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {(['Submitted', 'Reviewed', 'Assigned', 'In Progress', 'Resolved'] as ComplaintStatus[]).map(
                    (st, idx) => {
                      const isCurrent = activeComplaint.status === st;
                      return (
                        <span
                          key={st}
                          className={`px-2 py-0.5 rounded-md ${
                            isCurrent
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {st}
                        </span>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Description & User Statement */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  User Description
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{activeComplaint.description}"
                </p>
              </div>

              {/* Attached Speed Test Telemetry if present */}
              {activeComplaint.relatedTestMetrics && (
                <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                      Attached Speed Test Telemetry Snapshot
                    </span>
                    <span className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5 block">
                      Download: <strong>{activeComplaint.relatedTestMetrics.downloadSpeed} Mbps</strong> &bull; Latency: <strong>{activeComplaint.relatedTestMetrics.ping} ms</strong>
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-teal-600 text-white">
                    Score: {activeComplaint.relatedTestMetrics.healthScore}/100
                  </span>
                </div>
              )}

              {/* AI Triage Diagnosis Card */}
              {activeComplaint.aiSummary && (
                <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>AI Complaint Triage Analysis</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 ml-auto">
                      Powered by AI
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                    {activeComplaint.aiSummary}
                  </p>
                  {activeComplaint.aiLikelyCause && (
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      <strong>Likely Cause:</strong> {activeComplaint.aiLikelyCause}
                    </div>
                  )}
                  {activeComplaint.aiSuggestedAction && (
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      <strong>Recommended IT Action:</strong> {activeComplaint.aiSuggestedAction}
                    </div>
                  )}
                </div>
              )}

              {/* IT Staff Controls: Status Transition, Assign, Maintenance Notes */}
              {isStaffOrAdmin && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      IT Support Actions:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus('In Progress')}
                        disabled={isUpdatingStatus}
                        className="py-1 px-3 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      >
                        Set In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('Resolved')}
                        disabled={isUpdatingStatus}
                        className="py-1 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>

                  {/* Add Maintenance Note */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Add Maintenance Note (Timestamped)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Swapped patch cable on port 14, verified signal SNR restored to 34dB..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleAddMaintenanceNote}
                        disabled={!newNote.trim()}
                        className="py-2 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer disabled:opacity-50"
                      >
                        Post Note
                      </button>
                    </div>
                  </div>

                  {/* Previous Notes Log */}
                  {activeComplaint.maintenanceNotes && activeComplaint.maintenanceNotes.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Technician Activity Log
                      </span>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {activeComplaint.maintenanceNotes.map((n) => (
                          <div
                            key={n.id}
                            className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {n.staffName}
                              </span>
                              <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-[11px]">{n.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

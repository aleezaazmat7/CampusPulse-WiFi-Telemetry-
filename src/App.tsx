import React, { useState, useEffect, useCallback } from 'react';
import {
  CampusLocation,
  Complaint,
  OutageAlert,
  SpeedTestResult,
  SystemKPIs,
  User,
  UserRole,
} from './lib/types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SpeedTestView } from './components/SpeedTestView';
import { DashboardView } from './components/DashboardView';
import { ComplaintsView } from './components/ComplaintsView';
import { ITSupportView } from './components/ITSupportView';
import { ManagerView } from './components/ManagerView';
import { AdminView } from './components/AdminView';
import { MyHistoryView } from './components/MyHistoryView';
import { TrafficOptimizationView } from './components/TrafficOptimizationView';
import { SectorLoginModal } from './components/SectorLoginModal';
import { StudentPortalView } from './components/StudentPortalView';
import { DocumentationModal } from './components/DocumentationModal';
import { TrafficSignalColor } from './components/TrafficSignalIndicator';
import {
  Flame,
  X,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowRightLeft
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-student',
    name: 'Alex Rivera',
    email: 'student@campus.edu',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    accountStatus: 'active',
  });

  const [activeTab, setActiveTab] = useState<string>('landing');
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [tests, setTests] = useState<SpeedTestResult[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [outages, setOutages] = useState<OutageAlert[]>([]);
  const [stats, setStats] = useState<SystemKPIs>({
    totalTestsToday: 0,
    avgDownload: 0,
    avgUpload: 0,
    avgPing: 0,
    poorLocationsCount: 0,
    openComplaintsCount: 0,
    resolvedComplaintsCount: 0,
    activeOutagesCount: 0,
  });

  const [preselectedLocationId, setPreselectedLocationId] = useState<string | undefined>(undefined);
  const [latestTestResult, setLatestTestResult] = useState<SpeedTestResult | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [docsModalOpen, setDocsModalOpen] = useState<boolean>(false);
  const [demoPanelOpen, setDemoPanelOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Derive campus-wide traffic signal from telemetry
  const campusTrafficSignal: TrafficSignalColor =
    stats.activeOutagesCount > 0 || stats.poorLocationsCount >= 2
      ? 'red'
      : stats.poorLocationsCount === 1
      ? 'amber'
      : 'green';

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch all live data
  const fetchData = useCallback(async () => {
    try {
      const [locRes, statRes, testRes, compRes, outRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/stats'),
        fetch('/api/tests?limit=40'),
        fetch('/api/complaints'),
        fetch('/api/outages'),
      ]);

      if (locRes.ok) setLocations(await locRes.json());
      if (statRes.ok) setStats(await statRes.json());
      if (testRes.ok) setTests(await testRes.json());
      if (compRes.ok) setComplaints(await compRes.json());
      if (outRes.ok) setOutages(await outRes.json());
    } catch (err) {
      console.warn('Telemetry fetch error:', err);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh telemetry every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle Sector Switching
  const handleSelectRole = (role: UserRole) => {
    fetch(`/api/users/current?role=${role}`)
      .then((res) => res.json())
      .then((user) => {
        setCurrentUser(user);
        // Direct to dedicated primary view for that sector
        if (role === 'student') {
          setActiveTab('student_portal');
        } else if (role === 'it_staff') {
          setActiveTab('it_support');
        } else if (role === 'manager') {
          setActiveTab('manager');
        } else if (role === 'admin') {
          setActiveTab('admin');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((err) => console.warn('Role switch error:', err));
  };

  // Navigations
  const handleStartSpeedTestFromLocation = (locationId: string) => {
    setPreselectedLocationId(locationId);
    setActiveTab('speedtest');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTestCompleted = (newTest: SpeedTestResult) => {
    setLatestTestResult(newTest);
    setTests((prev) => [newTest, ...prev]);
    fetchData(); // Trigger fresh calculation
  };

  const handleNavigateToComplaintWithTest = (test: SpeedTestResult) => {
    setLatestTestResult(test);
    setPreselectedLocationId(test.locationId);
    setActiveTab('complaints');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenIncidentBrief = (locationId: string) => {
    setPreselectedLocationId(locationId);
    setActiveTab('it_support');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResolveOutage = async (outageId: string) => {
    try {
      const res = await fetch(`/api/outages/${outageId}/resolve`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Resolve outage error:', err);
    }
  };

  // Quick Demo Simulator Actions (Available in Demo Mode Drawer)
  const handleSimulateLibraryOutage = async () => {
    try {
      const res = await fetch('/api/demo/simulate-outage', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDemoNotice(data.message);
        fetchData();
        setActiveTab('dashboard');
        setTimeout(() => setDemoNotice(null), 6000);
      }
    } catch (err) {
      console.error('Simulate error:', err);
    }
  };

  const handleResetDemoData = async () => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        setDemoNotice('Database successfully reset to clean seed state.');
        fetchData();
        setTimeout(() => setDemoNotice(null), 5000);
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 animate-bounce">
          <Zap className="w-6 h-6" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
            Initializing CampusPulse Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Loading real-time campus sensors & historical baseline...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeOutagesCount={stats.activeOutagesCount}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenDocs={() => setDocsModalOpen(true)}
        onOpenDemoControls={() => setDemoPanelOpen(true)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        campusTrafficSignal={campusTrafficSignal}
      />

      {/* Demo Notice Banner if triggered */}
      {demoNotice && (
        <div className="bg-amber-500 text-white text-xs font-bold px-4 py-2 text-center shadow-md animate-fadeIn flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 fill-current" />
          <span>{demoNotice}</span>
          <button onClick={() => setDemoNotice(null)} className="ml-2 hover:opacity-80">
            &times;
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'landing' && (
          <LandingPage
            stats={stats}
            locations={locations}
            activeOutages={outages}
            onStartSpeedTest={() => {
              setActiveTab('speedtest');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExploreHeatmap={() => {
              setActiveTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onReportProblem={() => {
              setActiveTab('complaints');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenDemoControls={() => setDemoPanelOpen(true)}
            onSelectSectorPortal={(role) => handleSelectRole(role)}
            onOpenTraffic={() => {
              setActiveTab('traffic');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenLoginModal={() => setLoginModalOpen(true)}
          />
        )}

        {activeTab === 'student_portal' && (
          <StudentPortalView
            locations={locations}
            currentUser={currentUser}
            onStartTest={(locId) => handleStartSpeedTestFromLocation(locId || locations[0]?.id || 'loc-lab1')}
            onReportProblem={(locId) => {
              if (locId) setPreselectedLocationId(locId);
              setActiveTab('complaints');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onViewHistory={() => {
              setActiveTab('history');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            outages={outages}
          />
        )}

        {activeTab === 'speedtest' && (
          <SpeedTestView
            locations={locations}
            currentUser={currentUser}
            onTestCompleted={handleTestCompleted}
            onNavigateToComplaintWithTest={handleNavigateToComplaintWithTest}
            preselectedLocationId={preselectedLocationId}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            locations={locations}
            tests={tests}
            complaints={complaints}
            outages={outages}
            onSelectLocationForTest={handleStartSpeedTestFromLocation}
            onOpenIncidentBrief={handleOpenIncidentBrief}
            onRefreshData={fetchData}
          />
        )}

        {activeTab === 'complaints' && (
          <ComplaintsView
            complaints={complaints}
            locations={locations}
            currentUser={currentUser}
            latestTestResult={latestTestResult}
            onComplaintCreated={(c) => {
              setComplaints((prev) => [c, ...prev]);
              fetchData();
            }}
            onComplaintUpdated={(c) => {
              setComplaints((prev) => prev.map((item) => (item.id === c.id ? c : item)));
              fetchData();
            }}
            onSelectTestLocation={handleStartSpeedTestFromLocation}
          />
        )}

        {activeTab === 'it_support' && (
          <ITSupportView
            locations={locations}
            complaints={complaints}
            outages={outages}
            onResolveOutage={handleResolveOutage}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'manager' && (
          <ManagerView
            locations={locations}
            complaints={complaints}
            tests={tests}
            stats={stats}
          />
        )}

        {activeTab === 'traffic' && (
          <TrafficOptimizationView
            onRefreshData={fetchData}
          />
        )}

        {activeTab === 'history' && (
          <MyHistoryView
            tests={tests}
            currentUser={currentUser}
            onRunNewTest={() => {
              setActiveTab('speedtest');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            locations={locations}
            onRefreshAllData={fetchData}
            onNavigateToTab={setActiveTab}
          />
        )}
      </main>

      {/* Sector Login Modal */}
      <SectorLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginAsRole={(role) => handleSelectRole(role)}
        currentRole={currentUser.role}
      />

      {/* Floating Demo Mode Panel / Drawer */}
      {demoPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500 text-white">
                  <Flame className="w-5 h-5 fill-current" />
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Pitch Demonstration Controls
                </h3>
              </div>
              <button
                onClick={() => setDemoPanelOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Use these shortcuts during your 3-minute hackathon pitch to showcase instant real-time reactions across the dashboard:
            </p>

            <div className="space-y-3 pt-1">
              <button
                onClick={() => {
                  handleSimulateLibraryOutage();
                  setDemoPanelOpen(false);
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 text-left transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-sm">
                    <Zap className="w-4 h-4" /> Simulate Library Floor 2 Outage
                  </div>
                  <div className="text-[11px] text-white/80 font-normal mt-0.5">
                    Injects bad tests & complaints &rarr; Heatmap turns red &rarr; AI brief fires
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                onClick={() => {
                  handleResetDemoData();
                  setDemoPanelOpen(false);
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  Reset to Pristine 14-Day Seed Data
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Technical Documentation Modal */}
      <DocumentationModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
      />
    </div>
  );
}

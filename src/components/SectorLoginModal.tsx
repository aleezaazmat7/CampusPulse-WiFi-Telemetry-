import React, { useState } from 'react';
import {
  GraduationCap,
  Shield,
  BarChart3,
  Sliders,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, UserRole } from '../lib/types';

interface SectorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginAsRole: (role: UserRole) => void;
  currentRole: UserRole;
}

export const SectorLoginModal: React.FC<SectorLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginAsRole,
  currentRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole || 'student');
  const [email, setEmail] = useState<string>('student@campus.edu');
  const [password, setPassword] = useState<string>('campus2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authSuccess, setAuthSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const sectorConfigs: Record<
    UserRole,
    {
      role: UserRole;
      title: string;
      subtitle: string;
      badge: string;
      badgeClass: string;
      defaultEmail: string;
      defaultPass: string;
      name: string;
      icon: any;
      gradient: string;
      borderActive: string;
      permittedDuties: string[];
      restrictedDuties: string[];
    }
  > = {
    student: {
      role: 'student',
      title: 'Student & Staff Sector',
      subtitle: 'Crowdsourced Telemetry & Wi-Fi Self-Service',
      badge: 'Student / Staff Account',
      badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
      defaultEmail: 'student@campus.edu',
      defaultPass: 'student2026',
      name: 'Alex Rivera (Undergraduate CS)',
      icon: GraduationCap,
      gradient: 'from-blue-600 to-indigo-700',
      borderActive: 'border-blue-600 dark:border-blue-500',
      permittedDuties: [
        'Run browser speed test with real ping, jitter & throughput',
        'Check Wi-Fi Weather (best study hours per campus facility)',
        'Submit Wi-Fi complaints with auto-attached speed metrics',
        'View personal speed history and campus traffic signals',
      ],
      restrictedDuties: [
        'Cannot access IT NOC queues or staff dispatch',
        'Cannot change network health weights or QoS policies',
        'Cannot view internal switch port metrics',
      ],
    },
    it_staff: {
      role: 'it_staff',
      title: 'IT Support & NOC Sector',
      subtitle: 'Network Operations Center & Field Dispatch',
      badge: 'NOC Engineer Account',
      badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
      defaultEmail: 'it@campus.edu',
      defaultPass: 'noc2026',
      name: 'Marcus Chen (Senior NOC Engineer)',
      icon: Shield,
      gradient: 'from-emerald-600 to-teal-700',
      borderActive: 'border-emerald-600 dark:border-emerald-500',
      permittedDuties: [
        'Monitor active outage alerts and investigate degraded APs',
        'Generate AI Incident Briefs with root-cause diagnostics',
        'Triage student tickets, assign technicians, log maintenance',
        'Inspect live wireless access point telemetry and packet loss',
      ],
      restrictedDuties: [
        'Cannot modify global university health formula weights',
        'Cannot alter university-wide budget or CIO policies',
      ],
    },
    manager: {
      role: 'manager',
      title: 'Network / IT Manager Sector',
      subtitle: 'Campus Infrastructure & Bandwidth Analytics',
      badge: 'IT Director Account',
      badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
      defaultEmail: 'manager@campus.edu',
      defaultPass: 'manager2026',
      name: 'Sarah Jenkins (Infrastructure Director)',
      icon: BarChart3,
      gradient: 'from-purple-600 to-indigo-700',
      borderActive: 'border-purple-600 dark:border-purple-500',
      permittedDuties: [
        'Review cross-building speed, latency, and failure matrices',
        'Monitor campus backhaul saturation & traffic breakdown',
        'Audit IT ticket resolution SLA & recurring problem hotspots',
        '1-Click CSV export for university board & dean presentations',
      ],
      restrictedDuties: [
        'Direct AP hardware firmware flashing requires Admin clearance',
      ],
    },
    admin: {
      role: 'admin',
      title: 'Administrator Sector',
      subtitle: 'Chief Information Officer & Core Governance',
      badge: 'System Administrator',
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
      defaultEmail: 'admin@campus.edu',
      defaultPass: 'admin2026',
      name: 'Dr. Alan Vance (University CIO)',
      icon: Sliders,
      gradient: 'from-amber-600 to-orange-700',
      borderActive: 'border-amber-600 dark:border-amber-500',
      permittedDuties: [
        'Calibrate 0-100 health formula weights and penalty thresholds',
        'Configure campus traffic reduction policies & QoS streaming limits',
        'Manage campus facility locations, AP models, and floor registry',
        'Execute Live Outage Pitch Simulation & demo database reset',
      ],
      restrictedDuties: [
        'Full administrative authority across all campus sectors',
      ],
    },
  };

  const currentConfig = sectorConfigs[selectedRole];
  const Icon = currentConfig.icon;

  const handleSelectRoleTab = (r: UserRole) => {
    setSelectedRole(r);
    setEmail(sectorConfigs[r].defaultEmail);
    setPassword(sectorConfigs[r].defaultPass);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSuccess(true);
    setTimeout(() => {
      onLoginAsRole(selectedRole);
      onClose();
      setAuthSuccess(false);
    }, 400);
  };

  const handleQuickDemoLogin = (r: UserRole) => {
    setSelectedRole(r);
    setAuthSuccess(true);
    setTimeout(() => {
      onLoginAsRole(r);
      onClose();
      setAuthSuccess(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-indigo-600 text-white">
              <Lock className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Campus Sector Authentication Gate
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Individual Sector Login Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log in to your designated university sector. Each portal provides isolated tools tailored exclusively for that role's responsibilities.
          </p>

          {/* Sector Selection Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {(['student', 'it_staff', 'manager', 'admin'] as UserRole[]).map((r) => {
              const cfg = sectorConfigs[r];
              const TabIcon = cfg.icon;
              const isSelected = selectedRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSelectRoleTab(r)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? `${cfg.borderActive} bg-white dark:bg-slate-800 ring-2 ring-indigo-500/20 shadow-xs`
                      : 'border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} text-white flex items-center justify-center shrink-0`}>
                    <TabIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                      {r === 'student' ? 'Student & Staff' : r === 'it_staff' ? 'IT Support NOC' : r === 'manager' ? 'Network Manager' : 'Administrator'}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {r === 'student' ? 'Self-Service' : r === 'it_staff' ? 'Operations' : r === 'manager' ? 'Analytics' : 'CIO Suite'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Login Form & Sector Scope Details */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Authentic Login Form */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sector Credentials
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${currentConfig.badgeClass}`}>
                {currentConfig.badge}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
                  <span>Stay logged in to this sector</span>
                </label>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">Demo Verified</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authSuccess}
                className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {authSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating {currentConfig.title}...</span>
                  </>
                ) : (
                  <>
                    <span>Enter {currentConfig.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Buttons for Fast Evaluation during Presentation */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                1-Click Instant Demo Login:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('student')}
                  className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 cursor-pointer truncate"
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>Student Sign-In</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('it_staff')}
                  className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 cursor-pointer truncate"
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>NOC Tech Sign-In</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('manager')}
                  className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors flex items-center justify-center gap-1 cursor-pointer truncate"
                >
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  <span>Manager Sign-In</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1 cursor-pointer truncate"
                >
                  <Sliders className="w-3.5 h-3.5 shrink-0" />
                  <span>Admin Sign-In</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Individual Work Scope & Security Isolation */}
          <div className="md:col-span-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentConfig.gradient} text-white flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {currentConfig.name}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {currentConfig.subtitle}
                  </span>
                </div>
              </div>

              {/* Permitted Duties */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-2">
                  Designated Sector Responsibilities:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {currentConfig.permittedDuties.map((duty, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug text-[11px]">{duty}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security Boundary Isolation */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1.5">
                  Sector Access Isolation:
                </span>
                <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {currentConfig.restrictedDuties.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-rose-500 font-bold">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Strict Role-Based Access Control (RBAC) enforced per sector.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

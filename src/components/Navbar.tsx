import React, { useState } from 'react';
import {
  Wifi,
  Activity,
  AlertTriangle,
  UserCheck,
  Shield,
  BarChart3,
  Moon,
  Sun,
  Flame,
  HelpCircle,
  Gauge,
  ClipboardList,
  MapPin,
  ChevronDown,
  GraduationCap,
  Sliders,
  Radio,
  ArrowRightLeft,
  Sparkles,
  Lock
} from 'lucide-react';
import { User, UserRole } from '../lib/types';
import { TrafficSignalLight, TrafficSignalColor } from './TrafficSignalIndicator';

interface NavbarProps {
  currentUser: User;
  onSelectRole: (role: UserRole) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeOutagesCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenDocs: () => void;
  onOpenDemoControls: () => void;
  onOpenLoginModal: () => void;
  campusTrafficSignal?: TrafficSignalColor;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectRole,
  activeTab,
  onSelectTab,
  activeOutagesCount,
  darkMode,
  onToggleDarkMode,
  onOpenDocs,
  onOpenDemoControls,
  onOpenLoginModal,
  campusTrafficSignal = 'green',
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Sector config
  const sectorMeta = {
    student: {
      label: 'Student / Staff Sector',
      badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
      icon: GraduationCap,
      color: 'text-blue-600 dark:text-blue-400',
    },
    it_staff: {
      label: 'IT NOC & Support Sector',
      badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      icon: Shield,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    manager: {
      label: 'Network Manager Sector',
      badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
      icon: BarChart3,
      color: 'text-purple-600 dark:text-purple-400',
    },
    admin: {
      label: 'Administrator Sector',
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      icon: Sliders,
      color: 'text-amber-600 dark:text-amber-400',
    },
  }[currentUser.role];

  const SectorIcon = sectorMeta.icon;

  // Sector-specific tabs for clean, focused UX
  const getNavItems = () => {
    const common = [{ id: 'landing', label: 'Overview', icon: Wifi }];

    if (currentUser.role === 'student') {
      return [
        ...common,
        { id: 'student_portal', label: 'Student Workspace', icon: GraduationCap },
        { id: 'speedtest', label: 'Speed Test', icon: Gauge },
        { id: 'dashboard', label: 'Campus Heatmap', icon: MapPin },
        { id: 'complaints', label: 'Report Issue', icon: ClipboardList },
        { id: 'history', label: 'My History', icon: Activity },
      ];
    } else if (currentUser.role === 'it_staff') {
      return [
        ...common,
        { id: 'it_support', label: 'IT NOC Console', icon: Shield },
        { id: 'dashboard', label: 'Live Heatmap', icon: MapPin },
        { id: 'complaints', label: 'Tickets Queue', icon: ClipboardList },
        { id: 'traffic', label: 'Traffic & AP Loads', icon: Radio },
      ];
    } else if (currentUser.role === 'manager') {
      return [
        ...common,
        { id: 'manager', label: 'Building Analytics', icon: BarChart3 },
        { id: 'traffic', label: 'Traffic & Reduction', icon: Radio },
        { id: 'dashboard', label: 'Campus Heatmap', icon: MapPin },
        { id: 'complaints', label: 'Complaints Matrix', icon: ClipboardList },
      ];
    } else {
      // admin
      return [
        ...common,
        { id: 'admin', label: 'Formula & Settings', icon: Sliders },
        { id: 'traffic', label: 'Traffic Optimizer', icon: Radio },
        { id: 'dashboard', label: 'Campus Heatmap', icon: MapPin },
        { id: 'it_support', label: 'NOC View', icon: Shield },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Emergency Outage Ticker if Outages Exist */}
      {activeOutagesCount > 0 && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              <strong>Network Alert:</strong> {activeOutagesCount} active Wi-Fi incident detected. IT investigating Library Floor 2.
            </span>
            <button
              onClick={() => onSelectTab('it_support')}
              className="ml-auto underline font-bold hover:text-white/80 transition-colors cursor-pointer"
            >
              View IT NOC &rarr;
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Sector Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('landing')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    CampusPulse
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-none">
                  Smart Wi-Fi Monitoring
                </p>
              </div>
            </button>

            {/* Prominent Active Sector Indicator Badge */}
            <div className="hidden sm:flex items-center ml-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sectorMeta.badge}`}>
                <SectorIcon className="w-3.5 h-3.5" />
                <span>{sectorMeta.label}</span>
              </span>
            </div>
          </div>

          {/* Navigation Links (Sector-Tailored) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  {item.label}
                  {item.id === 'it_support' && activeOutagesCount > 0 && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Campus Traffic Signal Indicator in Header */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" title="Campus Traffic Signal Status">
              <TrafficSignalLight signal={campusTrafficSignal} size="sm" orientation="horizontal" animated />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {campusTrafficSignal === 'green' ? 'Optimal Flow' : campusTrafficSignal === 'amber' ? 'Moderate Load' : 'High Traffic'}
              </span>
            </div>

            {/* Dedicated Sector Login Button */}
            <button
              onClick={onOpenLoginModal}
              className="py-1.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Individual Sector Login (Student, IT NOC, Manager, Administrator)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sector Login</span>
            </button>

            {/* Pitch Demo Mode Trigger Button */}
            <button
              onClick={onOpenDemoControls}
              title="Pitch Demo Simulator: Simulate Outage Live"
              className="py-1.5 px-2.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
              <span className="hidden sm:inline">Demo Mode</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Documentation Modal */}
            <button
              onClick={onOpenDocs}
              title="Architecture & Docs"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 gap-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileCode2,
  CalendarCheck2,
  Trophy,
  Swords,
  Megaphone,
  User,
  ShieldAlert,
  PlusCircle,
  FileSpreadsheet,
  X,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isMentor, isAdmin } = useAuth();

  const mainNavItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Problem Sheets', to: '/sheets', icon: FileCode2 },
    { label: 'Assignments', to: '/assignments', icon: CalendarCheck2 },
    { label: 'Leaderboards', to: '/leaderboards', icon: Trophy },
    { label: 'Practice Rooms', to: '/practice-rooms', icon: Swords },
    { label: 'Announcements', to: '/announcements', icon: Megaphone },
    { label: 'My Profile', to: '/profile', icon: User },
  ];

  const mentorNavItems = [
    { label: 'Create Sheet', to: '/mentor/sheets/new', icon: PlusCircle },
    { label: 'Create Assignment', to: '/mentor/assignments/new', icon: FileSpreadsheet },
    { label: 'Create Room', to: '/mentor/rooms/new', icon: Swords },
  ];

  const adminNavItems = [
    { label: 'Admin Panel', to: '/admin', icon: ShieldAlert },
  ];

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-primary text-white shadow-glow-primary'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-dark-950/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-800/80 bg-dark-950/95 backdrop-blur-xl flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:z-0`}
      >
        {/* Top close button for mobile */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800/80 md:hidden">
          <span className="font-bold text-white tracking-wide">Menu</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Platform
            </p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => onClose && onClose()}
                    className={navLinkClass}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Mentor Area */}
          {isMentor && (
            <div>
              <p className="px-3 text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider mb-2">
                Mentor Tools
              </p>
              <nav className="space-y-1">
                {mentorNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose && onClose()}
                      className={navLinkClass}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 text-amber-400" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Admin Area */}
          {isAdmin && (
            <div>
              <p className="px-3 text-[11px] font-semibold text-rose-400/80 uppercase tracking-wider mb-2">
                Administration
              </p>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose && onClose()}
                      className={navLinkClass}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 text-rose-400" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-dark-900/40">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Codeforces API: Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}

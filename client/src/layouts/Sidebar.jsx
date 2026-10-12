import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileCode2,
  CalendarCheck2,
  Trophy,
  Calendar,
  Swords,
  Megaphone,
  User,
  ShieldAlert,
  PlusCircle,
  FileSpreadsheet,
  X,
  Code2,
  Zap,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isMentor, isAdmin } = useAuth();

  const mainNavItems = [
    { label: 'Dashboard',      to: '/dashboard',      icon: LayoutDashboard },
    { label: 'Problem Sheets', to: '/sheets',          icon: FileCode2 },
    { label: 'Assignments',    to: '/assignments',     icon: CalendarCheck2 },
    { label: 'Leaderboard',    to: '/leaderboards',    icon: Trophy },
    { label: 'Daily Solves',   to: '/calendar',        icon: Calendar },
    { label: 'Practice Rooms', to: '/practice-rooms',  icon: Swords },
    { label: 'Announcements',  to: '/announcements',   icon: Megaphone },
    { label: 'Profile',        to: '/profile',         icon: User },
  ];

  const mentorNavItems = [
    { label: 'Create Sheet',      to: '/mentor/sheets/new',      icon: PlusCircle },
    { label: 'Create Assignment', to: '/mentor/assignments/new', icon: FileSpreadsheet },
    { label: 'Create Room',       to: '/mentor/rooms/new',       icon: Swords },
  ];

  const adminNavItems = [
    { label: 'Admin Panel', to: '/admin', icon: ShieldAlert },
  ];

  const navLinkClass = ({ isActive }) =>
    `nav-item ${isActive ? 'active' : ''}`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 border-r border-[#1e293b] bg-[#07090e] flex flex-col transition-transform duration-200 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:z-0`}
        aria-label="Navigation"
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-[#1e293b]">
          <Link to="/dashboard" className="flex items-center gap-2.5 group" onClick={() => onClose?.()}>
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-100 tracking-tight">
              CP Club
            </span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden btn-icon"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Main Nav */}
          <nav>
            <p className="px-2 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              Platform
            </p>
            <div className="space-y-0.5">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => onClose?.()}
                    className={navLinkClass}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Mentor Tools */}
          {isMentor && (
            <nav>
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-amber-600/80 uppercase tracking-widest">
                Mentor
              </p>
              <div className="space-y-0.5">
                {mentorNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose?.()}
                      className={navLinkClass}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 text-amber-500/70" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </nav>
          )}

          {/* Admin */}
          {isAdmin && (
            <nav>
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-rose-600/80 uppercase tracking-widest">
                Admin
              </p>
              <div className="space-y-0.5">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose?.()}
                      className={navLinkClass}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 text-rose-500/70" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </nav>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1e293b]">
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
            <span className="status-dot active text-[11px]">
              EOD Sync
            </span>
            <span>· Daily @ midnight</span>
          </div>
        </div>
      </aside>
    </>
  );
}

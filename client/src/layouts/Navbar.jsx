import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RatingBadge from '../components/RatingBadge';
import {
  RefreshCw,
  LogOut,
  Bell,
  Menu,
  ChevronDown,
  User,
  Settings,
} from 'lucide-react';

// Page title map
const pageTitles = {
  '/dashboard':     'Dashboard',
  '/sheets':        'Problem Sheets',
  '/assignments':   'Assignments',
  '/leaderboards':  'Leaderboard',
  '/calendar':      'Daily Solves',
  '/practice-rooms':'Practice Rooms',
  '/announcements': 'Announcements',
  '/profile':       'Profile',
  '/admin':         'Admin Panel',
  '/mentor/sheets/new':       'Create Sheet',
  '/mentor/assignments/new':  'Create Assignment',
  '/mentor/rooms/new':        'Create Room',
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout, syncCodeforces, isSyncingCF } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  // Resolve current page title
  const pageTitle = pageTitles[location.pathname] ||
    (location.pathname.startsWith('/sheets/') ? 'Sheet Detail' :
     location.pathname.startsWith('/practice-rooms/') ? 'Room Detail' :
     location.pathname.startsWith('/mentor/sheets/edit/') ? 'Edit Sheet' :
     location.pathname.startsWith('/mentor/assignments/') ? 'Assignment Progress' :
     'CP Club');

  const handleSync = async () => {
    const res = await syncCodeforces();
    if (res.success) {
      toast.success(`Synced! CF Rating: ${res.user?.codeforcesProfile?.rating ?? 'Unrated'}`);
    } else {
      toast.error(`Sync failed: ${res.error}`);
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1e293b] bg-[#07090e]/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-5">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="md:hidden btn-icon flex-shrink-0"
            aria-label="Toggle navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-200 truncate hidden sm:block">
            {pageTitle}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              {/* CF Handle + Sync */}
              {user.codeforcesHandle ? (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1e293b] bg-[#0f1623]">
                  <a
                    href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-slate-400 hover:text-slate-200 transition"
                  >
                    @{user.codeforcesHandle}
                  </a>
                  <RatingBadge rating={user.codeforcesProfile?.rating || 0} size="xs" showRank={false} />
                  <button
                    onClick={handleSync}
                    disabled={isSyncingCF}
                    title="Sync Codeforces submissions"
                    className="btn-icon w-6 h-6"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingCF ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/profile"
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 transition"
                >
                  Link Codeforces →
                </Link>
              )}

              {/* Announcements Bell */}
              <Link
                to="/announcements"
                className="btn-icon relative"
                title="Announcements"
                aria-label="Announcements"
              >
                <Bell className="w-4 h-4" />
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex items-center gap-2 pl-2 py-1 pr-1 rounded-lg hover:bg-[#111827] transition border border-transparent hover:border-[#1e293b]"
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 top-full mt-1.5 w-44 z-20 bg-[#0f1623] border border-[#1e293b] rounded-xl shadow-xl overflow-hidden">
                      <div className="px-3 py-2.5 border-b border-[#1e293b]">
                        <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] transition"
                        >
                          <User className="w-3.5 h-3.5" />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-xs">Log In</Link>
              <Link to="/register" className="btn-primary text-xs">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

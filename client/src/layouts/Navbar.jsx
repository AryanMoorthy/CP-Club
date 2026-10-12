import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RatingBadge from '../components/RatingBadge';
import RoleBadge from '../components/RoleBadge';
import {
  Code2,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Bell,
  Menu,
} from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const { user, logout, syncCodeforces, isSyncingCF } = useAuth();
  const navigate = useNavigate();

  const handleSync = async () => {
    const res = await syncCodeforces();
    if (res.success) {
      alert(`Synced! CF Rating: ${res.profile?.rating || 'Unrated'}, Solved: ${res.syncedCount} new submissions.`);
    } else {
      alert(`Sync failed: ${res.error}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-dark-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center shadow-glow-primary transition-transform group-hover:scale-105">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                CP CLUB
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
          </Link>
        </div>

        {/* Right: User Status, CF Sync, Profile & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              {/* Codeforces rating badge & Sync button */}
              {user.codeforcesHandle ? (
                <div className="hidden sm:flex items-center gap-2 bg-dark-900/80 border border-slate-800 px-2.5 py-1 rounded-xl">
                  <a
                    href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs font-semibold text-slate-300 hover:text-brand-accent transition"
                    title="View Codeforces Profile"
                  >
                    @{user.codeforcesHandle}
                  </a>
                  <RatingBadge rating={user.codeforcesProfile?.rating || 0} size="xs" showRank={false} />
                  <button
                    onClick={handleSync}
                    disabled={isSyncingCF}
                    title="Sync Codeforces submissions"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin text-brand-primary' : ''}`} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/profile"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
                >
                  Link Codeforces
                </Link>
              )}

              {/* Role badge */}
              <div className="hidden lg:block">
                <RoleBadge role={user.role} />
              </div>

              {/* Announcements notification link */}
              <Link
                to="/announcements"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition relative"
                title="Announcements"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              </Link>

              {/* User Dropdown / Profile pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-white leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono capitalize">{user.role}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-xs">
                Log In
              </Link>
              <Link to="/register" className="btn-primary text-xs">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

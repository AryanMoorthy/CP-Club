import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import RatingBadge from '../../components/RatingBadge';
import RoleBadge from '../../components/RoleBadge';
import Skeleton from '../../components/Skeleton';
import PageHeader from '../../components/PageHeader';
import {
  User,
  Terminal,
  RefreshCw,
  ExternalLink,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Edit2,
  Save,
  X,
  Tag,
  Hash,
} from 'lucide-react';

export default function Profile() {
  const { user, syncCodeforces, isSyncingCF, updateProfile } = useAuth();
  const toast = useToast();
  const [handle, setHandle] = useState(user?.codeforcesHandle || '');
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentSolved, setRecentSolved] = useState([]);
  const [loadingSolved, setLoadingSolved] = useState(true);

  useEffect(() => {
    if (user) {
      setHandle(user.codeforcesHandle || '');
      setName(user.name || '');
    }
  }, [user]);

  const fetchRecentSolved = async () => {
    try {
      setLoadingSolved(true);
      const res = await api.get('/users/solved-problems?limit=50');
      if (res.success && res.data) {
        setRecentSolved(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch solved problems:', err);
    } finally {
      setLoadingSolved(false);
    }
  };

  useEffect(() => {
    fetchRecentSolved();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({ name, codeforcesHandle: handle });
    setSaving(false);
    if (res.success) {
      setIsEditing(false);
      toast.success('Profile details updated successfully!');
    } else {
      toast.error(`Update failed: ${res.error}`);
    }
  };

  const handleManualSync = async () => {
    const res = await syncCodeforces();
    if (res.success) {
      fetchRecentSolved();
      toast.success(`Synced with Codeforces: ${res.totalSolved ?? 'records'} verified solves`);
    } else {
      toast.error(`Sync error: ${res.error}`);
    }
  };

  const cf = user?.codeforcesProfile || {};

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <PageHeader
        title="Member Profile"
        subtitle="Manage your identity, linked Codeforces handle, and verified competitive programming statistics."
        icon={User}
        iconColor="text-indigo-400"
      />

      {/* Profile Header Card */}
      <div className="glass-card p-5 sm:p-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl font-bold text-indigo-300">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">{user?.name}</h2>
                <RoleBadge role={user?.role} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile editing form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-5 pt-5 border-t border-[#1e293b] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field py-1.5 text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Codeforces Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="tourist"
                className="input-field py-1.5 text-xs w-full font-mono"
              />
            </div>
          </form>
        )}
      </div>

      {/* Codeforces Live Stats Card */}
      <div className="glass-card p-5 sm:p-6 space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Codeforces Integration</span>
                {user?.codeforcesHandle && (
                  <a
                    href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                  >
                    @{user.codeforcesHandle}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                Official API metrics verified from Codeforces servers.
              </p>
            </div>
          </div>

          {user?.codeforcesHandle && (
            <button
              onClick={handleManualSync}
              disabled={isSyncingCF}
              className="btn-primary py-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
              <span>{isSyncingCF ? 'Syncing...' : 'Sync Submissions'}</span>
            </button>
          )}
        </div>

        {user?.codeforcesHandle ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 w-full">
            <div className="stat-card">
              <div>
                <p className="stat-card-label">Current Rating</p>
                <div className="mt-2">
                  <RatingBadge rating={cf.rating || 0} size="sm" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <p className="stat-card-label">Peak Rating</p>
                <p className="stat-card-value text-amber-400 mt-1">
                  {cf.maxRating || '—'}
                </p>
                <p className="stat-card-sub font-mono">{cf.maxRank || 'Unrated'}</p>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <p className="stat-card-label">Total Solved</p>
                <p className="stat-card-value text-emerald-400 mt-1">
                  {cf.totalSolvedCount || 0}
                </p>
                <p className="stat-card-sub font-mono">Verified ACs</p>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <p className="stat-card-label">Current Rank</p>
                <p className="stat-card-value text-slate-200 mt-1 capitalize text-sm">
                  {cf.rank || 'Unrated'}
                </p>
                <p className="stat-card-sub font-mono">Tier Division</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-lg bg-slate-900/40 border border-dashed border-slate-800 text-center w-full">
            <p className="text-xs text-slate-400">
              No Codeforces handle attached yet. Link your handle to activate tracking and leaderboards.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary text-xs mt-3"
            >
              Link Handle
            </button>
          </div>
        )}
      </div>

      {/* Verified Submissions History Table with full width styling */}
      <div className="glass-card overflow-hidden w-full border border-[#1e293b]">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Recently Solved & Verified Problems
          </h3>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            {recentSolved.length} verified solves
          </span>
        </div>

        {loadingSolved ? (
          <Skeleton.Table rows={6} />
        ) : recentSolved.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th className="min-w-[280px]">Problem</th>
                  <th className="min-w-[120px]">Codeforces ID</th>
                  <th className="min-w-[120px]">Rating</th>
                  <th className="min-w-[160px]">Solved Date</th>
                  <th className="min-w-[100px] text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSolved.map((item, idx) => {
                  const cfLink = `https://codeforces.com/problemset/problem/${item.contestId}/${item.problemIndex}`;
                  return (
                    <tr key={idx}>
                      <td>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <a
                            href={cfLink}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-slate-200 hover:text-indigo-400 transition"
                          >
                            {item.problemName || item.name || `Problem ${item.problemIndex}`}
                          </a>
                        </div>
                      </td>

                      <td className="font-mono text-xs font-semibold text-indigo-400">
                        {item.contestId}{item.problemIndex}
                      </td>

                      <td>
                        {item.rating ? (
                          <RatingBadge rating={item.rating} size="xs" showRank={false} />
                        ) : (
                          <span className="text-xs font-mono text-slate-600">—</span>
                        )}
                      </td>

                      <td className="font-mono text-xs text-slate-400">
                        {(() => {
                          const dateVal = item.firstAcceptedAt || item.syncedAt || item.solvedAt;
                          if (!dateVal) return 'Verified';
                          const d = new Date(dateVal);
                          return isNaN(d.getTime()) ? 'Verified' : d.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          });
                        })()}
                      </td>

                      <td className="text-right">
                        <a
                          href={cfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1 font-mono"
                        >
                          CF <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-8 text-center">
            No problems tracked yet. Sync your Codeforces account or solve sheet problems to record submissions.
          </p>
        )}
      </div>
    </div>
  );
}

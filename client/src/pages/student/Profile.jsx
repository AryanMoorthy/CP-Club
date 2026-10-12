import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import RatingBadge from '../../components/RatingBadge';
import RoleBadge from '../../components/RoleBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  User,
  Terminal,
  RefreshCw,
  ExternalLink,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Lock,
  Edit2,
  Save,
} from 'lucide-react';

export default function Profile() {
  const { user, syncCodeforces, isSyncingCF, updateProfile } = useAuth();
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
      const res = await api.get('/users/solved-problems');
      if (res.success && res.data) {
        setRecentSolved(res.data.slice(0, 10));
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
      alert('Profile updated successfully!');
    } else {
      alert(`Update failed: ${res.error}`);
    }
  };

  const handleManualSync = async () => {
    const res = await syncCodeforces();
    if (res.success) {
      fetchRecentSolved();
      alert(`Synced successfully! ${res.syncedCount} new solved problems recorded.`);
    } else {
      alert(`Sync error: ${res.error}`);
    }
  };

  const cf = user?.codeforcesProfile || {};

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-2xl font-black text-white shadow-glow-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{user?.name}</h1>
                <RoleBadge role={user?.role} />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile editing form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full glass-input rounded-xl py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Codeforces Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. tourist"
                className="w-full glass-input rounded-xl py-2 px-3 text-sm font-mono"
              />
            </div>
          </form>
        )}
      </div>

      {/* Codeforces Live Stats Card */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-dark-900 border border-slate-700 flex items-center justify-center text-brand-primary">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Codeforces Integration</span>
                {user?.codeforcesHandle && (
                  <a
                    href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-brand-accent hover:underline flex items-center gap-1"
                  >
                    @{user.codeforcesHandle}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Official API metrics synced with Codeforces server.
              </p>
            </div>
          </div>

          {user?.codeforcesHandle && (
            <button
              onClick={handleManualSync}
              disabled={isSyncingCF}
              className="btn-primary flex items-center gap-2 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
              <span>{isSyncingCF ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>

        {user?.codeforcesHandle ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Rating</p>
              <div className="mt-2">
                <RatingBadge rating={cf.rating || 0} size="md" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Peak Rating</p>
              <p className="text-xl font-bold font-mono text-amber-400 mt-2">
                {cf.maxRating || '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{cf.maxRank || 'Unrated'}</p>
            </div>

            <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Solved</p>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-2">
                {cf.totalSolvedCount || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified ACs</p>
            </div>

            <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Rank</p>
              <p className="text-base font-bold font-mono text-slate-200 mt-2 capitalize">
                {cf.rank || 'Unrated'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Division tier</p>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-dark-900/60 border border-dashed border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              No Codeforces handle attached to this account yet.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary text-xs mt-3 inline-flex items-center gap-1"
            >
              Link Handle Now
            </button>
          </div>
        )}
      </div>

      {/* Verified Submissions History Table */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Recently Solved & Verified Problems
        </h3>

        {loadingSolved ? (
          <LoadingSpinner text="Fetching verified problems..." />
        ) : recentSolved.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Problem</th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Solved At</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {recentSolved.map((item, idx) => {
                  const cfLink = `https://codeforces.com/problemset/problem/${item.contestId}/${item.problemIndex}`;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                        {item.name || `Problem ${item.problemIndex}`}
                      </td>
                      <td className="py-3 px-4 text-brand-accent">
                        {item.contestId}{item.problemIndex}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(item.solvedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={cfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-primary hover:text-brand-accent inline-flex items-center gap-1 font-sans text-xs"
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
          <p className="text-xs text-slate-500 py-4 text-center">
            No problems tracked yet. Sync your Codeforces account or solve sheet problems to record submissions.
          </p>
        )}
      </div>
    </div>
  );
}

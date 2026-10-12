import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import RatingBadge from '../../components/RatingBadge';
import CountdownTimer from '../../components/CountdownTimer';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Trophy,
  CheckCircle2,
  CalendarCheck2,
  Flame,
  ArrowRight,
  TrendingUp,
  FileCode2,
  Megaphone,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function Dashboard() {
  const { user, syncCodeforces, isSyncingCF } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    recentAnnouncements: [],
    activeAssignments: [],
    popularSheets: [],
    stats: {
      totalSolved: 0,
      currentRating: 0,
      maxRating: 0,
      ratingHistory: [],
    },
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [annRes, assignRes, sheetsRes, userStatsRes] = await Promise.allSettled([
        api.get('/announcements?limit=3'),
        api.get('/assignments'),
        api.get('/problem-sheets?limit=4'),
        api.get('/users/stats'),
      ]);

      const annData = annRes.status === 'fulfilled' && annRes.value.success ? (annRes.value.data?.announcements || annRes.value.data || []) : [];
      const assignData = assignRes.status === 'fulfilled' && assignRes.value.success ? (assignRes.value.data?.assignments || assignRes.value.data || []) : [];
      const sheetsData = sheetsRes.status === 'fulfilled' && sheetsRes.value.success ? (sheetsRes.value.data?.sheets || sheetsRes.value.data || []) : [];
      const statsData = userStatsRes.status === 'fulfilled' && userStatsRes.value.success ? (userStatsRes.value.data?.stats || userStatsRes.value.data) : null;

      setData({
        recentAnnouncements: Array.isArray(annData) ? annData.slice(0, 3) : [],
        activeAssignments: Array.isArray(assignData) ? assignData.slice(0, 3) : [],
        popularSheets: Array.isArray(sheetsData) ? sheetsData.slice(0, 4) : [],
        stats: statsData || {
          totalSolved: user?.codeforcesProfile?.totalSolvedCount || 0,
          currentRating: user?.codeforcesProfile?.rating || 0,
          maxRating: user?.codeforcesProfile?.maxRating || 0,
          ratingHistory: user?.codeforcesProfile?.ratingHistory || [],
        },
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  // Format CF rating history for chart
  const ratingChartData = (data.stats.ratingHistory || []).map((h) => ({
    contest: h.contestName?.slice(0, 15) || 'Contest',
    rating: h.newRating,
    date: new Date(h.ratingUpdateTimeSeconds * 1000).toLocaleDateString(undefined, {
      month: 'short',
      year: '2-digit',
    }),
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            {user?.codeforcesHandle && (
              <RatingBadge rating={user?.codeforcesProfile?.rating || 0} size="sm" />
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {user?.codeforcesHandle
              ? `Codeforces @${user.codeforcesHandle} is linked and tracking.`
              : 'Link your Codeforces handle in your profile to start tracking your rating.'}
          </p>
        </div>

        {user?.codeforcesHandle ? (
          <button
            onClick={syncCodeforces}
            disabled={isSyncingCF}
            className="btn-primary self-start sm:self-auto flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
            <span>{isSyncingCF ? 'Syncing...' : 'Sync Codeforces'}</span>
          </button>
        ) : (
          <Link to="/profile" className="btn-primary text-xs self-start sm:self-auto">
            Connect Codeforces
          </Link>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CF Current Rating */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CF Rating</p>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">
              {data.stats.currentRating > 0 ? data.stats.currentRating : 'Unrated'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rank: {user?.codeforcesProfile?.rank || 'Unrated'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Max Rating */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peak Rating</p>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">
              {data.stats.maxRating > 0 ? data.stats.maxRating : '—'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Peak: {user?.codeforcesProfile?.maxRank || '—'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Solved Problems */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Problems Solved</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              {data.stats.totalSolved || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Verified on platform</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Active Assignments */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Tasks</p>
            <h3 className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
              {data.activeAssignments.length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Club assignments</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Rating Chart & Active Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Rating Progression Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              <h3 className="text-base font-semibold text-white">Codeforces Rating History</h3>
            </div>
            {user?.codeforcesHandle && (
              <a
                href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-accent hover:underline flex items-center gap-1 font-mono"
              >
                Profile <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {ratingChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#38bdf8', strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 6, fill: '#818cf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm text-slate-400">
                {user?.codeforcesHandle
                  ? 'No rated contest participation recorded yet for this handle.'
                  : 'Link your Codeforces handle in your profile to display your rating history graph.'}
              </p>
              {!user?.codeforcesHandle && (
                <Link to="/profile" className="btn-secondary text-xs mt-3">
                  Connect Handle
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Active Assignments */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-cyan-400" />
              Active Assignments
            </h3>
            <Link to="/assignments" className="text-xs text-brand-accent hover:underline">
              View All
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {data.activeAssignments.length > 0 ? (
              data.activeAssignments.map((a) => (
                <div
                  key={a._id}
                  className="p-3.5 rounded-xl bg-dark-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{a.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{a.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <CountdownTimer targetDate={a.deadline} />
                    <Link
                      to={`/assignments`}
                      className="text-xs text-brand-primary font-medium hover:underline flex items-center gap-1"
                    >
                      Solve <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mb-2" />
                No pending assignments at the moment!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Popular Sheets & Recent Club Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Problem Sheets */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-indigo-400" />
              Problem Sheets
            </h3>
            <Link to="/sheets" className="text-xs text-brand-accent hover:underline">
              Browse All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.popularSheets.map((sheet) => (
              <Link
                key={sheet._id}
                to={`/sheets/${sheet._id}`}
                className="p-4 rounded-xl bg-dark-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-850/60 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {sheet.difficulty || 'All levels'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {sheet.problems?.length || 0} problems
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mt-2 group-hover:text-white line-clamp-1">
                  {sheet.title}
                </h4>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(sheet.tags || []).slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] text-slate-400 bg-dark-850 px-1.5 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Club Announcements */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              Club Announcements
            </h3>
            <Link to="/announcements" className="text-xs text-brand-accent hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentAnnouncements.map((ann) => (
              <div
                key={ann._id}
                className="p-3.5 rounded-xl bg-dark-900/60 border border-slate-800/80"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">{ann.title}</h4>
                  <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ann.content}</p>
              </div>
            ))}
            {data.recentAnnouncements.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">
                No new announcements.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

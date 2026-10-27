import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import RatingBadge from '../../components/RatingBadge';
import CountdownTimer from '../../components/CountdownTimer';
import Skeleton from '../../components/Skeleton';
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
  Layers,
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
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    recentAnnouncements: [],
    activeAssignments: [],
    popularSheets: [],
    stats: { totalSolved: 0, currentRating: 0, maxRating: 0, ratingHistory: [] },
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [annRes, assignRes, sheetsRes, statsRes] = await Promise.allSettled([
        api.get('/announcements?limit=3'),
        api.get('/assignments'),
        api.get('/problem-sheets?limit=4'),
        api.get('/users/me/codeforces/stats'),
      ]);

      const ann    = annRes.status    === 'fulfilled' && annRes.value.success    ? (annRes.value.data?.announcements    || annRes.value.data    || []) : [];
      const assign = assignRes.status === 'fulfilled' && assignRes.value.success ? (assignRes.value.data?.assignments   || assignRes.value.data || []) : [];
      const sheets = sheetsRes.status === 'fulfilled' && sheetsRes.value.success ? (sheetsRes.value.data?.sheets        || sheetsRes.value.data || []) : [];
      const cfStats = statsRes.status === 'fulfilled' && statsRes.value.success  ? statsRes.value.data : null;

      const profile = cfStats?.profile || user?.codeforcesProfile || {};
      const ratingHistory = cfStats?.ratingHistory || profile?.ratingHistory || [];

      setData({
        recentAnnouncements: Array.isArray(ann)    ? ann.slice(0, 3)    : [],
        activeAssignments:   Array.isArray(assign) ? assign.slice(0, 4) : [],
        popularSheets:       Array.isArray(sheets) ? sheets.slice(0, 4) : [],
        stats: {
          totalSolved:   cfStats?.totalSolved   ?? profile?.totalSolvedCount ?? 0,
          currentRating: profile?.rating        ?? 0,
          maxRating:     profile?.maxRating     ?? 0,
          ratingHistory: Array.isArray(ratingHistory) ? ratingHistory : [],
        },
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [user]);

  const handleSync = async () => {
    const res = await syncCodeforces();
    if (res.success) {
      toast.success('Codeforces synced successfully!');
      fetchDashboardData();
    } else {
      toast.error(`Sync failed: ${res.error}`);
    }
  };

  const ratingChartData = (data.stats.ratingHistory || []).map((h) => {
    const ratingVal = h.newRating ?? h.rating ?? 0;
    const timeSec = h.ratingUpdateTimeSeconds || (h.date ? new Date(h.date).getTime() / 1000 : null);
    const dateStr = timeSec
      ? new Date(timeSec * 1000).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
      : 'Contest';
    return {
      contest: h.contestName || `Contest #${h.contestId || ''}`,
      rating: ratingVal,
      date: dateStr,
    };
  }).filter((d) => d.rating > 0);

  // Stat card config
  const statCards = [
    {
      label: 'CF Rating',
      value: data.stats.currentRating > 0 ? data.stats.currentRating : 'Unrated',
      sub:   user?.codeforcesProfile?.rank || 'Unrated',
      icon:  Trophy,
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-400',
    },
    {
      label: 'Peak Rating',
      value: data.stats.maxRating > 0 ? data.stats.maxRating : '—',
      sub:   user?.codeforcesProfile?.maxRank || '—',
      icon:  Flame,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
    },
    {
      label: 'Verified Solved',
      value: data.stats.totalSolved || 0,
      sub:   'All time on platform',
      icon:  CheckCircle2,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-400',
    },
    {
      label: 'Active Tasks',
      value: data.activeAssignments.length,
      sub:   'Open assignments',
      icon:  CalendarCheck2,
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Welcome skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton.Text lines={2} className="w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton.Card key={i} />)}
        </div>
        {/* Chart + Assignments skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton.List rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.codeforcesHandle
              ? `Tracking @${user.codeforcesHandle} · Synced daily at midnight`
              : 'Link your Codeforces handle in Profile to start tracking.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {user?.codeforcesHandle ? (
            <button onClick={handleSync} disabled={isSyncingCF} className="btn-secondary text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
              {isSyncingCF ? 'Syncing…' : 'Sync CF'}
            </button>
          ) : (
            <Link to="/profile" className="btn-primary text-xs">Connect Codeforces</Link>
          )}
          <Link to="/sheets" className="btn-secondary text-xs">
            <FileCode2 className="w-3.5 h-3.5" />
            Browse Sheets
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div>
                <p className="stat-card-label">{s.label}</p>
                <p className={`stat-card-value ${s.valueColor || 'text-slate-100'}`}>
                  {s.value}
                </p>
                <p className="stat-card-sub">{s.sub}</p>
              </div>
              <div className={`stat-card-icon ${s.iconBg}`}>
                <Icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Chart + Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Rating Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="section-header">
            <h3 className="section-title">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Rating History
            </h3>
            {user?.codeforcesHandle && (
              <a
                href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
              >
                View on CF <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {ratingChartData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingChartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#334155"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={ratingChartData.length > 20 ? Math.floor(ratingChartData.length / 8) : 0}
                  />
                  <YAxis
                    stroke="#334155"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={([dataMin, dataMax]) => {
                      const lo = Math.floor((dataMin - 100) / 100) * 100;
                      const hi = Math.ceil((dataMax + 100) / 100) * 100;
                      return [lo, hi];
                    }}
                    tickCount={6}
                    allowDecimals={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', stroke: '#0f172a', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 6, fill: '#818cf8', stroke: '#6366f1', strokeWidth: 2 }}
                    connectNulls
                  />
                  <Tooltip
                    cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{
                      background: '#0f1623',
                      border: '1px solid #1e293b',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                    itemStyle={{ color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}
                    labelFormatter={(label, payload) => {
                      const d = payload?.[0]?.payload;
                      return d?.contest || label;
                    }}
                    formatter={(value) => [value, 'Rating']}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center border border-dashed border-[#1e293b] rounded-xl">
              <TrendingUp className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-sm text-slate-500">
                {user?.codeforcesHandle
                  ? 'No rated contests found for this handle.'
                  : 'Link your Codeforces handle to see your rating chart.'}
              </p>
              {!user?.codeforcesHandle && (
                <Link to="/profile" className="btn-secondary text-xs mt-3">Connect Handle</Link>
              )}
            </div>
          )}
        </div>

        {/* Active Assignments */}
        <div className="glass-card p-5 flex flex-col">
          <div className="section-header">
            <h3 className="section-title">
              <CalendarCheck2 className="w-4 h-4 text-cyan-400" />
              Active Assignments
            </h3>
            <Link to="/assignments" className="text-xs text-slate-500 hover:text-slate-300 transition">
              All →
            </Link>
          </div>

          <div className="flex-1 space-y-2">
            {data.activeAssignments.length > 0 ? (
              data.activeAssignments.map((a) => (
                <div key={a._id} className="surface-inset p-3 rounded-lg">
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{a.title || a.problemSheet?.title || 'Assignment'}</h4>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <CountdownTimer targetDate={a.deadline || a.dueDate} />
                    <Link to="/assignments" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition">
                      View →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-7 h-7 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">No pending assignments</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Sheets + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Problem Sheets */}
        <div className="glass-card p-5">
          <div className="section-header">
            <h3 className="section-title">
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              Problem Sheets
            </h3>
            <Link to="/sheets" className="text-xs text-slate-500 hover:text-slate-300 transition">
              Browse all →
            </Link>
          </div>
          <div className="space-y-2">
            {data.popularSheets.length > 0 ? (
              data.popularSheets.map((sheet) => (
                <Link
                  key={sheet._id}
                  to={`/sheets/${sheet._id}`}
                  className="flex items-center justify-between p-3 rounded-lg surface-inset hover:border-indigo-500/30 hover:bg-indigo-500/5 transition group border border-transparent"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-300 group-hover:text-slate-100 truncate">{sheet.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 capitalize">{sheet.difficulty} · {sheet.problems?.length || 0} problems</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 flex-shrink-0 transition" />
                </Link>
              ))
            ) : (
              <p className="text-xs text-slate-600 py-4 text-center">No sheets available.</p>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="glass-card p-5">
          <div className="section-header">
            <h3 className="section-title">
              <Megaphone className="w-4 h-4 text-amber-400" />
              Announcements
            </h3>
            <Link to="/announcements" className="text-xs text-slate-500 hover:text-slate-300 transition">
              All →
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentAnnouncements.length > 0 ? (
              data.recentAnnouncements.map((ann) => (
                <div key={ann._id} className="surface-inset p-3 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{ann.title}</h4>
                    <span className="text-[10px] text-slate-600 font-mono flex-shrink-0">
                      {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-600 py-4 text-center">No announcements yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

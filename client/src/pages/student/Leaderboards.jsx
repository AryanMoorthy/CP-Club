import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import RatingBadge from '../../components/RatingBadge';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import {
  Trophy,
  Flame,
  TrendingUp,
  Award,
  Crown,
  ExternalLink,
  Search,
  User,
  Medal,
  Users,
} from 'lucide-react';

const TABS = [
  { id: 'rating',      label: 'Rating',        icon: Trophy,     endpoint: '/leaderboard/rating' },
  { id: 'weekly',      label: 'Weekly Solved', icon: Flame,      endpoint: '/leaderboard/weekly' },
  { id: 'improvement', label: 'Improvement',   icon: TrendingUp, endpoint: '/leaderboard/improvement' },
  { id: 'total',       label: 'Total Solved',  icon: Award,      endpoint: '/leaderboard/total' },
];

export default function Leaderboards() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('rating');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLeaderboard = async () => {
    const tabConfig = TABS.find((t) => t.id === activeTab);
    if (!tabConfig) return;

    try {
      setLoading(true);
      const res = await api.get(tabConfig.endpoint);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.leaderboard || []);
        const formatted = list.map((item) => ({
          ...item.user,
          ...item,
          codeforcesHandle: item.user?.codeforcesHandle || item.codeforcesHandle,
          name: item.user?.name || item.name,
          weeklySolved: item.weeklyCount ?? item.weeklySolved ?? 0,
          totalSolved: item.totalCount ?? item.totalSolved ?? item.codeforcesProfile?.totalSolvedCount ?? 0,
          ratingImprovement: item.ratingImprovement ?? item.improvement ?? 0,
          codeforcesProfile: {
            rating: item.rating || item.currentRating || item.user?.codeforcesProfile?.rating || item.codeforcesProfile?.rating || 0,
            maxRating: item.maxRating || item.user?.codeforcesProfile?.maxRating || item.codeforcesProfile?.maxRating || 0,
            rank: item.rank || item.user?.codeforcesProfile?.rank || item.codeforcesProfile?.rank || 'unrated',
          },
        }));
        setLeaderboard(formatted);
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const filtered = leaderboard.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.codeforcesHandle && item.codeforcesHandle.toLowerCase().includes(q))
    );
  });

  const topThree = filtered.slice(0, 3);

  const getMetricValue = (item) => {
    if (activeTab === 'rating') return `${item.codeforcesProfile?.rating || 0}`;
    if (activeTab === 'weekly') return `${item.weeklySolved || 0} solved`;
    if (activeTab === 'improvement') return `+${item.ratingImprovement || 0} pts`;
    if (activeTab === 'total') return `${item.totalSolved || 0} solved`;
    return '—';
  };

  const getMetricHeading = () => {
    if (activeTab === 'rating') return 'Rating';
    if (activeTab === 'weekly') return 'Weekly Solves';
    if (activeTab === 'improvement') return 'Rating Delta';
    if (activeTab === 'total') return 'Total Solves';
    return 'Score';
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <PageHeader
        title="Leaderboard"
        subtitle="Rankings updated daily via Codeforces API verification and platform activity."
        icon={Trophy}
        iconColor="text-amber-400"
      />

      {/* Control bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        <div className="tab-bar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-item flex items-center gap-1.5 ${active ? 'active' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input with sleek search-box style */}
        <div className="search-box md:max-w-xs">
          <Search className="w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search handle or name..."
          />
        </div>
      </div>

      {loading ? (
        <Skeleton.Table rows={8} />
      ) : filtered.length > 0 ? (
        <div className="space-y-6 w-full">
          {/* Top 3 Podium (when no search query or at least 1 match) */}
          {!search && topThree.length >= 1 && (
            <div className="flex flex-wrap justify-center gap-4 pt-4 w-full">
              {/* Rank 2 (Silver) */}
              {topThree[1] && (
                <div className="glass-card p-5 flex flex-col items-center text-center order-2 md:order-1 border-slate-700/70 relative w-full md:w-[calc(33.333%-1rem)] md:max-w-xs">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="badge text-[10px] font-mono bg-slate-400/10 text-slate-300 border-slate-400/30">
                      🥈 #2 Silver
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-bold text-slate-200 text-lg mb-2 shadow-md">
                    {topThree[1].name?.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{topThree[1].name}</h4>
                  <a
                    href={`https://codeforces.com/profile/${topThree[1].codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 mt-0.5 inline-flex items-center gap-1"
                  >
                    @{topThree[1].codeforcesHandle}
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                  <div className="mt-3">
                    <RatingBadge rating={topThree[1].codeforcesProfile?.rating || 0} size="sm" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#1e293b] w-full flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">{getMetricHeading()}</span>
                    <span className="font-bold text-slate-200">{getMetricValue(topThree[1])}</span>
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold) */}
              {topThree[0] && (
                <div className="glass-card pt-8 pb-6 px-6 flex flex-col items-center text-center order-1 md:order-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent relative shadow-lg overflow-visible w-full md:w-[calc(33.333%-1rem)] md:max-w-xs">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0f172a] border border-amber-500/40 flex items-center justify-center shadow-lg">
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="badge badge-amber text-[10px] font-mono">
                      👑 #1 Champion
                    </span>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center font-bold text-2xl text-amber-300 mb-2 shadow-xl">
                    {topThree[0].name?.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-base font-bold text-slate-100 line-clamp-1">{topThree[0].name}</h4>
                  <a
                    href={`https://codeforces.com/profile/${topThree[0].codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-amber-400 hover:text-amber-300 mt-0.5 inline-flex items-center gap-1"
                  >
                    @{topThree[0].codeforcesHandle}
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                  <div className="mt-3">
                    <RatingBadge rating={topThree[0].codeforcesProfile?.rating || 0} size="md" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-amber-500/20 w-full flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-400/80">{getMetricHeading()}</span>
                    <span className="font-black text-amber-300">{getMetricValue(topThree[0])}</span>
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {topThree[2] && (
                <div className="glass-card p-5 flex flex-col items-center text-center order-3 border-amber-900/40 relative w-full md:w-[calc(33.333%-1rem)] md:max-w-xs">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="badge text-[10px] font-mono bg-amber-950/40 text-amber-500 border border-amber-900/40">
                      🥉 #3 Bronze
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-amber-500 text-lg mb-2 shadow-md">
                    {topThree[2].name?.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{topThree[2].name}</h4>
                  <a
                    href={`https://codeforces.com/profile/${topThree[2].codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 mt-0.5 inline-flex items-center gap-1"
                  >
                    @{topThree[2].codeforcesHandle}
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                  <div className="mt-3">
                    <RatingBadge rating={topThree[2].codeforcesProfile?.rating || 0} size="sm" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#1e293b] w-full flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">{getMetricHeading()}</span>
                    <span className="font-bold text-slate-200">{getMetricValue(topThree[2])}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ranking Table with full container width */}
          <div className="glass-card overflow-hidden w-full border border-[#1e293b]">
            <div className="overflow-x-auto w-full">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th className="w-16 text-center">Rank</th>
                    <th className="min-w-[200px]">Member</th>
                    <th className="min-w-[160px]">Codeforces</th>
                    <th className="min-w-[130px]">Rating</th>
                    <th className="min-w-[120px] text-center">Peak</th>
                    <th className="min-w-[130px] text-right">{getMetricHeading()}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const isMe =
                      (currentUser?._id && (item._id === currentUser._id || item.user?._id === currentUser._id)) ||
                      (currentUser?.codeforcesHandle && item.codeforcesHandle?.toLowerCase() === currentUser.codeforcesHandle?.toLowerCase());

                    return (
                      <tr
                        key={item._id || item.codeforcesHandle || idx}
                        className={isMe ? 'bg-indigo-500/10 border-l-4 border-indigo-400' : ''}
                      >
                        <td className="text-center font-mono font-bold">
                          {idx === 0 && <span className="text-amber-400">#1</span>}
                          {idx === 1 && <span className="text-slate-300">#2</span>}
                          {idx === 2 && <span className="text-amber-600">#3</span>}
                          {idx > 2 && <span className="text-slate-500">#{idx + 1}</span>}
                        </td>

                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-xs text-slate-300 shrink-0">
                              {item.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-200 truncate">
                                  {item.name || 'Anonymous'}
                                </span>
                                {isMe && (
                                  <span className="badge badge-indigo text-[10px] py-0 px-1.5">You</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="font-mono text-xs">
                          {item.codeforcesHandle ? (
                            <a
                              href={`https://codeforces.com/profile/${item.codeforcesHandle}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                            >
                              @{item.codeforcesHandle}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td>
                          <RatingBadge rating={item.codeforcesProfile?.rating || 0} size="xs" />
                        </td>

                        <td className="text-center font-mono text-xs text-slate-400">
                          {item.codeforcesProfile?.maxRating || '—'}
                        </td>

                        <td className="text-right font-mono font-bold text-slate-100">
                          {getMetricValue(item)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No ranked members found"
          description={
            search
              ? `No members match "${search}". Try clearing your search.`
              : 'Rankings will appear once members link and verify their Codeforces handles.'
          }
          icon={Trophy}
        />
      )}
    </div>
  );
}

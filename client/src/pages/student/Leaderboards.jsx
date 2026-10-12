import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RatingBadge from '../../components/RatingBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import {
  Trophy,
  Flame,
  TrendingUp,
  Award,
  Crown,
  Medal,
  ExternalLink,
  Search,
} from 'lucide-react';

export default function Leaderboards() {
  const [activeTab, setActiveTab] = useState('rating');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const tabs = [
    { id: 'rating', label: 'CF Rating', icon: Trophy, endpoint: '/leaderboard/rating' },
    { id: 'weekly', label: 'Weekly Solved', icon: Flame, endpoint: '/leaderboard/weekly' },
    { id: 'improvement', label: 'Improvement', icon: TrendingUp, endpoint: '/leaderboard/improvement' },
    { id: 'total', label: 'Total Solved', icon: Award, endpoint: '/leaderboard/total' },
  ];

  const fetchLeaderboard = async () => {
    const currentTab = tabs.find((t) => t.id === activeTab);
    if (!currentTab) return;

    try {
      setLoading(true);
      const res = await api.get(currentTab.endpoint);
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.leaderboard || []);
        // Map ranked items to flat user structure expected by component
        const formatted = list.map((item) => ({
          ...item.user,
          ...item,
          codeforcesHandle: item.user?.codeforcesHandle || item.codeforcesHandle,
          name: item.user?.name || item.name,
          weeklySolved: item.weeklyCount,
          totalSolved: item.totalCount,
          codeforcesProfile: { rating: item.rating || item.currentRating || 0 },
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

  const filteredList = leaderboard.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.codeforcesHandle?.toLowerCase().includes(search.toLowerCase())
  );

  const topThree = filteredList.slice(0, 3);
  const restOfList = filteredList.slice(3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            Competitive Leaderboards
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time rankings powered by Codeforces API data and club activity.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-dark-900 border border-slate-800 self-start md:self-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-glow-primary'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or CF handle..."
          className="w-full glass-input rounded-xl py-2 pl-10 pr-4 text-sm"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Compiling leaderboard ranks..." />
      ) : filteredList.length > 0 ? (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {topThree.length >= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {/* Silver (Rank 2) */}
              {topThree[1] && (
                <div className="glass-card rounded-2xl border border-slate-700 p-5 flex flex-col items-center text-center relative order-2 sm:order-1">
                  <div className="w-8 h-8 rounded-full bg-slate-400/20 text-slate-300 flex items-center justify-center font-bold text-xs mb-3 border border-slate-400/40">
                    #2
                  </div>
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-bold text-lg text-slate-300 mb-3 shadow-lg">
                    {topThree[1].name?.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-base font-bold text-white line-clamp-1">{topThree[1].name}</h4>
                  <a
                    href={`https://codeforces.com/profile/${topThree[1].codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-brand-accent hover:underline mt-1"
                  >
                    @{topThree[1].codeforcesHandle}
                  </a>
                  <div className="mt-4">
                    <RatingBadge rating={topThree[1].codeforcesProfile?.rating || 0} size="sm" />
                  </div>
                </div>
              )}

              {/* Gold (Rank 1) */}
              {topThree[0] && (
                <div className="glass-card rounded-2xl border border-amber-500/40 p-6 flex flex-col items-center text-center relative order-1 sm:order-2 bg-gradient-to-b from-amber-500/10 to-transparent shadow-glow-primary">
                  <Crown className="w-7 h-7 text-amber-400 absolute -top-3.5" />
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs mb-3 border border-amber-500/40">
                    #1
                  </div>
                  <div className="w-20 h-20 rounded-full bg-dark-900 border-2 border-amber-400 flex items-center justify-center font-bold text-2xl text-amber-300 mb-3 shadow-2xl">
                    {topThree[0].name?.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-lg font-extrabold text-white line-clamp-1">{topThree[0].name}</h4>
                  <a
                    href={`https://codeforces.com/profile/${topThree[0].codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-amber-400 hover:underline mt-1"
                  >
                    @{topThree[0].codeforcesHandle}
                  </a>
                  <div className="mt-4">
                    <RatingBadge rating={topThree[0].codeforcesProfile?.rating || 0} size="md" />
                  </div>
                </div>
              )}

              {/* Bronze (Rank 3) */}
              {topThree[2] && (
                <div className="glass-card rounded-2xl border border-amber-800/40 p-5 flex flex-col items-center text-center relative order-3">
                  <div className="w-8 h-8 rounded-full bg-amber-800/20 text-amber-600 flex items-center justify-center font-bold text-xs mb-3 border border-amber-800/40">
                    #3
                  </div>
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-lg text-amber-600 mb-3 shadow-lg">
                    {topThree[2].name?.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-base font-bold text-white line-clamp-1">{topThree[2].name}</h4>
                  <a
                    href={`https://codeforces.com/profile/${topThree[2].codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-brand-accent hover:underline mt-1"
                  >
                    @{topThree[2].codeforcesHandle}
                  </a>
                  <div className="mt-4">
                    <RatingBadge rating={topThree[2].codeforcesProfile?.rating || 0} size="sm" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Table for Full List */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-dark-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                    <th className="py-3.5 px-4">Member</th>
                    <th className="py-3.5 px-4">Codeforces Handle</th>
                    <th className="py-3.5 px-4">Rating</th>
                    <th className="py-3.5 px-4 text-right">Metric Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredList.map((user, idx) => (
                    <tr
                      key={user._id || idx}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {idx === 0 && <span className="text-amber-400">#1</span>}
                        {idx === 1 && <span className="text-slate-300">#2</span>}
                        {idx === 2 && <span className="text-amber-600">#3</span>}
                        {idx > 2 && <span className="text-slate-500">#{idx + 1}</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-xs text-slate-300">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-200 group-hover:text-white">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        {user.codeforcesHandle ? (
                          <a
                            href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-accent hover:underline inline-flex items-center gap-1"
                          >
                            @{user.codeforcesHandle}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <RatingBadge rating={user.codeforcesProfile?.rating || 0} size="xs" />
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {activeTab === 'rating' && (user.codeforcesProfile?.rating || 0)}
                        {activeTab === 'weekly' && `${user.weeklySolved || 0} solved`}
                        {activeTab === 'improvement' && `+${user.ratingImprovement || 0} pts`}
                        {activeTab === 'total' && `${user.codeforcesProfile?.totalSolvedCount || 0} solved`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No ranked members found"
          description="Members will appear once their Codeforces handles are verified."
          icon={Trophy}
        />
      )}
    </div>
  );
}

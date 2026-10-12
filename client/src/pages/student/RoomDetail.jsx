import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CountdownTimer from '../../components/CountdownTimer';
import LoadingSpinner from '../../components/LoadingSpinner';
import RatingBadge from '../../components/RatingBadge';
import {
  Swords,
  ExternalLink,
  RefreshCw,
  Trophy,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function RoomDetail() {
  const { id } = useParams();
  const { user, syncCodeforces, isSyncingCF } = useAuth();
  const [room, setRoom] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('problems');

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const [roomRes, boardRes] = await Promise.allSettled([
        api.get(`/practice-rooms/${id}`),
        api.get(`/practice-rooms/${id}/leaderboard`),
      ]);

      if (roomRes.status === 'fulfilled' && roomRes.value.success) {
        setRoom(roomRes.value.data);
      }
      if (boardRes.status === 'fulfilled' && boardRes.value.success) {
        setLeaderboard(boardRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load room:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [id]);

  const handleLiveSync = async () => {
    await syncCodeforces();
    await fetchRoomData();
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to contest arena..." />;
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-400 mb-4">Practice room not found</p>
        <Link to="/practice-rooms" className="btn-secondary text-xs">
          ← Back to Rooms
        </Link>
      </div>
    );
  }

  const now = new Date();
  const start = new Date(room.startTime);
  const end = new Date(room.endTime);
  const isLive = now >= start && now <= end;
  const isEnded = now > end || room.isFinished;

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        to="/practice-rooms"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Practice Rooms</span>
      </Link>

      {/* Room Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  CONTEST IN PROGRESS
                </span>
              ) : isEnded ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                  CONTEST ENDED
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400">
                  UPCOMING CONTEST
                </span>
              )}
              <span className="text-xs text-slate-400 font-mono">
                Organized by {room.creator?.name || 'Club Mentor'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {room.title}
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">{room.description}</p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            {isLive && <CountdownTimer targetDate={room.endTime} label="Contest Ends" />}
            <button
              onClick={handleLiveSync}
              disabled={isSyncingCF}
              className="btn-primary flex items-center gap-2 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
              <span>Sync & Refresh Standings</span>
            </button>
          </div>
        </div>

        {/* Tab switch between Problems and Live Standings */}
        <div className="flex gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('problems')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'problems'
                ? 'bg-brand-primary text-white shadow-glow-primary'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Problem Set ({room.problems?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'standings'
                ? 'bg-brand-primary text-white shadow-glow-primary'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Live Standings ({leaderboard.length})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'problems' ? (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Problem Name</th>
                  <th className="py-3.5 px-4">Codeforces ID</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Points</th>
                  <th className="py-3.5 px-4 text-right">Solve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(room.problems || []).map((prob, idx) => {
                  const cfLink = `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        {String.fromCharCode(65 + idx)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <a
                          href={cfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline hover:text-brand-accent inline-flex items-center gap-1.5"
                        >
                          {prob.title || `Problem ${prob.index}`}
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-brand-accent">
                        {prob.contestId}{prob.index}
                      </td>
                      <td className="py-3.5 px-4">
                        {prob.rating ? (
                          <RatingBadge rating={prob.rating} size="xs" showRank={false} />
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-xs">
                        {prob.points || 100} pts
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={cfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary py-1 px-3 text-xs inline-flex items-center gap-1"
                        >
                          Submit on CF
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Participant</th>
                  <th className="py-3.5 px-4">Codeforces</th>
                  <th className="py-3.5 px-4 text-center">Solved</th>
                  <th className="py-3.5 px-4 text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {idx === 0 && <span className="text-amber-400">#1</span>}
                      {idx === 1 && <span className="text-slate-300">#2</span>}
                      {idx === 2 && <span className="text-amber-600">#3</span>}
                      {idx > 2 && <span className="text-slate-500">#{idx + 1}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {item.user?.name || 'Participant'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-brand-accent">
                      {item.user?.codeforcesHandle ? `@${item.user.codeforcesHandle}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-bold">
                      {item.solvedCount || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {item.score || 0} pts
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400 text-sm">
                      No participants registered yet in this room.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

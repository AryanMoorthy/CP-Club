import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import CountdownTimer from '../../components/CountdownTimer';
import Skeleton from '../../components/Skeleton';
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
  Layers,
} from 'lucide-react';

export default function RoomDetail() {
  const { id } = useParams();
  const { user, syncCodeforces, isSyncingCF } = useAuth();
  const toast = useToast();
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
    try {
      await syncCodeforces();
      await fetchRoomData();
      toast.success('Live scoreboard synced with Codeforces');
    } catch (err) {
      toast.error('Sync failed: ' + (err.message || 'unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton.Card />
        <Skeleton.Table rows={5} />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12 glass-card">
        <p className="text-rose-400 mb-3 text-sm">Practice room not found</p>
        <Link to="/practice-rooms" className="btn-secondary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Practice Rooms
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
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>All Practice Rooms</span>
      </Link>

      {/* Room Header Banner */}
      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isLive ? (
                <span className="badge badge-rose flex items-center gap-1.5 animate-pulse text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Live Contest
                </span>
              ) : isEnded ? (
                <span className="badge badge-slate text-[11px]">Contest Ended</span>
              ) : (
                <span className="badge badge-cyan text-[11px]">Upcoming Contest</span>
              )}
              <span className="text-[11px] text-slate-500 font-mono">
                By {room.creator?.name || 'Club Mentor'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{room.title}</h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              {room.description || 'Virtual arena with live peer standings.'}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            {isLive && <CountdownTimer targetDate={room.endTime} label="Contest Ends" />}
            <button
              onClick={handleLiveSync}
              disabled={isSyncingCF}
              className="btn-primary text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
              <span>Sync Standings</span>
            </button>
          </div>
        </div>

        {/* Tab switch between Problems and Live Standings */}
        <div className="pt-3 border-t border-[#1e293b] flex gap-2">
          <div className="tab-bar">
            <button
              onClick={() => setActiveTab('problems')}
              className={`tab-item ${activeTab === 'problems' ? 'active' : ''}`}
            >
              Problem Set ({room.problems?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`tab-item flex items-center gap-1.5 ${
                activeTab === 'standings' ? 'active' : ''
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Standings ({leaderboard.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'problems' ? (
        <div className="glass-card overflow-hidden w-full border border-[#1e293b]">
          <div className="overflow-x-auto w-full">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th className="min-w-[240px]">Problem</th>
                  <th className="min-w-[120px]">CF ID</th>
                  <th className="min-w-[120px]">Rating</th>
                  <th className="min-w-[100px]">Points</th>
                  <th className="min-w-[120px] text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(room.problems || []).map((prob, idx) => {
                  const cfLink = `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`;
                  return (
                    <tr key={idx}>
                      <td className="text-center font-mono font-bold text-slate-400">
                        {String.fromCharCode(65 + idx)}
                      </td>
                      <td>
                        <a
                          href={cfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-slate-200 hover:text-indigo-400 inline-flex items-center gap-1.5 transition"
                        >
                          <span>{prob.title || `Problem ${prob.index}`}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 opacity-60" />
                        </a>
                      </td>
                      <td className="font-mono text-xs text-indigo-400 font-semibold">
                        {prob.contestId}{prob.index}
                      </td>
                      <td>
                        {prob.rating ? (
                          <RatingBadge rating={prob.rating} size="xs" showRank={false} />
                        ) : (
                          <span className="text-slate-600 text-xs font-mono">—</span>
                        )}
                      </td>
                      <td className="font-mono font-semibold text-amber-400 text-xs">
                        {prob.points || 100} pts
                      </td>
                      <td className="text-right">
                        <a
                          href={cfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                        >
                          Solve
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
        <div className="glass-card overflow-hidden w-full border border-[#1e293b]">
          <div className="overflow-x-auto w-full">
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th className="w-16 text-center">Rank</th>
                  <th className="min-w-[200px]">Participant</th>
                  <th className="min-w-[160px]">Codeforces</th>
                  <th className="min-w-[120px] text-center">Solved</th>
                  <th className="min-w-[120px] text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length > 0 ? (
                  leaderboard.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-center font-mono font-semibold">
                        {idx === 0 && <span className="text-amber-400">#1</span>}
                        {idx === 1 && <span className="text-slate-300">#2</span>}
                        {idx === 2 && <span className="text-amber-600">#3</span>}
                        {idx > 2 && <span className="text-slate-500">#{idx + 1}</span>}
                      </td>
                      <td className="font-medium text-slate-200">
                        {item.user?.name || 'Participant'}
                      </td>
                      <td className="font-mono text-xs text-indigo-400">
                        {item.user?.codeforcesHandle ? `@${item.user.codeforcesHandle}` : '—'}
                      </td>
                      <td className="text-center font-mono text-emerald-400 font-semibold">
                        {item.solvedCount || 0}
                      </td>
                      <td className="text-right font-mono font-bold text-slate-100">
                        {item.score || 0} pts
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-xs text-slate-500">
                      No participants registered or solved problems yet in this room.
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

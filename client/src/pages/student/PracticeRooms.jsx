import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CountdownTimer from '../../components/CountdownTimer';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import {
  Swords,
  Users,
  Clock,
  ArrowRight,
  Plus,
  Play,
  CheckCircle,
} from 'lucide-react';

export default function PracticeRooms() {
  const { isMentor, user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/practice-rooms');
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.rooms || []);
        setRooms(list);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleJoin = async (roomId) => {
    try {
      const res = await api.post(`/practice-rooms/${roomId}/join`);
      if (res.success) {
        fetchRooms();
      }
    } catch (err) {
      alert(`Could not join: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Swords className="w-8 h-8 text-indigo-400" />
            Practice Rooms
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Timed virtual contests with real-time peer scoreboards and curated problem sets.
          </p>
        </div>

        {isMentor && (
          <Link
            to="/mentor/rooms/new"
            className="btn-primary flex items-center gap-2 text-xs font-semibold self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </Link>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching active rooms..." />
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => {
            const now = new Date();
            const start = new Date(room.startTime);
            const end = new Date(room.endTime);
            const isLive = now >= start && now <= end;
            const isUpcoming = now < start;
            const isEnded = now > end || room.isFinished;

            const isParticipant = (room.participants || []).some(
              (p) => (p.user?._id || p.user) === user?._id
            );

            return (
              <div
                key={room._id}
                className={`glass-card rounded-2xl border p-5 flex flex-col justify-between transition shadow-lg ${
                  isLive
                    ? 'border-indigo-500/50 shadow-glow-primary'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {isLive && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        LIVE CONTEST
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        Upcoming
                      </span>
                    )}
                    {isEnded && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
                        Finished
                      </span>
                    )}

                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {room.participants?.length || 0}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1">{room.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {room.description || 'Virtual practice arena.'}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-dark-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Problems:</span>
                      <span className="font-mono text-white font-semibold">
                        {room.problems?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Status:</span>
                      {isLive && <CountdownTimer targetDate={room.endTime} label="Ends in" />}
                      {isUpcoming && <CountdownTimer targetDate={room.startTime} label="Starts in" />}
                      {isEnded && <span className="font-mono text-slate-400">Ended</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  {!isEnded && !isParticipant && (
                    <button
                      onClick={() => handleJoin(room._id)}
                      className="btn-secondary text-xs"
                    >
                      Join Room
                    </button>
                  )}

                  <Link
                    to={`/practice-rooms/${room._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-brand-accent transition ml-auto"
                  >
                    <span>{isLive ? 'Enter Arena' : 'View Room'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No practice rooms"
          description="Mentors can schedule competitive rooms with problem sets."
          icon={Swords}
        />
      )}
    </div>
  );
}

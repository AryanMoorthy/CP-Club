import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import CountdownTimer from '../../components/CountdownTimer';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import {
  Swords,
  Users,
  Clock,
  ArrowRight,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function PracticeRooms() {
  const { isMentor, user } = useAuth();
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | live | upcoming | ended

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
      setJoiningId(roomId);
      const res = await api.post(`/practice-rooms/${roomId}/join`);
      if (res.success) {
        toast.success('Successfully registered for room!');
        fetchRooms();
      }
    } catch (err) {
      toast.error(err.message || 'Could not join room');
    } finally {
      setJoiningId(null);
    }
  };

  const now = new Date();

  const filtered = rooms.filter((room) => {
    const start = new Date(room.startTime);
    const end = new Date(room.endTime);
    const isLive = now >= start && now <= end;
    const isUpcoming = now < start;
    const isEnded = now > end || room.isFinished;

    if (filter === 'live') return isLive;
    if (filter === 'upcoming') return isUpcoming;
    if (filter === 'ended') return isEnded;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Practice Rooms"
        subtitle="Virtual contest arenas with peer scoreboards and curated problem sets."
        icon={Swords}
        iconColor="text-indigo-400"
        actions={
          isMentor && (
            <Link to="/mentor/rooms/new" className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" />
              Create Arena
            </Link>
          )
        }
      />

      {/* Tabs */}
      <div className="tab-bar self-start">
        {[
          { id: 'all', label: 'All Rooms' },
          { id: 'live', label: 'Live Now' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'ended', label: 'Finished' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`tab-item ${filter === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton.Grid cards={3} />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((room) => {
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
                className={`glass-card p-5 flex flex-col justify-between transition hover:border-slate-700 ${
                  isLive ? 'border-rose-500/30 bg-rose-500/5' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {isLive && (
                      <span className="badge badge-rose flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Live Now
                      </span>
                    )}
                    {isUpcoming && <span className="badge badge-cyan">Upcoming</span>}
                    {isEnded && <span className="badge badge-slate">Finished</span>}

                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      {room.participants?.length || 0} joined
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">{room.name}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {room.description || 'Virtual contest practice arena.'}
                  </p>

                  <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Problem Set:</span>
                      <span className="font-mono text-slate-200 font-medium">
                        {room.problems?.length || 0} problems
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Timer:</span>
                      {isLive && <CountdownTimer targetDate={room.endTime} label="Ends" />}
                      {isUpcoming && <CountdownTimer targetDate={room.startTime} label="Starts" />}
                      {isEnded && <span className="font-mono text-slate-500">Ended</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#1e293b] flex items-center justify-between gap-2">
                  {!isEnded && !isParticipant ? (
                    <button
                      onClick={() => handleJoin(room._id)}
                      disabled={joiningId === room._id}
                      className="btn-secondary py-1 px-2.5 text-xs"
                    >
                      {joiningId === room._id ? 'Joining...' : 'Register'}
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isEnded ? 'Completed' : 'Registered'}
                    </span>
                  )}

                  <Link
                    to={`/practice-rooms/${room._id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition ml-auto"
                  >
                    <span>{isLive ? 'Enter Contest' : 'Details'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={filter === 'all' ? 'No practice rooms' : `No ${filter} rooms`}
          description="Contests and virtual practice rooms will appear here when scheduled by mentors."
          icon={Swords}
        />
      )}
    </div>
  );
}

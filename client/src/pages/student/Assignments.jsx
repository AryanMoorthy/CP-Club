import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CountdownTimer from '../../components/CountdownTimer';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import {
  CalendarCheck2,
  Plus,
  ArrowRight,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

function getDeadlineStatus(deadline) {
  const now = new Date();
  const d   = new Date(deadline);
  const diffMs = d - now;
  if (diffMs < 0)                      return { label: 'Overdue',   cls: 'badge badge-rose' };
  if (diffMs < 1000 * 60 * 60 * 24)   return { label: 'Due today', cls: 'badge badge-amber' };
  if (diffMs < 1000 * 60 * 60 * 24 * 3) return { label: 'Due soon', cls: 'badge badge-amber' };
  return { label: 'Active', cls: 'badge badge-emerald' };
}

export default function Assignments() {
  const { isMentor } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all'); // all | active | overdue

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.assignments || []);
        setAssignments(list);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const now = new Date();
  const filtered = assignments.filter((a) => {
    const expired = new Date(a.deadline) < now;
    if (filter === 'active')  return !expired;
    if (filter === 'overdue') return expired;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Assignments"
        subtitle="Complete assigned problem sets within the deadline to maintain active standing."
        icon={CalendarCheck2}
        iconColor="text-cyan-400"
        actions={
          isMentor && (
            <Link to="/mentor/assignments/new" className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" />
              Create Assignment
            </Link>
          )
        }
      />

      {/* Filter tabs */}
      <div className="tab-bar self-start">
        {[
          { id: 'all',     label: 'All' },
          { id: 'active',  label: 'Active' },
          { id: 'overdue', label: 'Overdue' },
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
          {filtered.map((assignment) => {
            const isExpired    = new Date(assignment.deadline) < now;
            const totalProblems = assignment.problems?.length || 0;
            const status       = getDeadlineStatus(assignment.deadline);

            return (
              <div
                key={assignment._id}
                className={`glass-card p-5 flex flex-col justify-between transition hover:border-slate-700 ${
                  isExpired ? 'opacity-75' : ''
                }`}
              >
                <div>
                  {/* Status + pass threshold */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={status.cls}>{status.label}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Pass: {assignment.passPercentage || 70}%
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">{assignment.title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {assignment.description || 'Mandatory problem set for club members.'}
                  </p>

                  {/* Deadline countdown */}
                  <div className="mt-3">
                    <CountdownTimer targetDate={assignment.deadline} />
                  </div>

                  {/* Problem count */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                    <span>{totalProblems} problem{totalProblems !== 1 ? 's' : ''} assigned</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-5 pt-4 border-t border-[#1e293b] flex items-center justify-between gap-2">
                  {assignment.sheetId ? (
                    <Link
                      to={`/sheets/${assignment.sheetId}`}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                    >
                      Open Sheet <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-600">Custom Problems</span>
                  )}

                  {isMentor && (
                    <Link
                      to={`/mentor/assignments/${assignment._id}/progress`}
                      className="btn-secondary py-1 px-2.5 text-xs"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-amber-400" />
                      Review
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={filter === 'overdue' ? 'No overdue assignments' : 'No assignments'}
          description={
            filter === 'overdue'
              ? "Great — you're on top of everything!"
              : 'No assignments from mentors at the moment.'
          }
          icon={CalendarCheck2}
        />
      )}
    </div>
  );
}

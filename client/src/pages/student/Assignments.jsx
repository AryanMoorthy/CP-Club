import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import CountdownTimer from '../../components/CountdownTimer';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import {
  CalendarCheck2,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function Assignments() {
  const { isMentor } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Club Assignments
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete assigned problem sets within the deadline to maintain active standing.
          </p>
        </div>

        {isMentor && (
          <Link
            to="/mentor/assignments/new"
            className="btn-primary flex items-center gap-2 text-xs font-semibold self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </Link>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching assignments..." />
      ) : assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map((assignment) => {
            const isExpired = new Date(assignment.deadline) < new Date();
            const totalProblems = assignment.problems?.length || 0;

            return (
              <div
                key={assignment._id}
                className="glass-card rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <CountdownTimer targetDate={assignment.deadline} />
                    <span className="text-xs font-mono text-slate-400">
                      Pass: {assignment.passPercentage || 70}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {assignment.description || 'Mandatory problem set for club members.'}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-dark-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Target Problems:</span>
                    <span className="text-brand-accent font-semibold">{totalProblems} Problems</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  {assignment.sheetId ? (
                    <Link
                      to={`/sheets/${assignment.sheetId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:text-brand-accent transition"
                    >
                      <span>Open Sheet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">Custom Problems</span>
                  )}

                  {isMentor && (
                    <Link
                      to={`/mentor/assignments/${assignment._id}/progress`}
                      className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                      <span>Review</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No assignments right now"
          description="Great job! You have no pending assignments from mentors."
          icon={CalendarCheck2}
        />
      )}
    </div>
  );
}

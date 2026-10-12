import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import RatingBadge from '../../components/RatingBadge';
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Users,
} from 'lucide-react';

export default function AssignmentProgress() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assignments/${id}/progress`);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load assignment progress:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Analyzing student submission records..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-400 mb-4">Assignment progress data not available.</p>
        <Link to="/assignments" className="btn-secondary text-xs">
          ← Back to Assignments
        </Link>
      </div>
    );
  }

  const assignment = data.assignment || {};
  const progressList = Array.isArray(data.progress)
    ? data.progress
    : (data.progress
        ? [
            {
              user: assignment.assignedTo,
              ...data.progress,
              percentage: data.progress.completionPct,
              passed: data.progress.status === 'completed',
            },
          ]
        : []);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <Link
        to="/assignments"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments</span>
      </Link>

      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Progress Report: {assignment.title}
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          Pass threshold: <span className="text-brand-accent font-mono font-semibold">{assignment.passPercentage}%</span> |
          Total Problems: <span className="text-white font-mono">{assignment.problems?.length || 0}</span>
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Codeforces</th>
                <th className="py-3.5 px-4 text-center">Solved</th>
                <th className="py-3.5 px-4 text-center">Percentage</th>
                <th className="py-3.5 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {progressList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {item.user?.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {item.user?.codeforcesHandle ? (
                      <a
                        href={`https://codeforces.com/profile/${item.user.codeforcesHandle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-accent hover:underline inline-flex items-center gap-1"
                      >
                        @{item.user.codeforcesHandle}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                    {item.solvedCount} / {assignment.problems?.length || 0}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-400">
                    {item.percentage}%
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {item.passed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        Incomplete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {progressList.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400 text-sm">
                    No student submissions tracked yet for this assignment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

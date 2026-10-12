import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import RatingBadge from '../../components/RatingBadge';
import {
  FileCode2,
  ExternalLink,
  CheckCircle2,
  Circle,
  RefreshCw,
  Layers,
  ArrowLeft,
  Share2,
  Award,
  Edit,
} from 'lucide-react';

export default function SheetDetail() {
  const { id } = useParams();
  const { user, isMentor, syncCodeforces, isSyncingCF } = useAuth();
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [solvedKeys, setSolvedKeys] = useState(new Set());
  const [syncingProblem, setSyncingProblem] = useState(null);

  const fetchSheetData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/problem-sheets/${id}`);
      if (res.success && res.data) {
        const s = res.data.sheet || res.data;
        setSheet(s);
      } else {
        setError('Sheet not found');
      }

      // Fetch user's solved problems to match against this sheet
      const solvedRes = await api.get('/users/solved-problems');
      if (solvedRes.success && solvedRes.data) {
        const keys = new Set(
          solvedRes.data.map((p) => `${p.contestId}${p.problemIndex}`.toUpperCase())
        );
        setSolvedKeys(keys);
      }
    } catch (err) {
      setError(err.message || 'Failed to load problem sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, [id]);

  const handleVerifySubmission = async (problem) => {
    if (!user?.codeforcesHandle) {
      alert('Please link your Codeforces handle in your profile first!');
      return;
    }

    const key = `${problem.contestId}${problem.index}`.toUpperCase();
    setSyncingProblem(key);

    try {
      // Sync with Codeforces API
      const syncRes = await syncCodeforces();
      if (syncRes.success) {
        // Refresh local solved list
        const solvedRes = await api.get('/users/solved-problems');
        if (solvedRes.success && solvedRes.data) {
          const updatedKeys = new Set(
            solvedRes.data.map((p) => `${p.contestId}${p.problemIndex}`.toUpperCase())
          );
          setSolvedKeys(updatedKeys);

          if (updatedKeys.has(key)) {
            alert(`Great job! Problem ${key} is verified as ACCEPTED on Codeforces! 🎉`);
          } else {
            alert(`No accepted submission found yet on Codeforces for ${key}. Solve it first and try again!`);
          }
        }
      } else {
        alert(`Sync failed: ${syncRes.error}`);
      }
    } catch (err) {
      alert(`Error verifying: ${err.message}`);
    } finally {
      setSyncingProblem(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading sheet problems..." />;
  }

  if (error || !sheet) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-400 mb-4">{error || 'Sheet not found'}</p>
        <Link to="/sheets" className="btn-secondary text-xs">
          ← Back to Sheets
        </Link>
      </div>
    );
  }

  const problems = sheet.problems || [];
  const solvedCount = problems.filter((p) =>
    solvedKeys.has(`${p.contestId}${p.index}`.toUpperCase())
  ).length;
  const progressPercent = problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/sheets"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Sheets</span>
        </Link>

        {isMentor && (
          <Link
            to={`/mentor/sheets/edit/${sheet._id}`}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Sheet</span>
          </Link>
        )}
      </div>

      {/* Sheet Banner Card */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {sheet.difficulty}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Curated by {sheet.author?.name || 'Mentor'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {sheet.title}
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              {sheet.description}
            </p>
          </div>

          {/* Quick sync button for all problems */}
          <button
            onClick={() => handleVerifySubmission({ contestId: '', index: '' })}
            disabled={isSyncingCF}
            className="btn-primary self-start md:self-center flex items-center gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
            <span>Sync All CF Submissions</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-300">
              Your Progress: <span className="text-white font-mono">{solvedCount} / {problems.length} Solved</span>
            </span>
            <span className="text-brand-accent font-mono">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-dark-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Problems Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Status</th>
                <th className="py-3.5 px-4"># Problem</th>
                <th className="py-3.5 px-4">Codeforces ID</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Tags</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {problems.map((prob, idx) => {
                const probKey = `${prob.contestId}${prob.index}`.toUpperCase();
                const isSolved = solvedKeys.has(probKey);
                const isCheckingThis = syncingProblem === probKey;
                const cfLink = `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`;

                return (
                  <tr
                    key={probKey + idx}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    {/* Status Column */}
                    <td className="py-3.5 px-4 text-center">
                      {isSolved ? (
                        <CheckCircle2
                          className="w-5 h-5 text-emerald-400 mx-auto"
                          title="Verified Solved"
                        />
                      ) : (
                        <Circle
                          className="w-5 h-5 text-slate-600 mx-auto"
                          title="Unsolved"
                        />
                      )}
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <a
                        href={cfLink}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-slate-200 group-hover:text-white hover:underline flex items-center gap-1.5"
                      >
                        <span>{prob.name || `Problem ${prob.index}`}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                      </a>
                    </td>

                    {/* Codeforces ID */}
                    <td className="py-3.5 px-4 font-mono text-xs text-brand-accent">
                      {prob.contestId} - {prob.index}
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4">
                      {prob.rating ? (
                        <RatingBadge rating={prob.rating} size="xs" showRank={false} />
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">—</span>
                      )}
                    </td>

                    {/* Tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(prob.tags || []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono bg-dark-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <a
                        href={cfLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                      >
                        Solve
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleVerifySubmission(prob)}
                        disabled={isCheckingThis || isSyncingCF}
                        className={`py-1 px-2.5 text-xs rounded-lg font-medium transition inline-flex items-center gap-1 ${
                          isSolved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20'
                        }`}
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${isCheckingThis ? 'animate-spin' : ''}`}
                        />
                        {isSolved ? 'Verified' : 'Verify CF'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import RatingBadge from '../../components/RatingBadge';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import {
  FileCode2,
  ExternalLink,
  CheckCircle2,
  Circle,
  RefreshCw,
  ArrowLeft,
  Edit,
  Search,
  Check,
  Filter,
} from 'lucide-react';

export default function SheetDetail() {
  const { id } = useParams();
  const { user, isMentor, syncCodeforces, isSyncingCF } = useAuth();
  const toast = useToast();

  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [solvedKeys, setSolvedKeys] = useState(new Set());
  const [syncingProblem, setSyncingProblem] = useState(null);

  // Filters
  const [problemSearch, setProblemSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | solved | unsolved

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
      toast.warning('Link your Codeforces handle in your profile first');
      return;
    }

    const key = problem.contestId && problem.index
      ? `${problem.contestId}${problem.index}`.toUpperCase()
      : null;

    if (key) setSyncingProblem(key);

    try {
      await syncCodeforces();

      const solvedRes = await api.get('/users/solved-problems');
      if (solvedRes.success && solvedRes.data) {
        const updatedKeys = new Set(
          solvedRes.data.map((p) => `${p.contestId}${p.problemIndex}`.toUpperCase())
        );
        setSolvedKeys(updatedKeys);

        if (key) {
          if (updatedKeys.has(key)) {
            toast.success(`Verified: Problem ${key} is marked Accepted!`);
          } else {
            toast.info(`No accepted submission found yet on CF for ${key}.`);
          }
        } else {
          toast.success('Synced all Codeforces submissions');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setSyncingProblem(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton.Card />
        <Skeleton.Table rows={6} />
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="text-center py-12 glass-card">
        <p className="text-rose-400 mb-3 text-sm">{error || 'Problem sheet not found'}</p>
        <Link to="/sheets" className="btn-secondary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Problem Sheets
        </Link>
      </div>
    );
  }

  const problems = sheet.problems || [];
  const solvedCount = problems.filter((p) =>
    solvedKeys.has(`${p.contestId}${p.index}`.toUpperCase())
  ).length;
  const progressPercent = problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0;

  // Filtered problems
  const filteredProblems = problems.filter((prob) => {
    const key = `${prob.contestId}${prob.index}`.toUpperCase();
    const isSolved = solvedKeys.has(key);

    if (statusFilter === 'solved' && !isSolved) return false;
    if (statusFilter === 'unsolved' && isSolved) return false;

    if (problemSearch) {
      const q = problemSearch.toLowerCase();
      const matchName = prob.name?.toLowerCase().includes(q);
      const matchId = `${prob.contestId}${prob.index}`.toLowerCase().includes(q);
      const matchTags = (prob.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchId && !matchTags) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <Link
          to="/sheets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Sheets</span>
        </Link>

        {isMentor && (
          <Link
            to={`/mentor/sheets/edit/${sheet._id}`}
            className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Sheet</span>
          </Link>
        )}
      </div>

      {/* Header Banner */}
      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-indigo capitalize text-[11px]">
                {sheet.difficulty || 'All Levels'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Curated by {sheet.createdBy?.name || 'Club Mentor'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{sheet.title}</h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              {sheet.description || 'Targeted problem set to sharpen competitive programming skills.'}
            </p>
          </div>

          <button
            onClick={() => handleVerifySubmission({ contestId: '', index: '' })}
            disabled={isSyncingCF}
            className="btn-primary self-start md:self-center text-xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
            <span>Sync All Solves</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="pt-3 border-t border-[#1e293b]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">
              Your Progress:{' '}
              <strong className="text-slate-200 font-mono">
                {solvedCount} / {problems.length} Solved
              </strong>
            </span>
            <span className="font-mono font-medium text-indigo-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Problems */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="tab-bar">
          {[
            { id: 'all', label: `All (${problems.length})` },
            { id: 'unsolved', label: `Unsolved (${problems.length - solvedCount})` },
            { id: 'solved', label: `Solved (${solvedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`tab-item ${statusFilter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="search-box sm:w-72">
          <Search className="w-4 h-4" />
          <input
            type="text"
            value={problemSearch}
            onChange={(e) => setProblemSearch(e.target.value)}
            placeholder="Search problems or tags..."
          />
        </div>
      </div>

      {/* Problems Table */}
      <div className="glass-card overflow-hidden w-full border border-[#1e293b]">
        <div className="overflow-x-auto w-full">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th className="w-16 text-center">Status</th>
                <th className="min-w-[240px]">Problem</th>
                <th className="min-w-[120px]">CF ID</th>
                <th className="min-w-[120px]">Rating</th>
                <th className="min-w-[200px]">Tags</th>
                <th className="min-w-[140px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.length > 0 ? (
                filteredProblems.map((prob, idx) => {
                  const probKey = `${prob.contestId}${prob.index}`.toUpperCase();
                  const isSolved = solvedKeys.has(probKey);
                  const isChecking = syncingProblem === probKey;
                  const cfLink = `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`;

                  return (
                    <tr key={probKey + idx}>
                      <td className="text-center">
                        {isSolved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 mx-auto" />
                        )}
                      </td>

                      <td>
                        <a
                          href={cfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-slate-200 hover:text-indigo-400 inline-flex items-center gap-1.5 transition"
                        >
                          <span>{prob.name || `Problem ${prob.index}`}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 opacity-60" />
                        </a>
                      </td>

                      <td className="font-mono text-xs text-indigo-400">
                        {prob.contestId}{prob.index}
                      </td>

                      <td>
                        {prob.rating ? (
                          <RatingBadge rating={prob.rating} size="xs" showRank={false} />
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">—</span>
                        )}
                      </td>

                      <td>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(prob.tags || []).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono bg-slate-800/60 border border-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="text-right space-x-1.5">
                        <a
                          href={cfLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                        >
                          CF
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => handleVerifySubmission(prob)}
                          disabled={isChecking || isSyncingCF}
                          className={`py-1 px-2 text-xs rounded font-medium transition inline-flex items-center gap-1 border ${
                            isSolved
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`}
                          />
                          {isSolved ? 'Solved' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500">
                    No problems match your filter criteria.
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import {
  Search,
  Filter,
  FileCode2,
  Plus,
  ArrowRight,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ProblemSheets() {
  const { isMentor } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedTag) params.append('tag', selectedTag);

      const res = await api.get(`/problem-sheets?${params.toString()}`);
      // Axios interceptor returns response.data, so res = { success, data }
      if (res && res.success) {
        const sheetsData = res.data?.sheets || res.data || [];
        setSheets(Array.isArray(sheetsData) ? sheetsData : []);
      } else {
        setSheets([]);
      }
    } catch (err) {
      console.error('Failed to fetch sheets:', err);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, [selectedDifficulty, selectedTag]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSheets();
  };

  // Collect unique tags
  const allTags = Array.from(
    new Set(sheets.flatMap((s) => s.tags || []))
  ).slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Title and Create Button for Mentors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Curated Problem Sheets
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Master CP patterns with targeted problem collections curated by club mentors.
          </p>
        </div>

        {isMentor && (
          <Link
            to="/mentor/sheets/new"
            className="btn-primary flex items-center gap-2 text-xs font-semibold self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Sheet</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sheets by title or topic..."
              className="w-full glass-input rounded-xl py-2 pl-10 pr-4 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="glass-input rounded-xl py-2 px-3 text-xs bg-dark-900 text-slate-300"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>

            <button type="submit" className="btn-secondary text-xs">
              Search
            </button>
          </div>
        </form>

        {/* Quick Tag Pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Tags:</span>
            <button
              onClick={() => setSelectedTag('')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition ${
                !selectedTag
                  ? 'bg-brand-primary text-white'
                  : 'bg-dark-900 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition ${
                  selectedTag === tag
                    ? 'bg-brand-primary text-white'
                    : 'bg-dark-900 text-slate-400 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sheets Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching sheets..." />
      ) : sheets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sheets.map((sheet) => {
            const difficultyColors = {
              beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              easy: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
              medium: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
              hard: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
              expert: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            }[sheet.difficulty] || 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div
                key={sheet._id}
                className="glass-card rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between hover:border-slate-700 transition group hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${difficultyColors}`}
                    >
                      {sheet.difficulty}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {sheet.problems?.length || 0} problems
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-brand-accent transition line-clamp-1">
                    {sheet.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {sheet.description || 'Curated set of competitive programming problems.'}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-4">
                    {(sheet.tags || []).slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono text-slate-400 bg-dark-900 border border-slate-800 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    By {sheet.createdBy?.name || 'Club Mentor'}
                  </span>
                  <Link
                    to={`/sheets/${sheet._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary group-hover:text-brand-accent transition"
                  >
                    <span>Start Practice</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No problem sheets found"
          description="Try adjusting your search criteria or tags."
          icon={FileCode2}
        />
      )}
    </div>
  );
}

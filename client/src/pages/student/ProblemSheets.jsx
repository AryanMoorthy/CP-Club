import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import {
  Search,
  FileCode2,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  Tag,
} from 'lucide-react';

const DIFFICULTIES = [
  { value: '', label: 'All Difficulties' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

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
  ).slice(0, 12);

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'beginner': return 'badge badge-emerald';
      case 'easy':     return 'badge badge-cyan';
      case 'medium':   return 'badge badge-amber';
      case 'hard':     return 'badge badge-rose';
      case 'expert':   return 'badge badge-purple';
      default:         return 'badge badge-slate';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Problem Sheets"
        subtitle="Master competitive programming patterns through curated problem sets."
        icon={FileCode2}
        iconColor="text-indigo-400"
        actions={
          isMentor && (
            <Link to="/mentor/sheets/new" className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" />
              Create Sheet
            </Link>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="glass-card p-3.5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="search-box flex-1">
            <Search className="w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sheets by title or topic..."
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              aria-label="Filter by difficulty"
              className="input-field py-1.5 px-3 text-xs w-auto cursor-pointer"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value} className="bg-[#0b0f19]">
                  {d.label}
                </option>
              ))}
            </select>

            <button type="submit" className="btn-secondary py-1.5 text-xs">
              Search
            </button>
          </div>
        </form>

        {/* Quick Tag Pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1e293b]">
            <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-500" />
              Topics:
            </span>
            <button
              onClick={() => setSelectedTag('')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                !selectedTag
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  selectedTag === tag
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
        <Skeleton.Grid cards={6} />
      ) : sheets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sheets.map((sheet) => {
            const count = sheet.problems?.length || 0;
            return (
              <div
                key={sheet._id}
                className="glass-card p-5 flex flex-col justify-between hover:border-slate-700 transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={getDifficultyBadge(sheet.difficulty)}>
                      {sheet.difficulty || 'All Levels'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-600" />
                      {count} problem{count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition line-clamp-1">
                    {sheet.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {sheet.description || 'Targeted competitive programming problem set.'}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {(sheet.tags || []).slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono text-slate-400 bg-slate-800/50 border border-slate-800 px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#1e293b] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    By {sheet.createdBy?.name || 'Mentor'}
                  </span>
                  <Link
                    to={`/sheets/${sheet._id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition"
                  >
                    <span>Practice</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No problem sheets found"
          description="Try clearing your search query or tag filter."
          icon={FileCode2}
        />
      )}
    </div>
  );
}

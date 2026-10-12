import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  FileCode2,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function SheetEditor() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const publishIntentRef = useRef(false);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    tags: '',
    isPublished: true,
    problems: [
      {
        name: '',
        contestId: '',
        index: '',
        rating: 1200,
        tags: '',
      },
    ],
  });

  useEffect(() => {
    if (isEditing) {
      const fetchSheet = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/problem-sheets/${id}`);
          if (res.success && res.data) {
            const sheet = res.data.sheet || res.data;
            setForm({
              title: sheet.title,
              description: sheet.description || '',
              difficulty: sheet.difficulty || 'medium',
              tags: (sheet.tags || []).join(', '),
              isPublished: sheet.status === 'published',
              problems: (sheet.problems || []).map((p) => ({
                name: p.name || '',
                contestId: p.contestId,
                index: p.index,
                rating: p.rating || 1200,
                tags: (p.tags || []).join(', '),
              })),
            });
          }
        } catch (err) {
          setErrorMsg('Failed to load sheet');
        } finally {
          setLoading(false);
        }
      };
      fetchSheet();
    }
  }, [id, isEditing]);

  const handleAddProblem = () => {
    setForm({
      ...form,
      problems: [
        ...form.problems,
        { name: '', contestId: '', index: '', rating: 1200, tags: '' },
      ],
    });
  };

  const handleRemoveProblem = (idx) => {
    const updated = form.problems.filter((_, i) => i !== idx);
    setForm({ ...form, problems: updated });
  };

  const handleProblemChange = (idx, field, value) => {
    const updated = [...form.problems];
    updated[idx][field] = value;
    setForm({ ...form, problems: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.title.trim()) {
      setErrorMsg('Sheet title is required.');
      return;
    }

    if (form.problems.length === 0) {
      setErrorMsg('Please add at least one problem to the sheet.');
      return;
    }

    // Validate contestId & index
    for (const [idx, p] of form.problems.entries()) {
      if (!p.contestId || !p.index) {
        setErrorMsg(`Problem #${idx + 1} must have both Contest ID and Index.`);
        return;
      }
    }

    // Use the ref to determine publish intent (set before form submit)
    const shouldPublish = publishIntentRef.current;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      status: shouldPublish ? 'published' : 'draft',
      topic: form.tags.split(',').map((t) => t.trim()).filter(Boolean)[0] || '',
      problems: form.problems.map((p) => ({
        name: (p.name || '').trim() || `Problem ${p.index.toUpperCase()}`,
        contestId: parseInt(p.contestId, 10),
        index: p.index.trim().toUpperCase(),
        rating: p.rating ? parseInt(p.rating, 10) : undefined,
        tags: typeof p.tags === 'string'
          ? p.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
          : p.tags,
        url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index.trim().toUpperCase()}`,
      })),
    };

    try {
      setSaving(true);
      if (isEditing) {
        await api.patch(`/problem-sheets/${id}`, payload);
        // If publish was requested, call the publish endpoint too
        if (payload.status === 'published') {
          await api.post(`/problem-sheets/${id}/publish`);
        }
      } else {
        const res = await api.post('/problem-sheets', payload);
        // Backend sets status from payload now, but call publish separately if needed
        // for safety (in case backend doesn't support status in create)
        if (payload.status === 'published' && res?.data?.sheet?._id) {
          try { await api.post(`/problem-sheets/${res.data.sheet._id}/publish`); } catch (_) {}
        }
      }
      navigate('/sheets');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save sheet');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    publishIntentRef.current = false;
    document.getElementById('sheet-form').requestSubmit();
  };

  const handleSavePublish = (e) => {
    e.preventDefault();
    publishIntentRef.current = true;
    document.getElementById('sheet-form').requestSubmit();
  };

  if (loading) {
    return <LoadingSpinner text="Loading sheet editor..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <Link
        to="/sheets"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Sheets</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isEditing ? 'Edit Problem Sheet' : 'Create New Problem Sheet'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Curate problems with Codeforces IDs, ratings, and tags.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-sm text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form id="sheet-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Sheet metadata card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Sheet Details
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Sheet Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Dynamic Programming: Classical 1D & 2D"
              required
              className="w-full glass-input rounded-xl py-2 px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief summary of topics covered and prerequisites..."
              className="w-full glass-input rounded-xl py-2 px-3 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Difficulty Level
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full glass-input rounded-xl py-2 px-3 text-sm bg-dark-900"
              >
                <option value="beginner">Beginner (800–1000)</option>
                <option value="easy">Easy (1000–1200)</option>
                <option value="medium">Medium (1200–1600)</option>
                <option value="hard">Hard (1600–2000)</option>
                <option value="expert">Expert (2000+)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Topic Tags (comma-separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="dp, math, greedy"
                className="w-full glass-input rounded-xl py-2 px-3 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="rounded bg-dark-900 border-slate-700 text-brand-primary"
            />
            <label htmlFor="isPublished" className="text-xs text-slate-300">
              Publish sheet immediately (visible to all students)
            </label>
          </div>
        </div>

        {/* Problems section */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Problems Collection ({form.problems.length})
            </h3>
            <button
              type="button"
              onClick={handleAddProblem}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-brand-primary" />
              <span>Add Problem</span>
            </button>
          </div>

          <div className="space-y-4">
            {form.problems.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-dark-900/60 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-accent">
                    Problem #{idx + 1}
                  </span>
                  {form.problems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProblem(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove Problem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Problem Name
                    </label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleProblemChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Watermelon"
                      className="w-full glass-input rounded-xl py-1.5 px-3 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Contest ID *
                    </label>
                    <input
                      type="number"
                      value={p.contestId}
                      onChange={(e) => handleProblemChange(idx, 'contestId', e.target.value)}
                      placeholder="e.g. 4"
                      required
                      className="w-full glass-input rounded-xl py-1.5 px-3 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Index *
                    </label>
                    <input
                      type="text"
                      value={p.index}
                      onChange={(e) => handleProblemChange(idx, 'index', e.target.value)}
                      placeholder="e.g. A"
                      required
                      className="w-full glass-input rounded-xl py-1.5 px-3 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Rating / Difficulty
                    </label>
                    <input
                      type="number"
                      value={p.rating}
                      onChange={(e) => handleProblemChange(idx, 'rating', e.target.value)}
                      placeholder="e.g. 1200"
                      className="w-full glass-input rounded-xl py-1.5 px-3 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={p.tags}
                      onChange={(e) => handleProblemChange(idx, 'tags', e.target.value)}
                      placeholder="e.g. brute force, math"
                      className="w-full glass-input rounded-xl py-1.5 px-3 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit action */}
        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-800">
          <Link to="/sheets" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="btn-secondary text-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save as Draft'}</span>
          </button>
          <button
            type="button"
            onClick={handleSavePublish}
            disabled={saving}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : isEditing ? 'Update & Publish' : 'Save & Publish'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

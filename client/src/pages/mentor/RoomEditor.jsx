import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Swords,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  AlertCircle,
} from 'lucide-react';

export default function RoomEditor() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    problems: [
      {
        title: '',
        contestId: '',
        index: '',
        points: 100,
        rating: 1200,
      },
    ],
  });

  const handleAddProblem = () => {
    setForm({
      ...form,
      problems: [
        ...form.problems,
        { title: '', contestId: '', index: '', points: 100, rating: 1200 },
      ],
    });
  };

  const handleRemoveProblem = (idx) => {
    setForm({
      ...form,
      problems: form.problems.filter((_, i) => i !== idx),
    });
  };

  const handleProblemChange = (idx, field, value) => {
    const updated = [...form.problems];
    updated[idx][field] = value;
    setForm({ ...form, problems: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.title || !form.startTime || !form.endTime) {
      setErrorMsg('Please specify title, start time, and end time.');
      return;
    }

    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setErrorMsg('End time must be strictly after start time.');
      return;
    }

    if (form.problems.length === 0) {
      setErrorMsg('Please add at least one problem to the arena.');
      return;
    }

    for (const [idx, p] of form.problems.entries()) {
      if (!p.contestId || !p.index) {
        setErrorMsg(`Problem #${idx + 1} requires a valid Contest ID and Index.`);
        return;
      }
    }

    const payload = {
      name: form.title.trim(),
      description: form.description.trim(),
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      problems: form.problems.map((p, i) => ({
        name: p.title.trim() || `Problem ${String.fromCharCode(65 + i)}`,
        contestId: parseInt(p.contestId, 10),
        index: p.index.trim().toUpperCase(),
        points: parseInt(p.points || 100, 10),
        rating: p.rating ? parseInt(p.rating, 10) : undefined,
      })),
    };

    try {
      setSaving(true);
      await api.post('/practice-rooms', payload);
      navigate('/practice-rooms');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create practice room');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <Link
        to="/practice-rooms"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Practice Rooms</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Swords className="w-8 h-8 text-indigo-400" />
            Create Virtual Practice Room
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Host timed contests with custom problem sets and live peer scoreboards.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-sm text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Room Info & Schedule
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Contest Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Saturday Speed Round #4"
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
              placeholder="Contest rules, difficulty targets, or format details..."
              className="w-full glass-input rounded-xl py-2 px-3 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full glass-input rounded-xl py-2 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full glass-input rounded-xl py-2 px-3 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Contest Problems */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Contest Problem Set ({form.problems.length})
            </h3>
            <button
              type="button"
              onClick={handleAddProblem}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
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
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Problem {String.fromCharCode(65 + idx)}
                  </span>
                  {form.problems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProblem(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove"
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
                      value={p.title}
                      onChange={(e) => handleProblemChange(idx, 'title', e.target.value)}
                      placeholder="e.g. Theatre Square"
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
                      placeholder="e.g. 1"
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
                      className="w-full glass-input rounded-xl py-1.5 px-3 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Score Points
                    </label>
                    <input
                      type="number"
                      value={p.points}
                      onChange={(e) => handleProblemChange(idx, 'points', e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full glass-input rounded-xl py-1.5 px-3 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Target Rating
                    </label>
                    <input
                      type="number"
                      value={p.rating}
                      onChange={(e) => handleProblemChange(idx, 'rating', e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full glass-input rounded-xl py-1.5 px-3 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Link to="/practice-rooms" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Creating Room...' : 'Publish Room'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

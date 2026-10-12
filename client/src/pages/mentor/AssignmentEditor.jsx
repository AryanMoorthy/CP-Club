import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  CalendarCheck2,
  ArrowLeft,
  Save,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function AssignmentEditor() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    sheetId: '',
    deadline: '',
    passPercentage: 70,
  });

  useEffect(() => {
    const fetchSheets = async () => {
      try {
        setLoading(true);
        const res = await api.get('/problem-sheets');
        if (res.success && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.sheets || []);
          setSheets(list);
          if (list.length > 0) {
            setForm((prev) => ({ ...prev, sheetId: list[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch sheets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSheets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.deadline || !form.sheetId) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    // Grab selected sheet problems
    const selectedSheet = sheets.find((s) => s._id === form.sheetId);
    const problems = (selectedSheet?.problems || []).map((p) => ({
      title: p.title,
      contestId: p.contestId,
      index: p.index,
      points: 100,
    }));

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      sheetId: form.sheetId,
      deadline: new Date(form.deadline).toISOString(),
      passPercentage: parseInt(form.passPercentage, 10),
      problems,
    };

    try {
      setSaving(true);
      setErrorMsg('');
      await api.post('/assignments', payload);
      navigate('/assignments');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading sheet options..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-12">
      <Link
        to="/assignments"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-cyan-400" />
            Create Assignment
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Assign problem sheets to club students with strict deadlines and pass thresholds.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-sm text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Assignment Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Week 3: Binary Search Practice"
            required
            className="w-full glass-input rounded-xl py-2 px-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select Problem Sheet *
          </label>
          <select
            value={form.sheetId}
            onChange={(e) => setForm({ ...form, sheetId: e.target.value })}
            required
            className="w-full glass-input rounded-xl py-2 px-3 text-sm bg-dark-900"
          >
            {sheets.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title} ({s.problems?.length || 0} problems) - {s.difficulty}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Deadline Date & Time *
            </label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              required
              className="w-full glass-input rounded-xl py-2 px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Pass Percentage (%)
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={form.passPercentage}
              onChange={(e) => setForm({ ...form, passPercentage: e.target.value })}
              required
              className="w-full glass-input rounded-xl py-2 px-3 text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Instructions / Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="State any specific constraints or tips for the students..."
            className="w-full glass-input rounded-xl py-2 px-3 text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Link to="/assignments" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Creating...' : 'Create Assignment'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

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
  Users,
} from 'lucide-react';

export default function AssignmentEditor() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    instructions: '',
    problemSheet: '',
    assignedTo: '',
    dueDate: '',
    batch: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sheetsRes, studentsRes] = await Promise.allSettled([
          api.get('/problem-sheets'),
          api.get('/users/students'),
        ]);

        if (sheetsRes.status === 'fulfilled' && sheetsRes.value.success) {
          const list = Array.isArray(sheetsRes.value.data)
            ? sheetsRes.value.data
            : (sheetsRes.value.data?.sheets || []);
          setSheets(list);
          if (list.length > 0) {
            setForm((prev) => ({ ...prev, problemSheet: list[0]._id }));
          }
        }

        if (studentsRes.status === 'fulfilled' && studentsRes.value.success) {
          const list = Array.isArray(studentsRes.value.data)
            ? studentsRes.value.data
            : (studentsRes.value.data?.users || studentsRes.value.data?.students || []);
          setStudents(list);
          if (list.length > 0) {
            setForm((prev) => ({ ...prev, assignedTo: list[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.problemSheet) {
      setErrorMsg('Please select a problem sheet.');
      return;
    }
    if (!form.assignedTo) {
      setErrorMsg('Please select a student to assign to.');
      return;
    }
    if (!form.dueDate) {
      setErrorMsg('Please set a deadline.');
      return;
    }

    const payload = {
      problemSheet: form.problemSheet,
      assignedTo: form.assignedTo,
      dueDate: new Date(form.dueDate).toISOString(),
      instructions: form.instructions.trim(),
      batch: form.batch.trim(),
    };

    try {
      setSaving(true);
      await api.post('/assignments', payload);
      navigate('/assignments');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading options..." />;
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

      <form onSubmit={handleSubmit} noValidate className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">

        {/* Problem Sheet */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select Problem Sheet *
          </label>
          {sheets.length === 0 ? (
            <p className="text-xs text-rose-400">No published sheets available. Publish a sheet first.</p>
          ) : (
            <select
              value={form.problemSheet}
              onChange={(e) => setForm({ ...form, problemSheet: e.target.value })}
              className="w-full glass-input rounded-xl py-2 px-3 text-sm bg-dark-900"
            >
              {sheets.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title} ({s.problems?.length || 0} problems) - {s.difficulty}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Assign To Student */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Assign To Student *
          </label>
          {students.length === 0 ? (
            <p className="text-xs text-slate-500">No students found.</p>
          ) : (
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="w-full glass-input rounded-xl py-2 px-3 text-sm bg-dark-900"
            >
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.codeforcesHandle ? `(@${s.codeforcesHandle})` : `— ${s.email}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Deadline Date &amp; Time *
            </label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full glass-input rounded-xl py-2 px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Batch / Group Label
            </label>
            <input
              type="text"
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
              placeholder="e.g. Batch A, October Cohort"
              className="w-full glass-input rounded-xl py-2 px-3 text-sm"
            />
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Instructions / Description
          </label>
          <textarea
            rows={3}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            placeholder="State any specific constraints or tips for the student..."
            className="w-full glass-input rounded-xl py-2 px-3 text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Link to="/assignments" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || sheets.length === 0 || students.length === 0}
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

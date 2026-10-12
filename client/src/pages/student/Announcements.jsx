import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import {
  Megaphone,
  Pin,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  Tag,
} from 'lucide-react';

export default function Announcements() {
  const { isMentor } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    isPinned: false,
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.announcements || []);
        setAnnouncements(list);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/announcements', form);
      if (res.success) {
        setModalOpen(false);
        setForm({ title: '', content: '', category: 'general', isPinned: false });
        fetchAnnouncements();
      }
    } catch (err) {
      alert(`Error creating announcement: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-amber-400" />
            Club Announcements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Important updates, contest notifications, and club schedules.
          </p>
        </div>

        {isMentor && (
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-xs font-semibold self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching announcements..." />
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isPinned = ann.isPinned;

            return (
              <div
                key={ann._id}
                className={`glass-card p-6 rounded-2xl border transition shadow-lg ${
                  isPinned
                    ? 'border-amber-500/40 bg-gradient-to-r from-amber-500/5 via-dark-900 to-dark-900'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <Pin className="w-3 h-3 fill-current" />
                        PINNED
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {ann.category || 'General'}
                    </span>
                    <h3 className="text-base font-bold text-white">{ann.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                    {isMentor && (
                      <button
                        onClick={() => handleDelete(ann._id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {ann.content}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Posted by: {ann.author?.name || 'Club Mentor'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No announcements posted"
          description="Everything is quiet for now. Check back soon for updates."
          icon={Megaphone}
        />
      )}

      {/* Mentor Announcement Creation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post Club Announcement"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. ICPC Regionals Mock Contest"
              required
              className="w-full glass-input rounded-xl py-2 px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full glass-input rounded-xl py-2 px-3 text-sm bg-dark-900"
            >
              <option value="general">General</option>
              <option value="contest">Contest</option>
              <option value="workshop">Workshop</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Announcement Content
            </label>
            <textarea
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Provide details about the schedule, requirements or links..."
              required
              className="w-full glass-input rounded-xl py-2 px-3 text-sm resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              className="rounded bg-dark-900 border-slate-700 text-brand-primary"
            />
            <label htmlFor="isPinned" className="text-xs text-slate-300">
              Pin to top of announcements
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Publish
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

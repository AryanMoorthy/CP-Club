import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import {
  Megaphone,
  Pin,
  Calendar,
  Plus,
  Trash2,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'contest', label: 'Contests' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'deadline', label: 'Deadlines' },
];

export default function Announcements() {
  const { isMentor } = useAuth();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      setSubmitting(true);
      const res = await api.post('/announcements', form);
      if (res.success) {
        setModalOpen(false);
        setForm({ title: '', content: '', category: 'general', isPinned: false });
        toast.success('Announcement published successfully');
        fetchAnnouncements();
      }
    } catch (err) {
      toast.error(`Error creating announcement: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement removed');
      fetchAnnouncements();
    } catch (err) {
      toast.error(`Delete error: ${err.message}`);
    }
  };

  const filtered = announcements.filter((ann) => {
    if (categoryFilter === 'all') return true;
    return (ann.category || 'general').toLowerCase() === categoryFilter;
  });

  // Sort pinned first, then by date descending
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const getCategoryBadge = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'contest':  return 'badge badge-rose';
      case 'workshop': return 'badge badge-cyan';
      case 'deadline': return 'badge badge-amber';
      default:         return 'badge badge-indigo';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Club Announcements"
        subtitle="Official communications, contest alerts, and schedule changes from mentors."
        icon={Megaphone}
        iconColor="text-amber-400"
        actions={
          isMentor && (
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Announcement</span>
            </button>
          )
        }
      />

      {/* Category filters */}
      <div className="tab-bar self-start">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`tab-item ${categoryFilter === cat.id ? 'active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton.Card />
          <Skeleton.Card />
          <Skeleton.Card />
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-3.5">
          {sorted.map((ann) => {
            const isPinned = ann.isPinned;

            return (
              <div
                key={ann._id}
                className={`glass-card p-5 transition hover:border-slate-700 ${
                  isPinned ? 'border-amber-500/30 bg-amber-500/5' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {isPinned && (
                      <span className="badge badge-amber flex items-center gap-1 font-mono text-[10px]">
                        <Pin className="w-3 h-3 fill-current" />
                        Pinned
                      </span>
                    )}
                    <span className={getCategoryBadge(ann.category)}>
                      {ann.category || 'General'}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{ann.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono shrink-0">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                    {isMentor && (
                      <button
                        onClick={() => handleDelete(ann._id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {ann.content}
                </p>

                <div className="mt-3.5 pt-3 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-500">
                  <span>Author: {ann.author?.name || 'Club Mentor'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No announcements found"
          description="Everything is currently quiet. Updates and contest alerts will be posted here."
          icon={Megaphone}
        />
      )}

      {/* Mentor Announcement Creation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publish Club Announcement"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. ICPC Regional Mock Contest Schedule"
              required
              className="input-field py-1.5 text-xs w-full"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-field py-1.5 text-xs w-full"
            >
              <option value="general" className="bg-[#0b0f19]">General</option>
              <option value="contest" className="bg-[#0b0f19]">Contest</option>
              <option value="workshop" className="bg-[#0b0f19]">Workshop</option>
              <option value="deadline" className="bg-[#0b0f19]">Deadline</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Content
            </label>
            <textarea
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Detailed announcement markdown or instructions..."
              required
              className="input-field py-2 text-xs w-full resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPinned"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-indigo-500"
            />
            <label htmlFor="isPinned" className="text-xs text-slate-300">
              Pin announcement to the top
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-1.5 px-3 text-xs"
            >
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RoleBadge from '../../components/RoleBadge';
import RatingBadge from '../../components/RatingBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ShieldAlert,
  Search,
  UserCheck,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
} from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.users || []);
        setUsers(list);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUserId(userId);
      const res = await api.patch(`/users/${userId}/role`, { role: newRole });
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      alert(`Role change failed: ${err.message}`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.codeforcesHandle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-rose-400" />
            Admin Control Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage club member roles, permissions, and directory.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full glass-input rounded-xl py-2 pl-10 pr-4 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading member directory..." />
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-900/80 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Codeforces</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const isUpdating = updatingUserId === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white leading-tight">{u.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Joined: {new Date(u.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        {u.codeforcesHandle ? (
                          <a
                            href={`https://codeforces.com/profile/${u.codeforcesHandle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-accent hover:underline inline-flex items-center gap-1"
                          >
                            @{u.codeforcesHandle}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <RatingBadge rating={u.codeforcesProfile?.rating || 0} size="xs" />
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="glass-input rounded-lg py-1 px-2 text-xs bg-dark-900 border-slate-700 font-semibold"
                        >
                          <option value="student">Student</option>
                          <option value="mentor">Mentor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

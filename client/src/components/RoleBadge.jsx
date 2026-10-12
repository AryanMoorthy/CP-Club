import React from 'react';
import { Shield, Sparkles, UserCheck } from 'lucide-react';

export default function RoleBadge({ role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    );
  }
  if (role === 'mentor') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Sparkles className="w-3 h-3" />
        Mentor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
      <UserCheck className="w-3 h-3" />
      Student
    </span>
  );
}

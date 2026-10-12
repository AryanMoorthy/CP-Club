/**
 * Codeforces rank configuration and rating ranges
 */
export const CF_RANKS = {
  UNRATED: { name: 'Unrated', min: 0, max: 0, color: '#94a3b8', bg: 'bg-slate-800/80', text: 'text-slate-400' },
  NEWBIE: { name: 'Newbie', min: 1, max: 1199, color: '#9ca3af', bg: 'bg-gray-800/60', text: 'text-gray-400' },
  PUPIL: { name: 'Pupil', min: 1200, max: 1399, color: '#22c55e', bg: 'bg-emerald-950/60', text: 'text-emerald-400' },
  SPECIALIST: { name: 'Specialist', min: 1400, max: 1599, color: '#06b6d4', bg: 'bg-cyan-950/60', text: 'text-cyan-400' },
  EXPERT: { name: 'Expert', min: 1600, max: 1899, color: '#3b82f6', bg: 'bg-blue-950/60', text: 'text-blue-400' },
  CANDIDATE_MASTER: { name: 'Candidate Master', min: 1900, max: 2199, color: '#a855f7', bg: 'bg-purple-950/60', text: 'text-purple-400' },
  MASTER: { name: 'Master', min: 2200, max: 2299, color: '#f59e0b', bg: 'bg-amber-950/60', text: 'text-amber-400' },
  INTERNATIONAL_MASTER: { name: 'International Master', min: 2300, max: 2399, color: '#f97316', bg: 'bg-orange-950/60', text: 'text-orange-400' },
  GRANDMASTER: { name: 'Grandmaster', min: 2400, max: 2599, color: '#ef4444', bg: 'bg-red-950/60', text: 'text-red-400' },
  INTERNATIONAL_GRANDMASTER: { name: 'International Grandmaster', min: 2600, max: 2999, color: '#dc2626', bg: 'bg-rose-950/60', text: 'text-rose-400' },
  LEGENDARY_GRANDMASTER: { name: 'Legendary Grandmaster', min: 3000, max: 9999, color: '#b91c1c', bg: 'bg-red-950/80', text: 'text-red-500' },
};

export function getRankByRating(rating) {
  if (!rating || rating <= 0) return CF_RANKS.UNRATED;
  if (rating < 1200) return CF_RANKS.NEWBIE;
  if (rating < 1400) return CF_RANKS.PUPIL;
  if (rating < 1600) return CF_RANKS.SPECIALIST;
  if (rating < 1900) return CF_RANKS.EXPERT;
  if (rating < 2200) return CF_RANKS.CANDIDATE_MASTER;
  if (rating < 2300) return CF_RANKS.MASTER;
  if (rating < 2400) return CF_RANKS.INTERNATIONAL_MASTER;
  if (rating < 2600) return CF_RANKS.GRANDMASTER;
  if (rating < 3000) return CF_RANKS.INTERNATIONAL_GRANDMASTER;
  return CF_RANKS.LEGENDARY_GRANDMASTER;
}

export function formatCodeforcesProblemUrl(contestId, index) {
  return `https://codeforces.com/problemset/problem/${contestId}/${index}`;
}

export function formatCodeforcesProfileUrl(handle) {
  return `https://codeforces.com/profile/${handle}`;
}

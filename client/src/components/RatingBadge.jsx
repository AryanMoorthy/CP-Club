import React from 'react';
import { getRankByRating } from '../utils/cfColors';

export default function RatingBadge({ rating, size = 'sm', showRank = true }) {
  const rank = getRankByRating(rating);

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5 font-semibold',
    lg: 'text-base px-4 py-2 font-bold',
  }[size] || 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-current/20 font-mono ${rank.bg} ${rank.text} ${sizeClasses}`}
      style={{ borderColor: `${rank.color}33` }}
      title={rank.name}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: rank.color }}
      />
      <span>{rating > 0 ? rating : 'Unrated'}</span>
      {showRank && (
        <span className="opacity-80 font-sans text-[0.85em] font-normal">
          • {rank.name}
        </span>
      )}
    </span>
  );
}

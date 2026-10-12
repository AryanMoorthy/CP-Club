import React from 'react';

/**
 * SkeletonLoader — lightweight placeholder for async content.
 * Usage:
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton.Card lines={3} />
 *   <Skeleton.Table rows={5} cols={4} />
 */
export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

Skeleton.Text = function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
};

Skeleton.Card = function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card p-5 space-y-3 ${className}`} aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-6 w-6 rounded-full" />
      </div>
      <div className="skeleton h-7 w-16" />
      <div className="skeleton h-3 w-28" />
    </div>
  );
};

Skeleton.Table = function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="table-container" aria-hidden="true">
      <div className="bg-[#07090e] border-b border-[#1e293b] px-4 py-3 flex gap-8">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-8 px-4 py-3.5 border-b border-[#111827] last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="skeleton h-4"
              style={{ width: c === 0 ? '2rem' : c === 1 ? '8rem' : '5rem' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

Skeleton.List = function SkeletonList({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-4 w-16" />
          </div>
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
};

Skeleton.Grid = function SkeletonGrid({ cards = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(cards, 4)} gap-4 ${className}`} aria-hidden="true">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton.Card key={i} />
      ))}
    </div>
  );
};

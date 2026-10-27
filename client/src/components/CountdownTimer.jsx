import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ targetDate, onExpire, label = 'Time Left' }) {
  const calculateTimeLeft = () => {
    if (!targetDate) return null;
    const targetMs = new Date(targetDate).getTime();
    if (isNaN(targetMs)) return null;

    const diff = targetMs - Date.now();
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, total: diff };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <Clock className="w-3.5 h-3.5" />
        Expired
      </span>
    );
  }

  const isUrgent = timeLeft.total < 1000 * 60 * 60 * 2; // less than 2 hours

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border font-mono text-xs ${
        isUrgent
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 animate-pulse'
          : 'bg-dark-900 border-slate-700/60 text-slate-300'
      }`}
    >
      <Clock className="w-3.5 h-3.5 text-brand-primary" />
      {label && <span className="font-sans text-slate-400">{label}:</span>}
      <span className="font-semibold">
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RatingBadge from '../../components/RatingBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Users,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Trophy,
  RefreshCw,
} from 'lucide-react';

export default function DailySolvesCalendar() {
  const { user, syncCodeforces, isSyncingCF } = useAuth();
  const toast = useToast();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));

  const [calendarData, setCalendarData] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  const [dayDetails, setDayDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Fetch month summary
  const fetchMonthCalendar = async (year, month) => {
    try {
      setLoadingCalendar(true);
      const res = await api.get(`/leaderboard/daily-calendar?year=${year}&month=${month}`);
      if (res.success && res.data?.days) {
        setCalendarData(res.data.days);
      } else {
        setCalendarData([]);
      }
    } catch (err) {
      console.error('Failed to load daily calendar summary:', err);
      setCalendarData([]);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Fetch specific date solves
  const fetchDaySolves = async (dateStr) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/leaderboard/daily-solves?date=${dateStr}`);
      if (res.success && res.data) {
        setDayDetails(res.data);
      } else {
        setDayDetails(null);
      }
    } catch (err) {
      console.error('Failed to load day details:', err);
      setDayDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSyncNow = async () => {
    if (!user?.codeforcesHandle) {
      toast.info('Please connect your Codeforces handle in your profile first.');
      return;
    }
    const res = await syncCodeforces();
    if (res.success) {
      toast.success('Codeforces submissions synced!');
      await Promise.all([
        fetchMonthCalendar(currentYear, currentMonth),
        selectedDate ? fetchDaySolves(selectedDate) : Promise.resolve(),
      ]);
    } else {
      toast.error(res.error || 'Sync failed');
    }
  };

  useEffect(() => {
    fetchMonthCalendar(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      fetchDaySolves(selectedDate);
    }
  }, [selectedDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Days matrix computation for month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sun

  // Map of date string -> stats
  const dateMap = new Map();
  calendarData.forEach((d) => {
    dateMap.set(d.date, d);
  });

  const calendarDays = [];
  // Empty slots for leading padding
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const padMonth = String(currentMonth).padStart(2, '0');
    const padDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${padMonth}-${padDay}`;
    const stats = dateMap.get(dateStr) || { totalSolves: 0, activeUsersCount: 0 };
    calendarDays.push({ day, dateStr, ...stats });
  }

  // Monthly stats
  const totalMonthSolves = calendarData.reduce((acc, curr) => acc + (curr.totalSolves || 0), 0);
  const activeDaysCount = calendarData.filter((d) => (d.totalSolves || 0) > 0).length;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-brand-primary" />
            <span>Daily Solves Calendar</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily Codeforces solves across all club members. Click any day to see who solved what.
          </p>
        </div>

        {/* Month Summary Stats & Actions */}
        <div className="flex items-center gap-3">
          {user?.codeforcesHandle && (
            <button
              onClick={handleSyncNow}
              disabled={isSyncingCF}
              className="btn-secondary text-xs flex items-center gap-2 h-10 px-3.5"
              title="Sync your latest Codeforces submissions right now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
              <span>{isSyncingCF ? 'Syncing…' : 'Sync My Solves'}</span>
            </button>
          )}
          <div className="glass-card px-4 py-2 rounded-xl border border-slate-800 text-center">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Month Solves</p>
            <p className="text-lg font-black text-brand-accent">{totalMonthSolves}</p>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl border border-slate-800 text-center">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Days</p>
            <p className="text-lg font-black text-emerald-400">{activeDaysCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Section (7 Cols on desktop) */}
        <div className="lg:col-span-7 glass-card p-6 sm:p-7 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{monthNames[currentMonth - 1]}</span>
                <span className="text-slate-400 font-mono">{currentYear}</span>
              </h2>

              <div className="flex items-center gap-1.5 bg-dark-900 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentYear(today.getFullYear());
                    setCurrentMonth(today.getMonth() + 1);
                    setSelectedDate(today.toISOString().slice(0, 10));
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Day Cells Grid */}
            {loadingCalendar ? (
              <div className="py-24">
                <LoadingSpinner text="Rendering calendar..." />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="h-16 rounded-xl bg-transparent" />;
                  }

                  const isSelected = selectedDate === cell.dateStr;
                  const isCurrentDay = cell.dateStr === today.toISOString().slice(0, 10);
                  const hasSolves = cell.totalSolves > 0;

                  // Dynamic color intensity based on solve count
                  let solveBadgeClass = 'bg-slate-850/60 text-slate-500';
                  if (cell.totalSolves >= 8) {
                    solveBadgeClass = 'bg-brand-primary text-white shadow-glow-primary';
                  } else if (cell.totalSolves >= 4) {
                    solveBadgeClass = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
                  } else if (cell.totalSolves > 0) {
                    solveBadgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                  }

                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setSelectedDate(cell.dateStr)}
                      className={`h-16 p-2 rounded-xl flex flex-col justify-between text-left transition-all relative group border ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary/50 shadow-lg'
                          : isCurrentDay
                          ? 'border-indigo-500/60 bg-dark-900/90'
                          : hasSolves
                          ? 'border-slate-800 bg-dark-900/60 hover:border-slate-700 hover:bg-slate-850/60'
                          : 'border-slate-850 bg-dark-950/40 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-semibold font-mono ${
                            isSelected
                              ? 'text-white'
                              : isCurrentDay
                              ? 'text-brand-accent font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          {cell.day}
                        </span>

                        {isCurrentDay && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
                        )}
                      </div>

                      {hasSolves ? (
                        <div className="flex items-center justify-between w-full mt-1">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${solveBadgeClass}`}
                          >
                            {cell.totalSolves}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {cell.activeUsersCount}u
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-700 font-mono">-</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-400">Activity Level:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-dark-950 border border-slate-800" />
                <span>0 solves</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
                <span>1-3 solves</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500/30" />
                <span>4-7 solves</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-brand-primary" />
                <span>8+ solves</span>
              </span>
            </div>
          </div>
        </div>

        {/* Day Details Pane (5 Cols on desktop) */}
        <div className="lg:col-span-5 glass-card p-6 sm:p-7 rounded-2xl border border-slate-800 shadow-xl flex flex-col">
          {/* Day Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Solves for
              </span>
              <h3 className="text-lg font-extrabold text-white mt-0.5">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </h3>
            </div>

            {dayDetails && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-brand-primary/20 text-brand-accent text-xs font-mono font-semibold border border-brand-primary/30">
                  {dayDetails.totalSolves} Solves
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/30">
                  {dayDetails.totalUsers} Students
                </span>
              </div>
            )}
          </div>

          {/* User Solves List */}
          <div className="flex-1 mt-4 overflow-y-auto max-h-[560px] pr-1 space-y-4">
            {loadingDetails ? (
              <div className="py-20">
                <LoadingSpinner text="Loading user solves..." />
              </div>
            ) : dayDetails && dayDetails.users?.length > 0 ? (
              dayDetails.users.map(({ user, solves }) => (
                <div
                  key={user._id}
                  className="p-4 rounded-xl bg-dark-900/80 border border-slate-800/90 space-y-3"
                >
                  {/* User Profile row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        {user.codeforcesHandle && (
                          <a
                            href={`https://codeforces.com/profile/${user.codeforcesHandle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-accent hover:underline flex items-center gap-1 font-mono truncate"
                          >
                            <span>{user.codeforcesHandle}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user.codeforcesProfile?.rating && (
                        <RatingBadge rating={user.codeforcesProfile.rating} size="xs" />
                      )}
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {solves.length} solved
                      </span>
                    </div>
                  </div>

                  {/* Problems solved by user on this day */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60 font-mono text-xs">
                    {solves.map((prob) => {
                      const cfUrl = `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.problemIndex}`;
                      return (
                        <div
                          key={prob.key}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-dark-950/60 hover:bg-slate-800/40 transition group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <a
                              href={cfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-sans text-xs text-slate-300 group-hover:text-white hover:underline truncate"
                            >
                              {prob.problemName}
                            </a>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {prob.rating && (
                              <RatingBadge rating={prob.rating} size="xs" showRank={false} />
                            )}
                            <a
                              href={cfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-brand-accent font-semibold hover:underline"
                            >
                              {prob.contestId}{prob.problemIndex}
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center flex flex-col items-center">
                <EmptyState
                  title="No solves recorded on this date"
                  description={
                    selectedDate === today.toISOString().slice(0, 10)
                      ? "Solved problems today on Codeforces? Click 'Sync My Solves' to update immediately or wait for the automatic midnight sync."
                      : "No members had verified Codeforces submissions on this day."
                  }
                  icon={CalendarIcon}
                  action={
                    selectedDate === today.toISOString().slice(0, 10) && user?.codeforcesHandle ? (
                      <button
                        onClick={handleSyncNow}
                        disabled={isSyncingCF}
                        className="btn-primary text-xs mt-3 flex items-center gap-2"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCF ? 'animate-spin' : ''}`} />
                        <span>{isSyncingCF ? 'Syncing…' : 'Sync My Solves Now'}</span>
                      </button>
                    ) : null
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

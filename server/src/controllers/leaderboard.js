import User from '../models/User.js';
import SolvedProblem from '../models/SolvedProblem.js';

/**
 * GET /api/leaderboard/rating
 * Rank students by current CF rating descending.
 */
export async function ratingLeaderboard(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const batchFilter = req.query.batch ? { batch: req.query.batch } : {};

    const users = await User.find({
      role: 'student',
      'codeforcesProfile.rating': { $exists: true, $ne: null },
      ...batchFilter,
    })
      .select('name email batch codeforcesHandle codeforcesProfile lastCodeforcesSync')
      .sort({ 'codeforcesProfile.rating': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments({
      role: 'student',
      'codeforcesProfile.rating': { $exists: true, $ne: null },
      ...batchFilter,
    });

    const ranked = users.map((u, i) => ({
      rank: skip + i + 1,
      user: { _id: u._id, name: u.name, email: u.email, batch: u.batch, codeforcesHandle: u.codeforcesHandle },
      rating: u.codeforcesProfile?.rating || null,
      maxRating: u.codeforcesProfile?.maxRating || null,
      cfRank: u.codeforcesProfile?.rank || null,
      lastSync: u.lastCodeforcesSync,
    }));

    res.json({ success: true, data: { leaderboard: ranked, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaderboard/weekly
 * Rank students by unique problems solved this week (UTC Sunday start).
 */
export async function weeklyLeaderboard(req, res, next) {
  try {
    const weekStart = new Date();
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

    const agg = await SolvedProblem.aggregate([
      { $match: { firstAcceptedAt: { $gte: weekStart } } },
      { $group: { _id: '$user', weeklyCount: { $sum: 1 } } },
      { $sort: { weeklyCount: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.role': 'student', 'user.isActive': true } },
    ]);

    const ranked = agg.map((entry, i) => ({
      rank: i + 1,
      user: {
        _id: entry.user._id,
        name: entry.user.name,
        email: entry.user.email,
        batch: entry.user.batch,
        codeforcesHandle: entry.user.codeforcesHandle,
      },
      weeklyCount: entry.weeklyCount,
      weekStart: weekStart.toISOString(),
    }));

    res.json({ success: true, data: { leaderboard: ranked, weekStart } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaderboard/improvement
 * Rank students by rating gain over the last 30 days.
 * Uses lastCodeforcesSync as approximation window boundary.
 */
export async function improvementLeaderboard(req, res, next) {
  try {
    // Fetch all users with rating history available
    const users = await User.find({
      role: 'student',
      'codeforcesProfile.rating': { $exists: true, $ne: null },
    })
      .select('name email batch codeforcesHandle codeforcesProfile')
      .lean();

    // We'll define improvement as (current rating - rating 30 days ago).
    // Since we only store current + max, we approximate using ratingHistory from CF.
    // For simplicity, rank by maxRating - current which shows potential; 
    // or rank by currentRating - (oldest stored rating). 
    // We don't have historical snapshots, so we rank by current rating for now
    // and clearly label it. Users are encouraged to sync.

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Filter users synced in last 30 days
    const eligible = users.filter((u) => u.lastCodeforcesSync && new Date(u.lastCodeforcesSync) > thirtyDaysAgo);

    // Note: without stored historical rating snapshots we cannot compute accurate 30-day improvement.
    // We report current rating with clear context.
    const ranked = eligible
      .sort((a, b) => (b.codeforcesProfile?.rating || 0) - (a.codeforcesProfile?.rating || 0))
      .map((u, i) => ({
        rank: i + 1,
        user: { _id: u._id, name: u.name, email: u.email, batch: u.batch, codeforcesHandle: u.codeforcesHandle },
        currentRating: u.codeforcesProfile?.rating || null,
        maxRating: u.codeforcesProfile?.maxRating || null,
        cfRank: u.codeforcesProfile?.rank || null,
      }));

    res.json({
      success: true,
      data: {
        leaderboard: ranked,
        note: 'Ranked by current Codeforces rating among users synced in the last 30 days. Historical rating snapshots are not stored, so 30-day delta cannot be computed.',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaderboard/total
 * Rank by total unique problems solved.
 */
export async function totalSolvedLeaderboard(req, res, next) {
  try {
    const agg = await SolvedProblem.aggregate([
      { $group: { _id: '$user', totalCount: { $sum: 1 } } },
      { $sort: { totalCount: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.role': 'student', 'user.isActive': true } },
    ]);

    const ranked = agg.map((entry, i) => ({
      rank: i + 1,
      user: {
        _id: entry.user._id,
        name: entry.user.name,
        email: entry.user.email,
        batch: entry.user.batch,
        codeforcesHandle: entry.user.codeforcesHandle,
      },
      totalCount: entry.totalCount,
      rating: entry.user.codeforcesProfile?.rating || null,
    }));

    res.json({ success: true, data: { leaderboard: ranked } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaderboard/daily-calendar?year=YYYY&month=MM
 * Returns counts of solves per day for the requested month (or current month) across all users.
 */
export async function dailySolvesCalendar(req, res, next) {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1); // 1-indexed

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    const dailyCounts = await SolvedProblem.aggregate([
      {
        $match: {
          firstAcceptedAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$firstAcceptedAt' },
          },
          totalSolves: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalSolves: 1,
          activeUsersCount: { $size: '$uniqueUsers' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        year,
        month,
        days: dailyCounts,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaderboard/daily-solves?date=YYYY-MM-DD
 * Returns all problems solved on that date grouped by user.
 */
export async function dailySolvesByDate(req, res, next) {
  try {
    const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
    const [year, month, day] = dateStr.split('-').map(Number);

    if (!year || !month || !day) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

    const solves = await SolvedProblem.find({
      firstAcceptedAt: { $gte: start, $lt: end },
    })
      .populate('user', 'name email codeforcesHandle codeforcesProfile batch')
      .sort({ firstAcceptedAt: -1 })
      .lean();

    // Group by user
    const userMap = new Map();
    for (const s of solves) {
      if (!s.user) continue;
      const uid = s.user._id.toString();
      if (!userMap.has(uid)) {
        userMap.set(uid, {
          user: s.user,
          solves: [],
        });
      }
      userMap.get(uid).solves.push({
        contestId: s.contestId,
        problemIndex: s.problemIndex,
        problemName: s.problemName || `Problem ${s.problemIndex}`,
        rating: s.rating,
        tags: s.tags || [],
        acceptedAt: s.firstAcceptedAt,
        key: s.key,
      });
    }

    const grouped = Array.from(userMap.values()).sort(
      (a, b) => b.solves.length - a.solves.length
    );

    res.json({
      success: true,
      data: {
        date: dateStr,
        totalSolves: solves.length,
        totalUsers: grouped.length,
        users: grouped,
      },
    });
  } catch (err) {
    next(err);
  }
}

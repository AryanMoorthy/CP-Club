import User from '../models/User.js';
import SolvedProblem from '../models/SolvedProblem.js';
import {
  getUserInfo,
  getUserRating,
  getUserSubmissions,
  extractSolvedProblems,
} from '../services/codeforces.js';
import { updateProfileSchema, connectCodeforcesSchema } from '../validators/schemas.js';

export async function getMe(req, res) {
  const user = await User.findById(req.user._id).lean();
  res.json({ success: true, data: { user } });
}

export async function updateMe(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: data },
      { new: true, runValidators: true }
    ).select('-passwordHash').lean();

    res.json({ success: true, data: { user: updated } });
  } catch (err) {
    next(err);
  }
}

export async function connectCodeforces(req, res, next) {
  try {
    const { handle } = connectCodeforcesSchema.parse(req.body);

    // Check handle is not taken by another user
    const existing = await User.findOne({
      codeforcesHandle: handle,
      _id: { $ne: req.user._id },
    }).lean();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This Codeforces handle is already connected to another account',
      });
    }

    // Validate handle via CF API
    let cfProfile;
    try {
      cfProfile = await getUserInfo(handle);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: `Codeforces handle not found: ${err.message}`,
      });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          codeforcesHandle: cfProfile.handle,
          codeforcesProfile: {
            handle: cfProfile.handle,
            rating: cfProfile.rating || null,
            maxRating: cfProfile.maxRating || null,
            rank: cfProfile.rank || null,
            maxRank: cfProfile.maxRank || null,
            avatar: cfProfile.avatar || null,
            titlePhoto: cfProfile.titlePhoto || null,
            country: cfProfile.country || null,
            organization: cfProfile.organization || null,
            contribution: cfProfile.contribution || 0,
            friendOfCount: cfProfile.friendOfCount || 0,
            registrationTimeSeconds: cfProfile.registrationTimeSeconds || null,
          },
          lastCodeforcesSync: new Date(),
        },
      },
      { new: true }
    ).select('-passwordHash').lean();

    res.json({
      success: true,
      message: 'Codeforces account connected successfully',
      data: { user: updated },
    });
  } catch (err) {
    next(err);
  }
}

export async function syncCodeforces(req, res, next) {
  try {
    const user = await User.findById(req.user._id).lean();

    if (!user.codeforcesHandle) {
      return res.status(400).json({
        success: false,
        message: 'No Codeforces handle connected. Please connect first.',
      });
    }

    // Rate-limit: don't sync if synced within last 5 minutes
    if (user.lastCodeforcesSync) {
      const sinceSync = Date.now() - new Date(user.lastCodeforcesSync).getTime();
      if (sinceSync < 5 * 60 * 1000) {
        return res.status(429).json({
          success: false,
          message: 'Please wait at least 5 minutes between syncs',
          lastSync: user.lastCodeforcesSync,
        });
      }
    }

    const handle = user.codeforcesHandle;

    // Fetch profile + rating + submissions in parallel
    let cfProfile, ratingHistory, submissions;
    try {
      [cfProfile, ratingHistory, submissions] = await Promise.all([
        getUserInfo(handle),
        getUserRating(handle),
        getUserSubmissions(handle),
      ]);
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: `Codeforces API error: ${err.message}`,
        lastSync: user.lastCodeforcesSync,
      });
    }

    // Extract solved problems
    const solved = extractSolvedProblems(submissions);

    // Upsert into SolvedProblem collection
    const bulkOps = solved.map((sp) => ({
      updateOne: {
        filter: { user: user._id, key: sp.key },
        update: {
          $setOnInsert: {
            user: user._id,
            contestId: sp.contestId,
            problemIndex: sp.problemIndex,
            problemName: sp.problemName,
            rating: sp.rating,
            tags: sp.tags,
            firstAcceptedAt: sp.firstAcceptedAt,
            key: sp.key,
          },
          $set: { syncedAt: new Date() },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await SolvedProblem.bulkWrite(bulkOps, { ordered: false });
    }

    // Update user profile data
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          'codeforcesProfile.rating': cfProfile.rating || null,
          'codeforcesProfile.maxRating': cfProfile.maxRating || null,
          'codeforcesProfile.rank': cfProfile.rank || null,
          'codeforcesProfile.maxRank': cfProfile.maxRank || null,
          'codeforcesProfile.avatar': cfProfile.avatar || null,
          'codeforcesProfile.titlePhoto': cfProfile.titlePhoto || null,
          lastCodeforcesSync: new Date(),
        },
      },
      { new: true }
    ).select('-passwordHash').lean();

    const totalSolved = await SolvedProblem.countDocuments({ user: user._id });

    res.json({
      success: true,
      message: 'Codeforces data synced successfully',
      data: {
        user: updatedUser,
        stats: {
          totalSolved,
          ratingHistory: ratingHistory.slice(-50), // last 50 contests
          syncedAt: new Date(),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCodeforcesStats(req, res, next) {
  try {
    const user = await User.findById(req.user._id).lean();

    if (!user.codeforcesHandle) {
      return res.json({ success: true, data: { connected: false } });
    }

    const totalSolved = await SolvedProblem.countDocuments({ user: user._id });

    // Weekly solved (UTC week)
    const weekStart = new Date();
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

    const weeklySolved = await SolvedProblem.countDocuments({
      user: user._id,
      firstAcceptedAt: { $gte: weekStart },
    });

    // Get rating history from CF (cached)
    let ratingHistory = [];
    try {
      ratingHistory = await getUserRating(user.codeforcesHandle);
    } catch {
      // use empty if CF is down
    }

    res.json({
      success: true,
      data: {
        connected: true,
        profile: user.codeforcesProfile,
        totalSolved,
        weeklySolved,
        ratingHistory: ratingHistory.slice(-50),
        lastSync: user.lastCodeforcesSync,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMySolvedProblems(req, res, next) {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const solved = await SolvedProblem.find({ user: req.user._id })
      .select('contestId problemIndex key problemName rating tags firstAcceptedAt syncedAt')
      .sort({ firstAcceptedAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, data: solved });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // Don't expose sensitive data of other students
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function getStudents(req, res, next) {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email codeforcesHandle avatar')
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const role = req.query.role;

    const filter = {};
    if (role && ['student', 'mentor', 'admin'].includes(role)) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['student', 'mentor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    ).select('-passwordHash').lean();

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

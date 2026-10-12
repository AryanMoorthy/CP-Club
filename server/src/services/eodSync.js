import User from '../models/User.js';
import SolvedProblem from '../models/SolvedProblem.js';
import {
  getUserInfo,
  getUserRating,
  getUserSubmissions,
  extractSolvedProblems,
} from './codeforces.js';

let cronTimer = null;

/**
 * Sync a single user's Codeforces submissions and profile.
 */
export async function syncSingleUser(user) {
  if (!user || !user.codeforcesHandle) return null;

  const handle = user.codeforcesHandle;

  try {
    const [cfProfile, ratingHistory, submissions] = await Promise.all([
      getUserInfo(handle),
      getUserRating(handle),
      getUserSubmissions(handle),
    ]);

    const solved = extractSolvedProblems(submissions);

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

    await User.findByIdAndUpdate(user._id, {
      $set: {
        'codeforcesProfile.rating': cfProfile.rating || null,
        'codeforcesProfile.maxRating': cfProfile.maxRating || null,
        'codeforcesProfile.rank': cfProfile.rank || null,
        'codeforcesProfile.maxRank': cfProfile.maxRank || null,
        'codeforcesProfile.avatar': cfProfile.avatar || null,
        'codeforcesProfile.titlePhoto': cfProfile.titlePhoto || null,
        lastCodeforcesSync: new Date(),
      },
    });

    return { success: true, count: solved.length };
  } catch (err) {
    console.error(`[EOD Sync] Failed for user ${handle}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Runs EOD sync for all active club members with linked CF handles.
 */
export async function runEODSync() {
  console.log(`\n🌙 [EOD Sync] Starting scheduled midnight sync at ${new Date().toISOString()}...`);

  try {
    const users = await User.find({
      codeforcesHandle: { $exists: true, $ne: '' },
      isActive: true,
    }).lean();

    console.log(`[EOD Sync] Found ${users.length} members with linked Codeforces handles.`);

    let successCount = 0;
    for (const u of users) {
      // Delay 1.5s between CF calls to respect Codeforces API guidelines
      await new Promise((res) => setTimeout(res, 1500));
      const res = await syncSingleUser(u);
      if (res && res.success) successCount++;
    }

    console.log(`✅ [EOD Sync] Finished. Updated ${successCount}/${users.length} members successfully.\n`);
  } catch (err) {
    console.error('❌ [EOD Sync] Error during batch sync:', err);
  }
}

/**
 * Calculates ms until next midnight (00:00:00) and schedules a recurring daily run.
 */
export function scheduleEODSync() {
  function getMsUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Next 00:00:00 local time
    return midnight.getTime() - now.getTime();
  }

  const msUntilMidnight = getMsUntilMidnight();
  const hoursUntil = (msUntilMidnight / (1000 * 60 * 60)).toFixed(2);
  console.log(`🕒 [Scheduler] EOD Sync scheduled to run at midnight (in ${hoursUntil} hours).`);

  cronTimer = setTimeout(async () => {
    await runEODSync();
    // After the first midnight run, trigger every 24 hours
    cronTimer = setInterval(runEODSync, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}

export function stopEODSync() {
  if (cronTimer) {
    clearTimeout(cronTimer);
    clearInterval(cronTimer);
    cronTimer = null;
  }
}

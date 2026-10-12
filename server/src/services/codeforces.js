import axios from 'axios';

const CF_BASE = 'https://codeforces.com/api';
const TIMEOUT_MS = 15000;
const CACHE_TTL_MS = parseInt(process.env.CODEFORCES_CACHE_TTL || '300000'); // 5 min default

// Simple in-memory cache (per process, per key)
const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function cfGet(method, params = {}) {
  const cacheKey = `${method}:${JSON.stringify(params)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url = `${CF_BASE}/${method}`;
  const response = await axios.get(url, { params, timeout: TIMEOUT_MS });

  if (response.data.status !== 'OK') {
    throw new Error(`Codeforces API error: ${response.data.comment || 'Unknown error'}`);
  }

  const result = response.data.result;
  cacheSet(cacheKey, result);
  return result;
}

/**
 * Get user info for a single handle.
 * @returns {object} User info object from CF
 */
export async function getUserInfo(handle) {
  const result = await cfGet('user.info', { handles: handle });
  return result[0];
}

/**
 * Get rating history for a handle.
 * @returns {Array} Array of rating change objects
 */
export async function getUserRating(handle) {
  try {
    return await cfGet('user.rating', { handle });
  } catch (err) {
    // Unrated users return an error — treat as empty
    if (err.message?.includes('not found') || err.message?.includes('rating history')) {
      return [];
    }
    throw err;
  }
}

/**
 * Get all submissions for a handle (up to 10000).
 * NOTE: This is uncached per call to ensure freshness on sync.
 */
export async function getUserSubmissions(handle, count = 10000) {
  const url = `${CF_BASE}/user.status`;
  const response = await axios.get(url, {
    params: { handle, count },
    timeout: TIMEOUT_MS,
  });

  if (response.data.status !== 'OK') {
    throw new Error(`Codeforces API error: ${response.data.comment || 'Unknown error'}`);
  }

  return response.data.result;
}

/**
 * From raw submissions, extract unique solved problems (AC only).
 * Returns array of { contestId, problemIndex, problemName, rating, tags, firstAcceptedAt, key }
 */
export function extractSolvedProblems(submissions) {
  const solvedMap = new Map();

  for (const sub of submissions) {
    if (sub.verdict !== 'OK') continue;
    const contestId = sub.problem?.contestId;
    const index = sub.problem?.index;
    if (!contestId || !index) continue;

    const key = `${contestId}-${index.toUpperCase()}`;

    if (!solvedMap.has(key)) {
      solvedMap.set(key, {
        contestId,
        problemIndex: index.toUpperCase(),
        problemName: sub.problem.name || '',
        rating: sub.problem.rating || null,
        tags: sub.problem.tags || [],
        firstAcceptedAt: new Date(sub.creationTimeSeconds * 1000),
        key,
      });
    } else {
      // Keep earlier accepted time
      const existing = solvedMap.get(key);
      const thisTime = new Date(sub.creationTimeSeconds * 1000);
      if (thisTime < existing.firstAcceptedAt) {
        existing.firstAcceptedAt = thisTime;
      }
    }
  }

  return Array.from(solvedMap.values());
}

import ProblemSheet from '../models/ProblemSheet.js';
import SolvedProblem from '../models/SolvedProblem.js';
import { problemSheetSchema } from '../validators/schemas.js';

export async function listSheets(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    // Students see only published; mentors/admins see all their own + published
    if (!req.user || req.user.role === 'student') {
      filter.status = 'published';
    } else if (req.user.role === 'mentor') {
      filter.$or = [{ status: 'published' }, { createdBy: req.user._id }];
    }
    // admin sees all

    if (req.query.topic) filter.topic = new RegExp(req.query.topic, 'i');
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const [sheets, total] = await Promise.all([
      ProblemSheet.find(filter)
        .select('title description topic difficulty status createdBy deadline createdAt problems')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProblemSheet.countDocuments(filter),
    ]);

    // Attach solved count per sheet for authenticated users
    let solvedKeys = new Set();
    if (req.user) {
      const solved = await SolvedProblem.find({ user: req.user._id }).select('key').lean();
      solvedKeys = new Set(solved.map((s) => s.key));
    }

    const sheetsWithProgress = sheets.map((sheet) => {
      const problemCount = sheet.problems?.length || 0;
      const solvedCount = req.user
        ? (sheet.problems || []).filter((p) => solvedKeys.has(`${p.contestId}-${p.index}`)).length
        : null;
      return {
        ...sheet,
        problemCount,
        solvedCount,
        completionPct: problemCount > 0 && solvedCount !== null ? Math.round((solvedCount / problemCount) * 100) : null,
      };
    });

    res.json({
      success: true,
      data: { sheets: sheetsWithProgress, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSheet(req, res, next) {
  try {
    const sheet = await ProblemSheet.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!sheet) return res.status(404).json({ success: false, message: 'Sheet not found' });

    // Students can only see published sheets
    if ((!req.user || req.user.role === 'student') && sheet.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Sheet not found' });
    }

    let solvedKeys = new Set();
    if (req.user) {
      const solved = await SolvedProblem.find({ user: req.user._id }).select('key').lean();
      solvedKeys = new Set(solved.map((s) => s.key));
    }

    const problemsWithStatus = (sheet.problems || []).map((p) => ({
      ...p,
      solved: req.user ? solvedKeys.has(`${p.contestId}-${p.index.toUpperCase()}`) : null,
    }));

    const solvedCount = problemsWithStatus.filter((p) => p.solved).length;

    res.json({
      success: true,
      data: {
        sheet: {
          ...sheet,
          problems: problemsWithStatus,
          problemCount: problemsWithStatus.length,
          solvedCount: req.user ? solvedCount : null,
          completionPct: problemsWithStatus.length > 0 && req.user
            ? Math.round((solvedCount / problemsWithStatus.length) * 100)
            : null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createSheet(req, res, next) {
  try {
    const data = problemSheetSchema.parse(req.body);

    const sheet = new ProblemSheet({
      ...data,
      createdBy: req.user._id,
      status: data.status || 'draft',
    });

    await sheet.save();
    await sheet.populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: { sheet } });
  } catch (err) {
    next(err);
  }
}

export async function updateSheet(req, res, next) {
  try {
    const sheet = await ProblemSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Sheet not found' });

    // Ownership check — admin can edit any
    if (req.user.role !== 'admin' && sheet.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own sheets' });
    }

    const data = problemSheetSchema.partial().parse(req.body);
    Object.assign(sheet, data);
    await sheet.save();
    await sheet.populate('createdBy', 'name email');

    res.json({ success: true, data: { sheet } });
  } catch (err) {
    next(err);
  }
}

export async function publishSheet(req, res, next) {
  try {
    const sheet = await ProblemSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Sheet not found' });

    if (req.user.role !== 'admin' && sheet.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (sheet.problems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot publish a sheet with no problems' });
    }

    sheet.status = 'published';
    await sheet.save();

    res.json({ success: true, message: 'Sheet published', data: { sheet } });
  } catch (err) {
    next(err);
  }
}

export async function archiveSheet(req, res, next) {
  try {
    const sheet = await ProblemSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Sheet not found' });

    if (req.user.role !== 'admin' && sheet.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    sheet.status = 'archived';
    await sheet.save();
    res.json({ success: true, message: 'Sheet archived', data: { sheet } });
  } catch (err) {
    next(err);
  }
}

export async function deleteSheet(req, res, next) {
  try {
    const sheet = await ProblemSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ success: false, message: 'Sheet not found' });

    if (req.user.role !== 'admin' && sheet.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (sheet.status === 'published') {
      return res.status(400).json({ success: false, message: 'Archive the sheet before deleting' });
    }

    await sheet.deleteOne();
    res.json({ success: true, message: 'Sheet deleted' });
  } catch (err) {
    next(err);
  }
}

// Parse a Codeforces problem URL and return contestId + index
export async function parseProblemUrl(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL required' });

    // Standard: https://codeforces.com/problemset/problem/1234/A
    // Contest:   https://codeforces.com/contest/1234/problem/A
    const patterns = [
      /codeforces\.com\/problemset\/problem\/(\d+)\/([A-Z0-9]+)/i,
      /codeforces\.com\/contest\/(\d+)\/problem\/([A-Z0-9]+)/i,
    ];

    let contestId, index;
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        contestId = parseInt(match[1]);
        index = match[2].toUpperCase();
        break;
      }
    }

    if (!contestId || !index) {
      return res.status(400).json({ success: false, message: 'Invalid Codeforces problem URL' });
    }

    res.json({ success: true, data: { contestId, index } });
  } catch (err) {
    next(err);
  }
}

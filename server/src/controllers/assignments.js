import Assignment from '../models/Assignment.js';
import ProblemSheet from '../models/ProblemSheet.js';
import SolvedProblem from '../models/SolvedProblem.js';
import User from '../models/User.js';
import { assignmentSchema } from '../validators/schemas.js';

function deriveStatus(assignment, solvedCount, totalProblems) {
  const now = new Date();
  const pct = totalProblems > 0 ? solvedCount / totalProblems : 0;

  if (pct >= 1) return 'completed';
  if (pct > 0) return 'in_progress';
  if (assignment.dueDate < now) return 'overdue';
  return 'not_started';
}

export async function listAssignments(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.user.role === 'student') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'mentor') {
      filter.assignedBy = req.user._id;
    }
    // admin sees all

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .populate('problemSheet', 'title topic difficulty problems status')
        .populate('assignedBy', 'name email')
        .populate('assignedTo', 'name email codeforcesHandle')
        .sort({ assignedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Assignment.countDocuments(filter),
    ]);

    // For current student, attach progress
    let solvedKeys = new Set();
    if (req.user.role === 'student') {
      const solved = await SolvedProblem.find({ user: req.user._id }).select('key').lean();
      solvedKeys = new Set(solved.map((s) => s.key));
    }

    const enriched = assignments.map((a) => {
      const problems = a.problemSheet?.problems || [];
      const totalProblems = problems.length;
      const solvedCount = req.user.role === 'student'
        ? problems.filter((p) => solvedKeys.has(`${p.contestId}-${(p.index || '').toUpperCase()}`)).length
        : null;
      const status = req.user.role === 'student'
        ? deriveStatus(a, solvedCount, totalProblems)
        : undefined;

      return { ...a, totalProblems, solvedCount, status };
    });

    res.json({ success: true, data: { assignments: enriched, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (err) {
    next(err);
  }
}

export async function getAssignment(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('problemSheet', 'title topic difficulty problems status description deadline')
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email codeforcesHandle')
      .lean();

    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    // Access check
    if (req.user.role === 'student' && assignment.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.role === 'mentor' && assignment.assignedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const problems = assignment.problemSheet?.problems || [];
    const targetUserId = assignment.assignedTo._id;

    const solved = await SolvedProblem.find({ user: targetUserId }).select('key').lean();
    const solvedKeys = new Set(solved.map((s) => s.key));

    const problemsWithStatus = problems.map((p) => ({
      ...p,
      solved: solvedKeys.has(`${p.contestId}-${p.index.toUpperCase()}`),
    }));

    const solvedCount = problemsWithStatus.filter((p) => p.solved).length;
    const status = deriveStatus(assignment, solvedCount, problems.length);

    res.json({
      success: true,
      data: {
        assignment: {
          ...assignment,
          problemSheet: { ...assignment.problemSheet, problems: problemsWithStatus },
          solvedCount,
          totalProblems: problems.length,
          completionPct: problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0,
          status,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createAssignment(req, res, next) {
  try {
    const data = assignmentSchema.parse(req.body);

    // Verify sheet exists and is published
    const sheet = await ProblemSheet.findById(data.problemSheet).lean();
    if (!sheet) return res.status(404).json({ success: false, message: 'Problem sheet not found' });
    if (sheet.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Only published sheets can be assigned' });
    }

    // Verify student exists
    const student = await User.findById(data.assignedTo).lean();
    if (!student || student.role !== 'student') {
      return res.status(400).json({ success: false, message: 'Target user is not a student' });
    }

    const assignment = new Assignment({
      ...data,
      assignedBy: req.user._id,
    });

    await assignment.save();
    await assignment.populate([
      { path: 'problemSheet', select: 'title topic' },
      { path: 'assignedBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
    ]);

    res.status(201).json({ success: true, data: { assignment } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'This sheet is already assigned to this student' });
    }
    next(err);
  }
}

export async function updateAssignment(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    if (req.user.role !== 'admin' && assignment.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const allowed = ['dueDate', 'instructions', 'batch'];
    allowed.forEach((k) => { if (req.body[k] !== undefined) assignment[k] = req.body[k]; });

    await assignment.save();
    res.json({ success: true, data: { assignment } });
  } catch (err) {
    next(err);
  }
}

export async function deleteAssignment(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    if (req.user.role !== 'admin' && assignment.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await assignment.deleteOne();
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    next(err);
  }
}

// Mentor: view all students' progress on an assignment
export async function getAssignmentProgress(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('problemSheet', 'title problems')
      .populate('assignedTo', 'name email codeforcesHandle')
      .lean();

    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    if (req.user.role !== 'admin' && assignment.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const problems = assignment.problemSheet?.problems || [];
    const targetUserId = assignment.assignedTo._id;

    const solved = await SolvedProblem.find({ user: targetUserId }).select('key firstAcceptedAt').lean();
    const solvedMap = new Map(solved.map((s) => [s.key, s]));

    const problemsWithStatus = problems.map((p) => {
      const key = `${p.contestId}-${p.index.toUpperCase()}`;
      const solvedEntry = solvedMap.get(key);
      return { ...p, solved: !!solvedEntry, firstAcceptedAt: solvedEntry?.firstAcceptedAt || null };
    });

    const solvedCount = problemsWithStatus.filter((p) => p.solved).length;

    res.json({
      success: true,
      data: {
        assignment: {
          ...assignment,
          problemSheet: { ...assignment.problemSheet, problems: problemsWithStatus },
        },
        progress: {
          solvedCount,
          totalProblems: problems.length,
          completionPct: problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0,
          status: deriveStatus(assignment, solvedCount, problems.length),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

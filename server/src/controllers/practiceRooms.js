import PracticeRoom from '../models/PracticeRoom.js';
import SolvedProblem from '../models/SolvedProblem.js';
import { practiceRoomSchema } from '../validators/schemas.js';

function computeRoomStatus(room) {
  const now = new Date();
  if (room.status === 'cancelled') return 'cancelled';
  if (room.finalised) return 'completed';
  if (now < new Date(room.startTime)) return 'scheduled';
  if (now >= new Date(room.startTime) && now <= new Date(room.endTime)) return 'active';
  return 'completed';
}

export async function listRooms(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [rooms, total] = await Promise.all([
      PracticeRoom.find(filter)
        .select('-invitationCodeHash')
        .populate('host', 'name email')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PracticeRoom.countDocuments(filter),
    ]);

    const enriched = rooms.map((r) => ({ ...r, currentStatus: computeRoomStatus(r) }));

    res.json({ success: true, data: { rooms: enriched, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (err) {
    next(err);
  }
}

export async function getRoom(req, res, next) {
  try {
    const room = await PracticeRoom.findById(req.params.id)
      .select('-invitationCodeHash')
      .populate('host', 'name email')
      .populate('participants.user', 'name email codeforcesHandle')
      .lean();

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    res.json({ success: true, data: { room: { ...room, currentStatus: computeRoomStatus(room) } } });
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req, res, next) {
  try {
    const data = practiceRoomSchema.parse(req.body);

    const room = new PracticeRoom({
      ...data,
      host: req.user._id,
      invitationCodeHash: undefined,
    });

    // Hash invitation code if provided
    if (data.invitationCode) {
      room.setInvitationCode(data.invitationCode);
    }

    await room.save();
    await room.populate('host', 'name email');

    res.status(201).json({ success: true, data: { room } });
  } catch (err) {
    next(err);
  }
}

export async function joinRoom(req, res, next) {
  try {
    const room = await PracticeRoom.findById(req.params.id).select('+invitationCodeHash');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const status = computeRoomStatus(room);
    if (status === 'completed' || status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Room is no longer active' });
    }

    // Check participant limit
    if (room.participants.length >= room.participantLimit) {
      return res.status(400).json({ success: false, message: 'Room is full' });
    }

    // Check if already joined
    const alreadyJoined = room.participants.some((p) => p.user.toString() === req.user._id.toString());
    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: 'Already joined this room' });
    }

    // Verify invitation code for private rooms
    if (room.visibility === 'private') {
      const { invitationCode } = req.body;
      if (!invitationCode) {
        return res.status(400).json({ success: false, message: 'Invitation code required for private rooms' });
      }
      if (!room.checkInvitationCode(invitationCode)) {
        return res.status(403).json({ success: false, message: 'Invalid invitation code' });
      }
    }

    room.participants.push({ user: req.user._id, joinedAt: new Date(), solvedKeys: [] });
    await room.save();

    res.json({ success: true, message: 'Joined room successfully' });
  } catch (err) {
    next(err);
  }
}

export async function leaveRoom(req, res, next) {
  try {
    const room = await PracticeRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (room.finalised) {
      return res.status(400).json({ success: false, message: 'Cannot leave a finalised room' });
    }

    const idx = room.participants.findIndex((p) => p.user.toString() === req.user._id.toString());
    if (idx === -1) {
      return res.status(400).json({ success: false, message: 'Not a participant' });
    }

    room.participants.splice(idx, 1);
    await room.save();

    res.json({ success: true, message: 'Left room' });
  } catch (err) {
    next(err);
  }
}

export async function getRoomLeaderboard(req, res, next) {
  try {
    const room = await PracticeRoom.findById(req.params.id)
      .select('-invitationCodeHash')
      .populate('participants.user', 'name email codeforcesHandle')
      .lean();

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const problemKeys = room.problems.map((p) => `${p.contestId}-${p.index.toUpperCase()}`);
    // Map problem key → points for score calculation
    const pointsMap = Object.fromEntries(
      room.problems.map((p) => [`${p.contestId}-${p.index.toUpperCase()}`, p.points ?? 100])
    );
    const roomStart = new Date(room.startTime);
    const roomEnd = new Date(room.endTime);

    // For each participant, count how many room problems they have solved (ever synced)
    // We intentionally do NOT filter by room time window because:
    //   (a) firstAcceptedAt is the all-time earliest CF solve date, not the room session date
    //   (b) $setOnInsert means it's never updated after first sync
    // Practice rooms track "can the participant solve these problems" not "did they solve it live"
    const participantResults = await Promise.all(
      room.participants.map(async (p) => {
        const userId = p.user._id || p.user;

        const solved = await SolvedProblem.find({
          user: userId,
          key: { $in: problemKeys },
        }).select('key firstAcceptedAt syncedAt').lean();

        return {
          user: p.user,
          joinedAt: p.joinedAt,
          solvedCount: solved.length,
          solvedProblems: solved.map((s) => s.key),
          score: solved.reduce((sum, s) => sum + (pointsMap[s.key] ?? 100), 0),
        };
      })
    );

    participantResults.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      return 0;
    });

    const ranked = participantResults.map((p, i) => ({ rank: i + 1, ...p }));

    res.json({ success: true, data: { room: { _id: room._id, name: room.name, problems: room.problems }, leaderboard: ranked } });
  } catch (err) {
    next(err);
  }
}

export async function finaliseRoom(req, res, next) {
  try {
    const room = await PracticeRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (req.user.role !== 'admin' && room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can finalise the room' });
    }

    room.finalised = true;
    room.status = 'completed';
    await room.save();

    res.json({ success: true, message: 'Room finalised' });
  } catch (err) {
    next(err);
  }
}

import Announcement from '../models/Announcement.js';
import { announcementSchema } from '../validators/schemas.js';

export async function listAnnouncements(req, res, next) {
  try {
    const now = new Date();
    const filter = {};

    // Students see only published, non-expired
    if (!req.user || req.user.role === 'student') {
      filter.status = 'published';
      filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: now } }];
    } else if (req.user.role === 'mentor') {
      filter.$or = [{ status: 'published' }, { author: req.user._id }];
    }
    // admin sees all

    const announcements = await Announcement.find(filter)
      .populate('author', 'name email role')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: { announcements } });
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncement(req, res, next) {
  try {
    const a = await Announcement.findById(req.params.id)
      .populate('author', 'name email role')
      .lean();

    if (!a) return res.status(404).json({ success: false, message: 'Announcement not found' });

    if ((!req.user || req.user.role === 'student') && a.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.json({ success: true, data: { announcement: a } });
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req, res, next) {
  try {
    const data = announcementSchema.parse(req.body);
    const { publish } = req.body;

    const a = new Announcement({
      ...data,
      author: req.user._id,
      status: publish ? 'published' : 'draft',
      publishedAt: publish ? new Date() : null,
    });

    await a.save();
    await a.populate('author', 'name email role');

    res.status(201).json({ success: true, data: { announcement: a } });
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req, res, next) {
  try {
    const a = await Announcement.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Announcement not found' });

    if (req.user.role !== 'admin' && a.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const data = announcementSchema.partial().parse(req.body);
    Object.assign(a, data);

    if (req.body.publish && a.status !== 'published') {
      a.status = 'published';
      a.publishedAt = new Date();
    } else if (req.body.archive) {
      a.status = 'archived';
    }

    await a.save();
    res.json({ success: true, data: { announcement: a } });
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(req, res, next) {
  try {
    const a = await Announcement.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Announcement not found' });

    if (req.user.role !== 'admin' && a.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await a.deleteOne();
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
}

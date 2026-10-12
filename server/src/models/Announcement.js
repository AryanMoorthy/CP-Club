import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3],
    maxlength: [300],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [5000],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  audience: {
    type: String,
    enum: ['all', 'students', 'mentors'],
    default: 'all',
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
}, {
  timestamps: true,
});

announcementSchema.index({ status: 1, publishedAt: -1 });
announcementSchema.index({ author: 1 });

export default mongoose.model('Announcement', announcementSchema);

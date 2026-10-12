import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  contestId: { type: Number, required: true },
  index: { type: String, required: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  rating: { type: Number, default: null },
  tags: [{ type: String }],
  url: { type: String },
  order: { type: Number, default: 0 },
}, { _id: false });

// stable key used for matching solved problems
problemSchema.virtual('key').get(function () {
  return `${this.contestId}-${this.index}`;
});

const problemSheetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must be at most 200 characters'],
  },
  description: { type: String, trim: true, maxlength: 2000 },
  topic: { type: String, trim: true, maxlength: 100 },
  difficulty: {
    type: String,
    enum: ['beginner', 'easy', 'medium', 'hard', 'expert'],
    default: 'medium',
  },
  problems: { type: [problemSchema], default: [] },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  deadline: { type: Date, default: null },
}, {
  timestamps: true,
});

problemSheetSchema.index({ createdBy: 1 });
problemSheetSchema.index({ status: 1 });
problemSheetSchema.index({ topic: 1 });
problemSheetSchema.index({ difficulty: 1 });

export default mongoose.model('ProblemSheet', problemSheetSchema);

import mongoose from 'mongoose';

// Compound unique index prevents same problem from being logged twice per user
const solvedProblemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contestId: { type: Number, required: true },
  problemIndex: { type: String, required: true, uppercase: true },
  problemName: { type: String },
  // Stable key = "contestId-problemIndex"
  key: { type: String, required: true },
  rating: { type: Number, default: null },
  tags: [{ type: String }],
  firstAcceptedAt: { type: Date },
  syncedAt: { type: Date, default: Date.now },
}, {
  timestamps: false,
});

solvedProblemSchema.index({ user: 1, key: 1 }, { unique: true });
solvedProblemSchema.index({ user: 1 });
solvedProblemSchema.index({ user: 1, firstAcceptedAt: 1 });

export default mongoose.model('SolvedProblem', solvedProblemSchema);

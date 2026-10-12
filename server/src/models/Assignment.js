import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  problemSheet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemSheet',
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  batch: { type: String, trim: true }, // optional batch label
  instructions: { type: String, trim: true, maxlength: 2000 },
  dueDate: { type: Date, required: true },
  assignedAt: { type: Date, default: Date.now },
  // status is derived — not stored raw to prevent client manipulation
}, {
  timestamps: true,
});

// Prevent duplicate assignment of same sheet to same student
assignmentSchema.index(
  { problemSheet: 1, assignedTo: 1 },
  { unique: true }
);
assignmentSchema.index({ assignedTo: 1 });
assignmentSchema.index({ assignedBy: 1 });
assignmentSchema.index({ dueDate: 1 });

export default mongoose.model('Assignment', assignmentSchema);

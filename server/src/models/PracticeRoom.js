import mongoose from 'mongoose';
import crypto from 'crypto';

const roomProblemSchema = new mongoose.Schema({
  contestId: { type: Number, required: true },
  index: { type: String, required: true, uppercase: true },
  name: { type: String, required: true },
  points: { type: Number, default: 100 },
  rating: { type: Number },
  url: { type: String },
  order: { type: Number, default: 0 },
}, { _id: false });

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  solvedKeys: [{ type: String }], // problem keys solved during session
}, { _id: false });

const practiceRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    minlength: [3],
    maxlength: [200],
  },
  description: { type: String, trim: true, maxlength: 1000 },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: { type: [participantSchema], default: [] },
  problems: { type: [roomProblemSchema], default: [] },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  participantLimit: { type: Number, default: 50, min: 1, max: 500 },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  // Store hashed invitation code — never return raw code
  invitationCodeHash: { type: String, select: false },
  finalised: { type: Boolean, default: false },
}, {
  timestamps: true,
});

practiceRoomSchema.index({ status: 1 });
practiceRoomSchema.index({ startTime: 1 });
practiceRoomSchema.index({ host: 1 });

// Hash invitation code before saving
practiceRoomSchema.methods.setInvitationCode = function (rawCode) {
  this.invitationCodeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
};

practiceRoomSchema.methods.checkInvitationCode = function (rawCode) {
  const hash = crypto.createHash('sha256').update(rawCode).digest('hex');
  return hash === this.invitationCodeHash;
};

export default mongoose.model('PracticeRoom', practiceRoomSchema);

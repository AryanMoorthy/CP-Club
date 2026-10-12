import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const practiceGoalSchema = new mongoose.Schema({
  dailyProblems: { type: Number, default: 2, min: 0, max: 50 },
  weeklyContests: { type: Number, default: 1, min: 0, max: 10 },
  targetRating: { type: Number, min: 0, max: 4000 },
}, { _id: false });

const codeforcesProfileSchema = new mongoose.Schema({
  handle: { type: String },
  rating: { type: Number },
  maxRating: { type: Number },
  rank: { type: String },
  maxRank: { type: String },
  avatar: { type: String },
  titlePhoto: { type: String },
  country: { type: String },
  organization: { type: String },
  contribution: { type: Number },
  friendOfCount: { type: Number },
  registrationTimeSeconds: { type: Number },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must be at most 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'mentor', 'admin'],
    default: 'student',
  },
  college: { type: String, trim: true, maxlength: 200 },
  batch: { type: String, trim: true, maxlength: 20 },
  codeforcesHandle: {
    type: String,
    trim: true,
    sparse: true,
    unique: true,
    default: null,
  },
  codeforcesProfile: { type: codeforcesProfileSchema, default: null },
  lastCodeforcesSync: { type: Date, default: null },
  practiceGoals: { type: practiceGoalSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.index({ role: 1 });
userSchema.index({ 'codeforcesProfile.rating': -1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', userSchema);

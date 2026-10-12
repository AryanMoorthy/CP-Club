import User from '../models/User.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utils/jwt.js';

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    // Never allow role escalation through registration
    const existing = await User.findOne({ email: data.email }).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const handle = data.codeforcesHandle ? data.codeforcesHandle.trim() : null;

    if (handle) {
      const handleTaken = await User.findOne({ codeforcesHandle: handle }).lean();
      if (handleTaken) {
        return res.status(409).json({ success: false, message: 'Codeforces handle is already linked to another account' });
      }
    }

    const user = new User({
      name: data.name,
      email: data.email,
      passwordHash: data.password, // pre-save hook hashes this
      role: 'student', // Always student on register
      codeforcesHandle: handle || undefined,
    });

    if (handle) {
      try {
        const { getUserInfo } = await import('../services/codeforces.js');
        const cfInfo = await getUserInfo(handle);
        if (cfInfo) {
          user.codeforcesProfile = cfInfo;
          user.lastCodeforcesSync = new Date();
        }
      } catch (cfErr) {
        // If CF API fails or handle is unrated/not found, proceed with registration without blocking
        console.warn(`Initial CF lookup for ${handle}:`, cfErr.message);
      }
    }

    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toSafeObject(),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email }).select('+passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await user.comparePassword(data.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeObject(),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash').lean();
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({ success: true, data: { user, accessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  res.json({ success: true, data: { user: req.user } });
}

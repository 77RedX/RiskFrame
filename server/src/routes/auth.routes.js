import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'riskframe_jwt_secret_default';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: user._id, email: user.email, tier: user.tier }, secret, { expiresIn });
}

// Zod validation schemas
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  preferences: z
    .object({
      riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
      maxAssetWeight: z.number().min(0.05).max(1.0).optional(),
      riskFreeRate: z.number().optional(),
    })
    .optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { name, email, password, preferences } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = new User({
      name,
      email,
      password,
      preferences: preferences || {},
    });

    await user.save();
    const token = generateToken(user);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid email or password format' });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Logged in successfully',
      token,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({ error: 'Failed to authenticate.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: req.user.toSafeJSON() });
});

// PUT /api/auth/preferences
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const allowed = ['riskTolerance', 'maxAssetWeight', 'riskFreeRate', 'excludedTickers', 'theme'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        req.user.preferences[key] = req.body[key];
      }
    }
    await req.user.save();
    return res.json({ message: 'Preferences updated', preferences: req.user.preferences });
  } catch (err) {
    console.error('[Auth Preferences Error]:', err);
    return res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

export default router;

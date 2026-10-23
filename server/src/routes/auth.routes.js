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
  let needsSave = false;
  if (!req.user.holdings || req.user.holdings.length === 0) {
    req.user.holdings = [
      { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', shares: 35, avgBuyPrice: 112.5, buyDate: '2026-01-15' },
      { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', shares: 25, avgBuyPrice: 195.4, buyDate: '2026-02-02' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', shares: 18, avgBuyPrice: 402.0, buyDate: '2026-02-18' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Disc.', shares: 30, avgBuyPrice: 172.8, buyDate: '2026-03-05' },
      { ticker: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', shares: 10, avgBuyPrice: 840.0, buyDate: '2026-03-20' },
    ];
    needsSave = true;
  }
  if (req.user.cashBalance === undefined || req.user.cashBalance === null) {
    req.user.cashBalance = 24500.0;
    needsSave = true;
  }
  if (!req.user.trades) {
    req.user.trades = [];
    needsSave = true;
  }
  if (needsSave) {
    await req.user.save();
  }
  return res.json({ user: req.user.toSafeJSON() });
});

// PUT /api/auth/portfolio - Update user's personal ledger (holdings, cash balance, trades)
router.put('/portfolio', authenticate, async (req, res) => {
  try {
    const { holdings, cashBalance, trade } = req.body;
    if (holdings !== undefined && Array.isArray(holdings)) {
      req.user.holdings = holdings;
    }
    if (cashBalance !== undefined && typeof cashBalance === 'number') {
      req.user.cashBalance = cashBalance;
    }
    if (trade) {
      if (!Array.isArray(req.user.trades)) req.user.trades = [];
      req.user.trades.unshift(trade);
      if (req.user.trades.length > 50) {
        req.user.trades = req.user.trades.slice(0, 50);
      }
    }
    await req.user.save();
    return res.json({
      message: 'Portfolio updated',
      holdings: req.user.holdings,
      cashBalance: req.user.cashBalance,
      trades: req.user.trades,
    });
  } catch (err) {
    console.error('[Auth Portfolio Update Error]:', err);
    return res.status(500).json({ error: 'Failed to update portfolio data.' });
  }
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

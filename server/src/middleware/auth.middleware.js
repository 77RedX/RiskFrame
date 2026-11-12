import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required.' });
  let decoded;
  try { decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'riskframe_jwt_secret_default'); }
  catch { return res.status(401).json({ error: 'Session expired or invalid. Sign in again.' }); }
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Account database is unavailable. Please retry.' });
  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
    req.user = user;
    next();
  } catch { return res.status(503).json({ error: 'Account database is unavailable. Please retry.' }); }
}

export function optionalAuthenticate(req, res, next) {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
}

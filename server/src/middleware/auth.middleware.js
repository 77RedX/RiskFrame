import { getJWTSecret } from '../config/auth.js';
﻿import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required.' });
  let decoded;
  try { decoded = jwt.verify(header.slice(7), getJWTSecret()); }
  catch (error) { return res.status(error.code === 'AUTH_CONFIGURATION' ? 503 : 401).json({ error: error.code === 'AUTH_CONFIGURATION' ? 'Authentication configuration unavailable.' : 'Session expired or invalid. Sign in again.' }); }
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

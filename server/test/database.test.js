import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';

test('primary database failure never silently selects another data store', async () => {
  const original = mongoose.connect;
  const oldPrimary = process.env.MONGODB_URI, oldFallback = process.env.MONGODB_FALLBACK_URI;
  process.env.MONGODB_URI = 'mongodb://primary.invalid/riskframe';
  process.env.MONGODB_FALLBACK_URI = 'mongodb://fallback.invalid/riskframe';
  let calls = 0;
  mongoose.connect = async () => { if (++calls === 1) throw new Error('Primary unavailable'); return mongoose.connection; };
  try { await assert.rejects(connectDB()); assert.equal(calls, 1); }
  finally {
    mongoose.connect = original;
    if (oldPrimary == null) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = oldPrimary;
    if (oldFallback == null) delete process.env.MONGODB_FALLBACK_URI; else process.env.MONGODB_FALLBACK_URI = oldFallback;
  }
});

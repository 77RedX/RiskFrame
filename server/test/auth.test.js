import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { authenticate } from '../src/middleware/auth.middleware.js';

test('missing JWT configuration never accepts the public fallback secret', async () => {
  const original = User.findById, secret = process.env.JWT_SECRET, state = mongoose.connection.readyState;
  delete process.env.JWT_SECRET;
  mongoose.connection.readyState = 1;
  User.findById = () => ({ select: async () => ({ _id: 'test' }) });
  let next = false, status;
  const res = { status(code) { status = code; return this; }, json() {} };
  try {
    const token = jwt.sign({ id: 'test' }, 'riskframe_jwt_secret_default');
    await authenticate({ headers: { authorization: `Bearer ${token}` } }, res, () => { next = true; });
    assert.equal(next, false);
    assert.equal(status, 503);
  } finally {
    User.findById = original; mongoose.connection.readyState = state;
    if (secret == null) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret;
  }
});

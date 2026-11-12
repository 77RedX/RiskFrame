import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/User.js';
import authRoutes from '../src/routes/auth.routes.js';

test('new accounts have no invented positions or cash', () => {
  const user = new User({ name: 'Test User', email: 'test@example.invalid', password: 'test-password' });
  assert.equal(user.holdings.length, 0);
  assert.equal(user.cashBalance, 0);
});

test('reading an empty profile never reseeds or saves it', async () => {
  const user = new User({ name: 'Test User', email: 'test@example.invalid', password: 'test-password', holdings: [], cashBalance: 0 });
  let saves = 0;
  user.save = async () => { saves++; };
  const original = User.findById;
  User.findById = () => ({ select: async () => user });
  const app = express(); app.use('/api/auth', authRoutes);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET || 'riskframe_jwt_secret_default');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(data.user.holdings, []);
    assert.equal(data.user.cashBalance, 0);
    assert.equal(saves, 0);
  } finally { User.findById = original; await new Promise(resolve => server.close(resolve)); }
});

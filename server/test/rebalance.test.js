import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from '../src/models/User.js';
import { Portfolio } from '../src/models/Portfolio.js';
import routes from '../src/routes/portfolio.routes.js';

test('saved strategy rebalance preserves zero risk-free preference and canonical metrics', async () => {
  const original = { user: User.findById, portfolio: Portfolio.findOne, post: axios.post, state: mongoose.connection.readyState, secret: process.env.JWT_SECRET };
  process.env.JWT_SECRET = 'rebalance-test-only'; mongoose.connection.readyState = 1;
  const user = { _id: new mongoose.Types.ObjectId(), preferences: { maxAssetWeight: 0.5, riskFreeRate: 0 } };
  const portfolio = { tickers: ['AAPL', 'MSFT'], allocations: { AAPL: 0.5, MSFT: 0.5 }, metrics: { expectedReturn: 0.1, volatility: 0.2, sharpeRatio: 0.5 }, rebalanceHistory: [], save: async () => {} };
  User.findById = () => ({ select: async () => user });
  Portfolio.findOne = async query => { assert.equal(query.userId, user._id); return portfolio; };
  let submitted;
  axios.post = async (_url, body) => { submitted = body; return { data: { allocation: portfolio.allocations, metrics: { expected_return: 0, volatility: 0.2, sharpe_ratio: 0 } } }; };
  const app = express(); app.use(express.json()); app.use('/portfolios', routes);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/portfolios/${new mongoose.Types.ObjectId()}/rebalance`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET)}` }, body: '{}' });
    assert.equal(response.status, 200);
    assert.equal(submitted.risk_free_rate, 0);
    assert.equal(submitted.max_weight, 0.5);
    assert.equal(portfolio.metrics.expectedReturn, 0);
    assert.equal(portfolio.metrics.sharpeRatio, 0);
  } finally {
    User.findById = original.user; Portfolio.findOne = original.portfolio; axios.post = original.post; mongoose.connection.readyState = original.state;
    if (original.secret == null) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = original.secret;
    await new Promise(resolve => server.close(resolve));
  }
});

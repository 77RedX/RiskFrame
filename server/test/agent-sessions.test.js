import axios from 'axios';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../src/models/User.js';
import { AgentSession } from '../src/models/AgentSession.js';
import { agentTools } from '../src/services/agent.service.js';
import routes from '../src/routes/agent.routes.js';

test('chat validates ownership before tools and bounds owned history', async () => {
  const originals = { findUser: User.findById, findSession: AgentSession.findOne, optimize: agentTools.optimizePortfolio.execute, state: mongoose.connection.readyState, secret: process.env.JWT_SECRET, post: axios.post, key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL };
  process.env.GROQ_API_KEY = 'fixture-key'; process.env.GROQ_MODEL = 'fixture-model';
  axios.post = async () => ({ data: { choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Ready' } }] } });
  process.env.JWT_SECRET = 'session-test-only'; mongoose.connection.readyState = 1;
  const user = { _id: new mongoose.Types.ObjectId(), preferences: {} };
  User.findById = () => ({ select: async () => user });
  let tools = 0, saves = 0;
  agentTools.optimizePortfolio.execute = async () => { tools++; throw new Error('Tools must not execute'); };
  const session = { _id: new mongoose.Types.ObjectId(), messages: Array.from({ length: 40 }, () => ({ role: 'user', content: 'old' })), save: async () => { saves++; } };
  AgentSession.findOne = async query => { assert.equal(String(query.userId), String(user._id)); return null; };
  const app = express(); app.use(express.json()); app.use('/chat', routes);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/chat/chat`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET)}` };
  const post = body => fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  try {
    assert.equal((await post({ message: 'Optimize AAPL NVDA MSFT', sessionId: String(session._id) })).status, 404);
    assert.equal(tools, 0);
    assert.equal((await post({ message: 'Hello', sessionId: 'bad-id' })).status, 400);
    assert.equal((await post({ message: 'x'.repeat(4001) })).status, 400);
    AgentSession.findOne = async () => session;
    const response = await post({ message: 'Hello', sessionId: String(session._id) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).sessionId, String(session._id));
    assert.equal(session.messages.length, 40);
    assert.equal(session.messages.at(-2).content, 'Hello');
    assert.equal(saves, 1);
  } finally {
    axios.post = originals.post;
    for (const [name, value] of [['GROQ_API_KEY', originals.key], ['GROQ_MODEL', originals.model]]) { if (value == null) delete process.env[name]; else process.env[name] = value; }
    User.findById = originals.findUser; AgentSession.findOne = originals.findSession; agentTools.optimizePortfolio.execute = originals.optimize;
    mongoose.connection.readyState = originals.state;
    if (originals.secret == null) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originals.secret;
    await new Promise(resolve => server.close(resolve));
  }
});

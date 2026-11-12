import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { Portfolio } from '../src/models/Portfolio.js';
import { runAgentConversation } from '../src/services/agent.service.js';

test('the overall copilot deadline cancels an in-flight owned Mongo read', async () => {
  const original = { timeout: AbortSignal.timeout, find: Portfolio.find, post: axios.post, key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL };
  let signal, maximum;
  AbortSignal.timeout = () => original.timeout(20);
  process.env.GROQ_API_KEY = 'deadline-fixture'; process.env.GROQ_MODEL = 'deadline-fixture';
  axios.post = async () => ({ data: { choices: [{ finish_reason: 'tool_calls', message: { role: 'assistant', tool_calls: [{ id: 'private-read', type: 'function', function: { name: 'getUserPortfolios', arguments: '{}' } }] } }] } });
  Portfolio.find = () => {
    const query = {
      select: () => query, limit: () => query,
      maxTimeMS: value => { maximum = value; return query; },
      setOptions: options => { signal = options.signal; return query; },
      lean: () => new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve([]), 250);
        signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('Cancelled')); }, { once: true });
      }),
    };
    return query;
  };
  try {
    const start = performance.now();
    await assert.rejects(runAgentConversation({ message: 'Read my strategies', userId: 'owner', allowPrivateContext: true }), /timed out/i);
    assert.ok(performance.now() - start < 200, 'The query must not hold the request until its delayed result');
    assert.equal(signal?.aborted, true);
    assert.equal(maximum, 5000);
  } finally {
    AbortSignal.timeout = original.timeout; Portfolio.find = original.find; axios.post = original.post;
    for (const [name, value] of [['GROQ_API_KEY', original.key], ['GROQ_MODEL', original.model]]) { if (value == null) delete process.env[name]; else process.env[name] = value; }
  }
});

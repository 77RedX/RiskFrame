import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { requestGroq } from '../src/services/groq.service.js';

test('Groq requests stay bounded and provider errors never expose credentials', async () => {
  const original = { post: axios.post, key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL };
  process.env.GROQ_API_KEY = 'fixture-private-key'; process.env.GROQ_MODEL = 'fixture-model';
  try {
    axios.post = async (url, body, config) => {
      assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
      assert.equal(body.model, 'fixture-model'); assert.equal(body.stream, false);
      assert.ok(body.max_completion_tokens > 0 && body.max_completion_tokens <= 2048);
      assert.ok(config.timeout > 0 && config.timeout <= 20000);
      assert.equal(config.headers.Authorization, 'Bearer fixture-private-key');
      return { data: { choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'Ready' } }] } };
    };
    assert.equal((await requestGroq([{ role: 'user', content: 'Hello' }], [])).content, 'Ready');
    for (const [upstream, status] of [[401, 503], [429, 429], [500, 503]]) {
      axios.post = async () => { throw { response: { status: upstream }, message: 'fixture-private-key', config: { headers: { Authorization: 'fixture-private-key' } } }; };
      await assert.rejects(requestGroq([], []), error => error.status === status && !JSON.stringify(error).includes('fixture-private-key') && !error.message.includes('fixture-private-key'));
    }
    axios.post = async () => { throw { code: 'ECONNABORTED', message: 'fixture-private-key' }; };
    await assert.rejects(requestGroq([], []), error => error.status === 503);
    axios.post = async () => ({ data: { choices: [{ finish_reason: 'length', message: { content: 'truncated' } }] } });
    await assert.rejects(requestGroq([], []), /incomplete/i);
    delete process.env.GROQ_API_KEY;
    await assert.rejects(requestGroq([], []), error => error.status === 503);
  } finally {
    axios.post = original.post;
    for (const [name, value] of [['GROQ_API_KEY', original.key], ['GROQ_MODEL', original.model]]) {
      if (value == null) delete process.env[name]; else process.env[name] = value;
    }
  }
});

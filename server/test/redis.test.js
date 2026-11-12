import test from 'node:test';
import assert from 'node:assert/strict';
import Redis from 'ioredis';
import { initRedis } from '../src/config/redis.js';

test('Redis connection logs never include credential-bearing URLs', () => {
  const original = { url: process.env.REDIS_URL, connect: Redis.prototype.connect, log: console.log, warn: console.warn };
  const logs = [];
  process.env.REDIS_URL = 'redis://fixture-user:fixture-password@example.invalid:6379';
  Redis.prototype.connect = async () => {};
  console.log = console.warn = (...args) => logs.push(args.join(' '));
  try {
    const client = initRedis();
    client.emit('connect');
    client.emit('error', new Error(process.env.REDIS_URL));
    client.disconnect();
    assert.ok(logs.length >= 2);
    assert.doesNotMatch(logs.join('\n'), /fixture-password|fixture-user|example.invalid/);
  } finally {
    Redis.prototype.connect = original.connect; console.log = original.log; console.warn = original.warn;
    if (original.url == null) delete process.env.REDIS_URL; else process.env.REDIS_URL = original.url;
  }
});

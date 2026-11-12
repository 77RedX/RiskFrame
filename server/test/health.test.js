import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import routes from '../src/routes/health.routes.js';

test('liveness stays available while readiness reports database and quant failures', async () => {
  const original = axios.get, state = mongoose.connection.readyState;
  const app = express(); app.use('/api', routes);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api`;
    axios.get = async () => ({ data: { status: 'ok' } });
    mongoose.connection.readyState = 0;
    assert.equal((await fetch(url + '/live')).status, 200);
    assert.equal((await fetch(url + '/health')).status, 503);
    mongoose.connection.readyState = 1;
    assert.equal((await fetch(url + '/health')).status, 200);
    axios.get = async () => { throw new Error('Unavailable'); };
    assert.equal((await fetch(url + '/health')).status, 503);
  } finally { axios.get = original; mongoose.connection.readyState = state; await new Promise(resolve => server.close(resolve)); }
});

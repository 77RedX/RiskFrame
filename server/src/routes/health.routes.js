import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { isRedisReady } from '../config/redis.js';

const router = express.Router();
let reportedQuantFailure = false;
router.get('/live', (req, res) => res.json({ status: 'ok' }));
router.get('/health', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const database = mongoose.connection.readyState === 1;
  let quant = false;
  const started = Date.now();
  let hostname = 'invalid host';
  let reason;
  try {
    const url = new URL(`${process.env.PYTHON_QUANT_URL || 'http://127.0.0.1:5001'}/api/health`);
    hostname = url.hostname;
    const response = await axios.get(url.href, { timeout: 2000 });
    quant = response.data?.status === 'ok';
    reason = `HTTP ${response.status} without ready status`;
  } catch (error) {
    reason = error.response ? `HTTP ${error.response.status}` : error.code || 'request failed';
  }
  if (!quant && !reportedQuantFailure) {
    console.warn(`[Health] Quant unavailable at ${hostname} after ${Date.now() - started} ms (${reason})`);
  } else if (quant && reportedQuantFailure) {
    console.info(`[Health] Quant ready again at ${hostname}`);
  }
  reportedQuantFailure = !quant;
  res.status(database && quant ? 200 : 503).json({ status: database && quant ? 'ok' : 'degraded', database: database ? 'connected' : 'unavailable', quant: quant ? 'ready' : 'unavailable', redis: isRedisReady() ? 'connected' : 'memory_fallback' });
});
export default router;

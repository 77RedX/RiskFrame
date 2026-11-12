import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { isRedisReady } from '../config/redis.js';

const router = express.Router();
router.get('/live', (req, res) => res.json({ status: 'ok' }));
router.get('/health', async (req, res) => {
  const database = mongoose.connection.readyState === 1;
  let quant = false;
  try { quant = (await axios.get(`${process.env.PYTHON_QUANT_URL || 'http://127.0.0.1:5001'}/api/health`, { timeout: 2000 })).data.status === 'ok'; } catch {}
  res.status(database && quant ? 200 : 503).json({ status: database && quant ? 'ok' : 'degraded', database: database ? 'connected' : 'unavailable', quant: quant ? 'ready' : 'unavailable', redis: isRedisReady() ? 'connected' : 'memory_fallback' });
});
export default router;

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB, disconnectDB } from './config/db.js';
import { initRedis, isRedisReady } from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import optimizeRoutes from './routes/optimize.routes.js';
import agentRoutes from './routes/agent.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local development
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan('dev'));

// Global Health Check with System Telemetry
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    version: '2.0.0',
    backend: 'Node.js Express',
    database: 'MongoDB',
    redis: isRedisReady() ? 'connected' : 'memory_fallback',
    timestamp: new Date().toISOString(),
  });
});

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api', optimizeRoutes);
app.use('/api/agent', agentRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start Server & Connect Databases
async function startServer() {
  try {
    console.log('🚀 [RiskFrame] Starting v2 Node.js & MongoDB Engine...');
    
    // 1. Connect MongoDB
    await connectDB();

    // 2. Connect Redis
    initRedis();

    // 3. Listen on network port
    const server = app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`✅ RiskFrame Backend v2 Running on http://localhost:${PORT}`);
      console.log(`⚡ Redis Acceleration: ${isRedisReady() ? 'Active (Connected)' : 'Fallback Layer'}`);
      console.log(`🤖 Agentic Co-Pilot API: http://localhost:${PORT}/api/agent/chat`);
      console.log(`==================================================\n`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('\n🛑 Gracefully shutting down RiskFrame server...');
      server.close(async () => {
        await disconnectDB();
        console.log('👋 Goodbye!');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to start RiskFrame server:', error);
    process.exit(1);
  }
}

startServer();

import express from 'express';
import { z } from 'zod';
import { optionalAuthenticate, authenticate } from '../middleware/auth.middleware.js';
import { AgentSession } from '../models/AgentSession.js';
import { runAgentConversation } from '../services/agent.service.js';

const router = express.Router();
// shortcut: per-process limits; use shared Redis counters before scaling Node replicas.
const windows = new Map(), pending = new Set();

const AgentChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000),
  sessionId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid session ID').nullish(),
  includePortfolioContext: z.boolean().default(false),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }).strict()).max(12).default([]),
}).strict();

// POST /api/agent/chat
router.post('/chat', optionalAuthenticate, async (req, res) => {
  let activeKey;
  try {
    const parsed = AgentChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { message, sessionId, includePortfolioContext, history } = parsed.data;
    const userId = req.user?._id || null;

    let session = null;
    if (sessionId) {
      if (!userId) return res.status(401).json({ error: 'Sign in to resume a conversation.' });
      session = await AgentSession.findOne({ _id: sessionId, userId });
      if (!session) return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (includePortfolioContext && !userId) return res.status(401).json({ error: 'Sign in before sharing saved portfolio context.' });
    if (session && (session.metadata?.groqContextVersion !== 1 || Boolean(session.metadata?.privateContextAllowed) !== includePortfolioContext)) return res.status(400).json({ error: 'Start a new conversation to change portfolio-data permission or use an older session.' });
    const key = userId ? `user:${userId}` : `guest:${req.ip}`;
    const now = Date.now();
    let window = windows.get(key);
    if (!window || now - window.started >= 60000) {
      if (windows.size >= 1000) windows.delete(windows.keys().next().value);
      window = { started: now, count: 0 }; windows.set(key, window);
    }
    if (window.count >= 10 || pending.has(key)) return res.status(429).json({ error: 'Copilot request limit reached. Wait before sending another message.' });
    window.count++; pending.add(key); activeKey = key;

    // Only the authenticated owner's stored history can supply trusted tool context.
    const agentOutput = await runAgentConversation({
      message,
      userId,
      userPreferences: req.user?.preferences,
      history: session?.messages || (!userId ? history : []),
      trustedHistory: Boolean(session),
      allowPrivateContext: includePortfolioContext && Boolean(userId),
    });

    // If user is authenticated, persist multi-turn memory to MongoDB
    if (userId) {
      if (!session) {
        session = new AgentSession({
          userId,
          title: message.slice(0, 40) + '...',
          messages: [],
          metadata: { groqContextVersion: 1, privateContextAllowed: includePortfolioContext },
        });
      }

      session.messages.push({ role: 'user', content: message });
      session.messages.push({
        role: 'assistant',
        content: agentOutput.reply,
        toolCalls: agentOutput.toolCalls,
      });
      session.messages = session.messages.slice(-40);
      await session.save();
    }

    return res.json({
      reply: agentOutput.reply,
      toolCalls: agentOutput.toolCalls,
      sessionId: session?._id || null,
    });
  } catch (err) {
    console.warn('[Copilot] Request could not be completed.');
    return res.status(err.code === 'COPILOT' ? err.status : 503).json({ error: err.code === 'COPILOT' ? err.message : 'Could not confirm the conversation. Please retry.' });
  } finally { if (activeKey) pending.delete(activeKey); }
});

// GET /api/agent/sessions - User conversation history
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await AgentSession.find({ userId: req.user._id })
      .select('title updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch agent sessions' });
  }
});

export default router;

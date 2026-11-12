import express from 'express';
import { z } from 'zod';
import { optionalAuthenticate, authenticate } from '../middleware/auth.middleware.js';
import { AgentSession } from '../models/AgentSession.js';
import { runAgentConversation } from '../services/agent.service.js';

const router = express.Router();

const AgentChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000),
  sessionId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid session ID').nullish(),
});

// POST /api/agent/chat
router.post('/chat', optionalAuthenticate, async (req, res) => {
  try {
    const parsed = AgentChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { message, sessionId } = parsed.data;
    const userId = req.user?._id || null;

    let session = null;
    if (sessionId) {
      if (!userId) return res.status(401).json({ error: 'Sign in to resume a conversation.' });
      session = await AgentSession.findOne({ _id: sessionId, userId });
      if (!session) return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Run the Quantitative Agent reasoning & tool calls
    const agentOutput = await runAgentConversation({
      message,
      userId,
      userPreferences: req.user?.preferences,
    });

    // If user is authenticated, persist multi-turn memory to MongoDB
    if (userId) {
      if (!session) {
        session = new AgentSession({
          userId,
          title: message.slice(0, 40) + '...',
          messages: [],
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
    console.error('[Agent Route Error]:', err);
    return res.status(500).json({ error: 'Failed to process agent request.' });
  }
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

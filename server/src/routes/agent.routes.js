import express from 'express';
import { z } from 'zod';
import { optionalAuthenticate, authenticate } from '../middleware/auth.middleware.js';
import { AgentSession } from '../models/AgentSession.js';
import { runAgentConversation } from '../services/agent.service.js';

const router = express.Router();

const AgentChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().nullish(),
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

    // Run the Quantitative Agent reasoning & tool calls
    const agentOutput = await runAgentConversation({
      message,
      userId,
      userPreferences: req.user?.preferences,
    });

    // If user is authenticated, persist multi-turn memory to MongoDB
    let session = null;
    if (userId) {
      if (sessionId) {
        session = await AgentSession.findOne({ _id: sessionId, userId });
      }
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

import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system', 'tool'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    toolCalls: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const AgentSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Strategy Session',
      trim: true,
    },
    messages: [MessageSchema],
    metadata: {
      lastOptimizedTickers: [String],
      activePortfolioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Portfolio',
      },
    },
  },
  {
    timestamps: true,
  }
);

AgentSessionSchema.index({ userId: 1, updatedAt: -1 });

export const AgentSession = mongoose.model('AgentSession', AgentSessionSchema);

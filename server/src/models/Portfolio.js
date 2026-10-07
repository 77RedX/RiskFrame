import mongoose from 'mongoose';

const RebalanceEntrySchema = new mongoose.Schema(
  {
    rebalancedAt: {
      type: Date,
      default: Date.now,
    },
    allocations: {
      type: Map,
      of: Number,
      required: true,
    },
    sharpeRatio: Number,
    expectedReturn: Number,
    volatility: Number,
    reason: {
      type: String,
      default: 'Manual rebalance',
    },
  },
  { _id: true }
);

const PortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Portfolio name is required'],
      trim: true,
      maxLength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500,
      default: '',
    },
    tickers: {
      type: [String],
      required: [true, 'At least 2 tickers required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 2,
        message: 'A portfolio must contain at least 2 tickers',
      },
    },
    allocations: {
      type: Map,
      of: Number,
      required: true,
    },
    metrics: {
      expectedReturn: { type: Number, required: true },
      volatility: { type: Number, required: true },
      sharpeRatio: { type: Number, required: true },
    },
    aiPredictions: {
      type: Map,
      of: Number,
      default: {},
    },
    individualMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rebalanceCadence: {
      type: String,
      enum: ['manual', 'weekly', 'monthly'],
      default: 'monthly',
    },
    lastRebalancedAt: {
      type: Date,
      default: Date.now,
    },
    rebalanceHistory: [RebalanceEntrySchema],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

PortfolioSchema.index({ userId: 1, createdAt: -1 });
PortfolioSchema.index({ userId: 1, isPinned: -1 });

export const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

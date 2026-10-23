import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default in queries
    },
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'pro',
    },
    preferences: {
      riskTolerance: {
        type: String,
        enum: ['conservative', 'moderate', 'aggressive'],
        default: 'moderate',
      },
      maxAssetWeight: {
        type: Number,
        default: 0.35,
        min: 0.05,
        max: 1.0,
      },
      riskFreeRate: {
        type: Number,
        default: 0.04,
      },
      excludedTickers: {
        type: [String],
        default: [],
      },
      theme: {
        type: String,
        default: 'dark',
      },
    },
    holdings: {
      type: [
        {
          ticker: { type: String, required: true },
          name: { type: String, default: '' },
          sector: { type: String, default: 'Equities' },
          shares: { type: Number, required: true },
          avgBuyPrice: { type: Number, required: true },
          buyDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
        },
      ],
      default: () => [
        { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', shares: 35, avgBuyPrice: 112.5, buyDate: '2026-01-15' },
        { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', shares: 25, avgBuyPrice: 195.4, buyDate: '2026-02-02' },
        { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', shares: 18, avgBuyPrice: 402.0, buyDate: '2026-02-18' },
        { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Disc.', shares: 30, avgBuyPrice: 172.8, buyDate: '2026-03-05' },
        { ticker: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', shares: 10, avgBuyPrice: 840.0, buyDate: '2026-03-20' },
      ],
    },
    cashBalance: {
      type: Number,
      default: 24500.0,
    },
    trades: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare candidate password with stored hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe JSON serialization (strip password)
UserSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model('User', UserSchema);

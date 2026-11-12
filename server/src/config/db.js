import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? null : 'mongodb://127.0.0.1:27017/riskframe');
  if (!uri) throw new Error('MONGODB_URI must be configured');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, dbName: 'riskframe' });
  console.log('[MongoDB] Connected to the configured database');
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

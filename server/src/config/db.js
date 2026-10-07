import mongoose from 'mongoose';

let memoryServer = null;

export async function connectDB() {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/riskframe';

  // Attempt connection to specified MONGODB_URI
  try {
    console.log(`🔌 [MongoDB] Attempting connection to: ${primaryUri}...`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`🍃 [MongoDB] Connected successfully to primary database (${primaryUri})`);
    return mongoose.connection;
  } catch (primaryErr) {
    console.warn(`⚠️  [MongoDB] Primary database unreachable (${primaryErr.message}).`);
    
    // Attempt fallback to mongodb-memory-server for instant zero-config local development
    try {
      console.log('🔄 [MongoDB] Starting embedded MongoDB Memory Server for local development...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      
      await mongoose.connect(memUri);
      console.log(`🍃 [MongoDB] Successfully connected to embedded Memory Server at ${memUri}`);
      console.log('💡 [MongoDB] Note: To persist across restarts, specify MONGODB_URI in server/.env (e.g. MongoDB Atlas or local mongod).');
      return mongoose.connection;
    } catch (memErr) {
      console.error(`❌ [MongoDB] Failed to start MongoDB fallback: ${memErr.message}`);
      throw new Error(`Could not connect to MongoDB: ${primaryErr.message}`);
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}

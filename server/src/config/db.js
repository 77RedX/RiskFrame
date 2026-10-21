import mongoose from 'mongoose';

let memoryServer = null;

export async function connectDB() {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/riskframe';
  const maskedUri = primaryUri.replace(/:[^:]*@/, ':****@');

  // Attempt connection to specified MONGODB_URI
  try {
    console.log(`🔌 [MongoDB] Attempting connection to: ${maskedUri}...`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 15000,
      dbName: 'riskframe',
    });
    console.log(`🍃 [MongoDB] Connected successfully to primary database (${maskedUri})`);
    return mongoose.connection;
  } catch (primaryErr) {
    console.warn(`⚠️  [MongoDB] Primary database unreachable (${primaryErr.message}).`);
    
    // Check if it's an IP Whitelist issue with Atlas
    if (primaryUri.includes('mongodb.net') || primaryUri.includes('mongodb+srv')) {
      console.error(`🚨 [MongoDB Atlas] Connection failed. Please ensure your current IP address is whitelisted in MongoDB Atlas Network Access (or set to 0.0.0.0/0).`);
    }

    // Try fallback URI if provided (e.g. local container in docker-compose)
    if (process.env.MONGODB_FALLBACK_URI) {
      try {
        console.log(`🔄 [MongoDB] Attempting fallback to: ${process.env.MONGODB_FALLBACK_URI}...`);
        await mongoose.connect(process.env.MONGODB_FALLBACK_URI, {
          serverSelectionTimeoutMS: 5000,
          dbName: 'riskframe',
        });
        console.log(`🍃 [MongoDB] Connected successfully to fallback database (${process.env.MONGODB_FALLBACK_URI})`);
        return mongoose.connection;
      } catch (fallbackErr) {
        console.warn(`⚠️  [MongoDB] Fallback database unreachable (${fallbackErr.message})`);
      }
    }

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

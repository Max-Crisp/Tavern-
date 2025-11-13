// src/config/db.config.ts
import 'dotenv/config';
import mongoose from 'mongoose';

const mongoUri = process.env.MONGO_URI as string;

export const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000, // Fail fast if MongoDB is not available
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed:', err instanceof Error ? err.message : err);
    console.warn('⚠️  Server will start without database. Please start MongoDB or configure Atlas.');
    // Don't exit - allow server to start for testing API structure
  }
};

import mongoose from 'mongoose';
import { config } from './env';

/**
 * Creates the MongoDB connection using the URI from configuration.
 */
export const connectDatabase = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error', error);
    process.exit(1);
  }
};

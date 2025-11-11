const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Includes error handling and reconnection logic
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection options
      maxPoolSize: 10, // Connection pooling
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      // Only log in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      }
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    // Only log in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ MongoDB connection failed:', error.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

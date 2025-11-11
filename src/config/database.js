const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Includes error handling and reconnection logic
 */
const connectDB = async () => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection options
      maxPoolSize: 10, // Connection pooling
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
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
      console.error('💡 Troubleshooting tips:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify MongoDB Atlas cluster is running');
      console.error('   3. Check if your IP is whitelisted in MongoDB Atlas');
      console.error('   4. Try using standard URI instead of SRV URI in .env');
      console.error('   5. Verify credentials are correct');
      process.exit(1);
    }
  }
};

module.exports = connectDB;

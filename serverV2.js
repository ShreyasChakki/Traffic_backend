const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables
const app = require('./app');
const { initializeSocket } = require('./src/config/socket');
const { registerSocketHandlers } = require('./src/socket');
const { initializeDashboardSocket } = require('./src/socket/dashboardSocket');
const jobsService = require('./src/services/jobs');
const logger = require('./src/utils/logger');

// Create HTTP server
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.success('MongoDB Connected');
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize socket configuration and handlers
initializeSocket(io);
registerSocketHandlers(io);
initializeDashboardSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.success(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}`);
  logger.info(`Socket.IO ready for connections`);
  
  // Start background jobs after server is running
  setTimeout(() => {
    jobsService.startAll();
  }, 2000); // Wait 2 seconds for DB connection to stabilize
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    logger.error('Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  // Close server & exit process
  server.close(() => {
    logger.error('Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  jobsService.stopAll();
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  jobsService.stopAll();
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };

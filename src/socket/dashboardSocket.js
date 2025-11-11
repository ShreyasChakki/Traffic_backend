const logger = require('../utils/logger');
const analyticsService = require('../services/analyticsService');

/**
 * Dashboard Socket.IO Event Handlers
 * Manages real-time dashboard updates
 */

/**
 * Initialize dashboard socket handlers
 * @param {Object} io - Socket.IO instance
 */
const initializeDashboardSocket = (io) => {
  io.on('connection', (socket) => {
    
    /**
     * Join dashboard room
     */
    socket.on('join-dashboard', async (data) => {
      try {
        socket.join('dashboard');
        logger.info(`User ${socket.user.name} joined dashboard room`);

        // Send initial data load
        const stats = await analyticsService.calculateStats();
        const trafficStatus = await analyticsService.getTrafficStatus();

        socket.emit('dashboard-initial-data', {
          stats,
          trafficStatus: trafficStatus.slice(0, 10),
          timestamp: new Date().toISOString()
        });

        socket.emit('room-joined', { room: 'dashboard' });
      } catch (error) {
        logger.error('Error joining dashboard room:', error.message);
        socket.emit('error', { message: 'Failed to join dashboard room' });
      }
    });

    /**
     * Leave dashboard room
     */
    socket.on('leave-dashboard', () => {
      socket.leave('dashboard');
      logger.info(`User ${socket.user.name} left dashboard room`);
    });

    /**
     * Request stats update
     */
    socket.on('request-stats-update', async () => {
      try {
        const stats = await analyticsService.calculateStats();
        socket.emit('stats-update', {
          stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error sending stats update:', error.message);
        socket.emit('error', { message: 'Failed to fetch stats' });
      }
    });

    /**
     * Request traffic status update
     */
    socket.on('request-traffic-update', async () => {
      try {
        const trafficStatus = await analyticsService.getTrafficStatus();
        socket.emit('traffic-status-update', {
          data: trafficStatus.slice(0, 10),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error sending traffic update:', error.message);
        socket.emit('error', { message: 'Failed to fetch traffic status' });
      }
    });
  });
};

/**
 * Broadcast stats update to all dashboard clients
 * @param {Object} io - Socket.IO instance
 */
const broadcastStatsUpdate = async (io) => {
  try {
    const stats = await analyticsService.calculateStats();
    io.to('dashboard').emit('stats-update', {
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error broadcasting stats update:', error.message);
  }
};

/**
 * Broadcast traffic status update to all dashboard clients
 * @param {Object} io - Socket.IO instance
 */
const broadcastTrafficUpdate = async (io) => {
  try {
    const trafficStatus = await analyticsService.getTrafficStatus();
    io.to('dashboard').emit('traffic-status-update', {
      data: trafficStatus.slice(0, 10),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error broadcasting traffic update:', error.message);
  }
};

module.exports = {
  initializeDashboardSocket,
  broadcastStatsUpdate,
  broadcastTrafficUpdate
};

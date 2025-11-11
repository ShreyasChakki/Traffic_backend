/**
 * Socket.IO Event Handlers
 * Centralized socket event management
 */

const logger = require('../utils/logger');

/**
 * Socket event handlers
 */
const socketHandlers = {
  /**
   * Handle traffic data updates
   * @param {Object} socket - Socket instance
   * @param {Object} data - Traffic data
   */
  handleTrafficUpdate: (socket, data) => {
    logger.debug('Traffic update received:', data);
    
    // Broadcast to dashboard room
    socket.to('dashboard').emit('traffic-update', {
      timestamp: new Date().toISOString(),
      data
    });
  },

  /**
   * Handle new alert creation
   * @param {Object} socket - Socket instance
   * @param {Object} alert - Alert data
   */
  handleAlertCreated: (socket, alert) => {
    logger.info('New alert created:', alert);
    
    // Broadcast to alerts room
    socket.to('alerts').emit('alert-created', {
      timestamp: new Date().toISOString(),
      alert
    });

    // Also notify dashboard
    socket.to('dashboard').emit('alert-notification', {
      timestamp: new Date().toISOString(),
      alert
    });
  },

  /**
   * Handle signal state change
   * @param {Object} socket - Socket instance
   * @param {Object} data - Signal data
   */
  handleSignalChanged: (socket, data) => {
    logger.debug('Signal state changed:', data);
    
    // Broadcast to map room
    socket.to('map').emit('signal-changed', {
      timestamp: new Date().toISOString(),
      data
    });
  },

  /**
   * Handle intersection update
   * @param {Object} socket - Socket instance
   * @param {Object} data - Intersection data
   */
  handleIntersectionUpdate: (socket, data) => {
    logger.debug('Intersection updated:', data);
    
    // Broadcast to map room
    socket.to('map').emit('intersection-update', {
      timestamp: new Date().toISOString(),
      data
    });
  },

  /**
   * Handle congestion alert
   * @param {Object} socket - Socket instance
   * @param {Object} data - Congestion data
   */
  handleCongestionAlert: (socket, data) => {
    logger.warn('Congestion alert:', data);
    
    // Broadcast to all relevant rooms
    socket.to('dashboard').emit('congestion-alert', {
      timestamp: new Date().toISOString(),
      data
    });
    
    socket.to('map').emit('congestion-alert', {
      timestamp: new Date().toISOString(),
      data
    });
  }
};

/**
 * Register socket event handlers
 * @param {Object} io - Socket.IO instance
 */
const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Traffic update event
    socket.on('traffic-update', (data) => {
      socketHandlers.handleTrafficUpdate(socket, data);
    });

    // Alert created event
    socket.on('alert-created', (alert) => {
      socketHandlers.handleAlertCreated(socket, alert);
    });

    // Signal changed event
    socket.on('signal-changed', (data) => {
      socketHandlers.handleSignalChanged(socket, data);
    });

    // Intersection update event
    socket.on('intersection-update', (data) => {
      socketHandlers.handleIntersectionUpdate(socket, data);
    });

    // Congestion alert event
    socket.on('congestion-alert', (data) => {
      socketHandlers.handleCongestionAlert(socket, data);
    });
  });
};

module.exports = {
  socketHandlers,
  registerSocketHandlers
};

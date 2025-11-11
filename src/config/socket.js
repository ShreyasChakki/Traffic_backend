const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token from socket handshake
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Initialize Socket.IO
 * @param {Object} io - Socket.IO instance
 */
const initializeSocket = (io) => {
  // Apply authentication middleware
  io.use(socketAuth);

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user.name})`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to Smart Traffic IoT Server',
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      }
    });

    // Join dashboard room
    socket.on('join-dashboard', () => {
      socket.join('dashboard');
      logger.info(`User ${socket.user.name} joined dashboard room`);
      socket.emit('room-joined', { room: 'dashboard' });
    });

    // Leave dashboard room
    socket.on('leave-dashboard', () => {
      socket.leave('dashboard');
      logger.info(`User ${socket.user.name} left dashboard room`);
    });

    // Join map room
    socket.on('join-map', () => {
      socket.join('map');
      logger.info(`User ${socket.user.name} joined map room`);
      socket.emit('room-joined', { room: 'map' });
    });

    // Leave map room
    socket.on('leave-map', () => {
      socket.leave('map');
      logger.info(`User ${socket.user.name} left map room`);
    });

    // Join alerts room
    socket.on('join-alerts', () => {
      socket.join('alerts');
      logger.info(`User ${socket.user.name} joined alerts room`);
      socket.emit('room-joined', { room: 'alerts' });
    });

    // Leave alerts room
    socket.on('leave-alerts', () => {
      socket.leave('alerts');
      logger.info(`User ${socket.user.name} left alerts room`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  // Store io instance globally for use in other parts of the app
  global.io = io;

  logger.success('Socket.IO initialized successfully');
};

/**
 * Emit event to specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const emitToRoom = (room, event, data) => {
  if (global.io) {
    global.io.to(room).emit(event, data);
  }
};

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const emitToUser = (userId, event, data) => {
  if (global.io) {
    global.io.to(`user-${userId}`).emit(event, data);
  }
};

/**
 * Broadcast event to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const broadcast = (event, data) => {
  if (global.io) {
    global.io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  emitToRoom,
  emitToUser,
  broadcast
};

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStats,
  getTrafficStatus,
  getRecentEvents,
  getPerformance,
  markEventAsRead,
  markAllEventsAsRead,
  getUnreadCount
} = require('../controllers/dashboardController');

/**
 * Dashboard Routes
 * All routes are protected (require authentication)
 */

// Apply authentication middleware to all routes
router.use(protect);

// Dashboard statistics
router.get('/stats', getStats);

// Traffic status
router.get('/traffic-status', getTrafficStatus);

// Events
router.get('/events', getRecentEvents);
router.get('/events/unread-count', getUnreadCount);
router.put('/events/read-all', markAllEventsAsRead);
router.put('/events/:id/read', markEventAsRead);

// Performance data
router.get('/performance', getPerformance);

module.exports = router;

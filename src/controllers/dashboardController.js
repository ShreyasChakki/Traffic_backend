const asyncHandler = require('../middleware/asyncHandler');
const { ErrorResponse } = require('../middleware/errorHandler');
const Event = require('../models/Event');
const analyticsService = require('../services/analyticsService');
const cache = require('../utils/cache');

/**
 * @desc    Get dashboard overview statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
exports.getStats = asyncHandler(async (req, res, next) => {
  const stats = await analyticsService.calculateStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get traffic status for all intersections
 * @route   GET /api/dashboard/traffic-status
 * @access  Private
 */
exports.getTrafficStatus = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const status = await analyticsService.getTrafficStatus();

  // Limit results
  const limitedStatus = status.slice(0, parseInt(limit));

  res.status(200).json({
    success: true,
    data: limitedStatus,
    total: status.length
  });
});

/**
 * @desc    Get recent events with pagination
 * @route   GET /api/dashboard/events
 * @access  Private
 */
exports.getRecentEvents = asyncHandler(async (req, res, next) => {
  const { 
    limit = 10, 
    page = 1, 
    type 
  } = req.query;

  // Validate limit
  const parsedLimit = Math.min(parseInt(limit), 50);
  const parsedPage = parseInt(page);
  const skip = (parsedPage - 1) * parsedLimit;

  // Build query
  const query = {};
  if (type) {
    query.type = type;
  }

  // Try cache first
  const cacheKey = `events:${type || 'all'}:${parsedPage}:${parsedLimit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  // Fetch events
  const events = await Event.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate('intersectionId', 'name code')
    .populate('userId', 'name email');

  // Get total count
  const total = await Event.countDocuments(query);

  // Format events for frontend
  const formattedEvents = events.map(event => {
    // Map severity to type for frontend
    let eventType = 'success';
    if (event.severity === 'error') eventType = 'error';
    else if (event.severity === 'warning') eventType = 'warning';
    else eventType = 'success';

    // Map severity to priority
    let priority = 'low';
    if (event.severity === 'error') priority = 'high';
    else if (event.severity === 'warning') priority = 'medium';
    else priority = 'low';

    return {
      id: event._id,
      type: eventType,
      message: event.message,
      location: event.intersectionId ? event.intersectionId.name : '',
      timestamp: event.timestamp.toISOString(),
      priority: priority,
      isRead: event.isRead
    };
  });

  const response = {
    success: true,
    data: {
      events: formattedEvents
    }
  };

  // Cache for 10 seconds
  cache.set(cacheKey, response, 10);

  res.status(200).json(response);
});

/**
 * @desc    Get signal performance data
 * @route   GET /api/dashboard/performance
 * @access  Private
 */
exports.getPerformance = asyncHandler(async (req, res, next) => {
  const { period = '7days' } = req.query;

  // Validate period
  if (!['7days', '30days', '90days'].includes(period)) {
    return next(new ErrorResponse('Invalid period. Use 7days, 30days, or 90days', 400));
  }

  // Try cache first
  const cacheKey = `performance:${period}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const performanceData = await analyticsService.getPerformanceData(period);

  // Cache for 5 minutes
  cache.set(cacheKey, performanceData, 300);

  res.status(200).json({
    success: true,
    data: performanceData
  });
});

/**
 * @desc    Mark event as read
 * @route   PUT /api/dashboard/events/:id/read
 * @access  Private
 */
exports.markEventAsRead = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  await event.markAsRead();

  res.status(200).json({
    success: true,
    message: 'Event marked as read'
  });
});

/**
 * @desc    Mark all events as read
 * @route   PUT /api/dashboard/events/read-all
 * @access  Private
 */
exports.markAllEventsAsRead = asyncHandler(async (req, res, next) => {
  await Event.markAllAsRead();

  res.status(200).json({
    success: true,
    message: 'All events marked as read'
  });
});

/**
 * @desc    Get unread event count
 * @route   GET /api/dashboard/events/unread-count
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Event.getUnreadCount();

  res.status(200).json({
    success: true,
    data: { count }
  });
});

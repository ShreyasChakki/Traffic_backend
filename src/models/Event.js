const mongoose = require('mongoose');

/**
 * Event Schema
 * Stores system events, alerts, and notifications
 */
const EventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sync', 'alert', 'override', 'maintenance'],
    required: [true, 'Please provide event type']
  },
  intersectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intersection',
    index: true
  },
  message: {
    type: String,
    required: [true, 'Please provide event message'],
    trim: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

// Indexes
EventSchema.index({ timestamp: -1 });
EventSchema.index({ type: 1 });
EventSchema.index({ severity: 1 });
EventSchema.index({ isRead: 1 });

/**
 * Mark event as read
 */
EventSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return await this.save();
};

/**
 * Get relative time (e.g., "2 mins ago")
 */
EventSchema.methods.getRelativeTime = function() {
  const now = new Date();
  const diff = Math.floor((now - this.timestamp) / 1000); // seconds

  if (diff < 60) return `${diff} secs ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

/**
 * Static method to get recent events
 * @param {Number} limit - Number of events to fetch
 * @param {String} type - Filter by event type
 */
EventSchema.statics.getRecent = async function(limit = 10, type = null) {
  const query = type ? { type } : {};
  return await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('intersectionId', 'name code')
    .populate('userId', 'name email');
};

/**
 * Static method to get unread count
 */
EventSchema.statics.getUnreadCount = async function() {
  return await this.countDocuments({ isRead: false });
};

/**
 * Static method to mark all as read
 */
EventSchema.statics.markAllAsRead = async function() {
  return await this.updateMany({ isRead: false }, { isRead: true });
};

module.exports = mongoose.model('Event', EventSchema);

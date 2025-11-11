const mongoose = require('mongoose');

/**
 * Intersection Schema
 * Represents a traffic intersection with signal and traffic data
 */
const IntersectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide intersection name'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  location: {
    latitude: {
      type: Number,
      required: [true, 'Please provide latitude']
    },
    longitude: {
      type: Number,
      required: [true, 'Please provide longitude']
    },
    address: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  currentSignal: {
    type: String,
    enum: ['red', 'yellow', 'green'],
    default: 'red'
  },
  vehicleCount: {
    type: Number,
    default: 0,
    min: 0
  },
  waitTime: {
    type: Number,
    default: 0,
    min: 0
  },
  signalTiming: {
    red: {
      type: Number,
      default: 60
    },
    yellow: {
      type: Number,
      default: 5
    },
    green: {
      type: Number,
      default: 60
    }
  },
  isAdaptive: {
    type: Boolean,
    default: true
  },
  lastSyncTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes (code already indexed via unique: true)
IntersectionSchema.index({ status: 1 });
IntersectionSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

/**
 * Update traffic data for intersection
 * @param {Number} vehicleCount - Current vehicle count
 * @param {Number} waitTime - Current wait time in seconds
 */
IntersectionSchema.methods.updateTrafficData = async function(vehicleCount, waitTime) {
  this.vehicleCount = vehicleCount;
  this.waitTime = waitTime;
  this.lastSyncTime = Date.now();
  return await this.save();
};

/**
 * Change signal state
 * @param {String} newSignal - New signal state (red/yellow/green)
 */
IntersectionSchema.methods.changeSignal = async function(newSignal) {
  if (!['red', 'yellow', 'green'].includes(newSignal)) {
    throw new Error('Invalid signal state');
  }
  this.currentSignal = newSignal;
  this.lastSyncTime = Date.now();
  return await this.save();
};

/**
 * Sync signals - update last sync time
 */
IntersectionSchema.methods.syncSignals = async function() {
  this.lastSyncTime = Date.now();
  return await this.save();
};

/**
 * Calculate congestion level based on vehicle count
 */
IntersectionSchema.methods.getCongestionLevel = function() {
  if (this.vehicleCount <= 30) return 'low';
  if (this.vehicleCount <= 60) return 'medium';
  return 'high';
};

/**
 * Auto-generate code before saving
 */
IntersectionSchema.pre('save', async function(next) {
  if (!this.code) {
    // Generate code from name (e.g., "MG Road Junction" -> "MGRJ001")
    const initials = this.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
    
    // Find highest number for this prefix
    const lastIntersection = await this.constructor
      .findOne({ code: new RegExp(`^${initials}`) })
      .sort({ code: -1 });
    
    let number = 1;
    if (lastIntersection && lastIntersection.code) {
      const lastNumber = parseInt(lastIntersection.code.slice(-3));
      number = lastNumber + 1;
    }
    
    this.code = `${initials}${number.toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Intersection', IntersectionSchema);

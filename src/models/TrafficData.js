const mongoose = require('mongoose');

/**
 * Traffic Data Schema
 * Stores historical traffic data for intersections
 */
const TrafficDataSchema = new mongoose.Schema({
  intersectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intersection',
    required: [true, 'Please provide intersection ID'],
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  vehicleCount: {
    type: Number,
    required: [true, 'Please provide vehicle count'],
    min: 0
  },
  waitTime: {
    type: Number,
    default: 0,
    min: 0
  },
  congestionLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  signalState: {
    type: String,
    enum: ['red', 'yellow', 'green'],
    required: true
  },
  averageSpeed: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
    temperature: Number,
    weather: String,
    dayOfWeek: String,
    hour: Number
  }
});

// Compound index for efficient queries
TrafficDataSchema.index({ intersectionId: 1, timestamp: -1 });
TrafficDataSchema.index({ timestamp: -1 });
TrafficDataSchema.index({ congestionLevel: 1 });

/**
 * Get average traffic data by intersection for a date range
 * @param {ObjectId} intersectionId - Intersection ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
TrafficDataSchema.statics.getAverageByIntersection = async function(intersectionId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        intersectionId: mongoose.Types.ObjectId(intersectionId),
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        avgVehicleCount: { $avg: '$vehicleCount' },
        avgWaitTime: { $avg: '$waitTime' },
        avgSpeed: { $avg: '$averageSpeed' },
        maxVehicleCount: { $max: '$vehicleCount' },
        minVehicleCount: { $min: '$vehicleCount' }
      }
    }
  ]);
};

/**
 * Get peak hours for an intersection
 * @param {ObjectId} intersectionId - Intersection ID
 */
TrafficDataSchema.statics.getPeakHours = async function(intersectionId) {
  return await this.aggregate([
    {
      $match: { intersectionId: mongoose.Types.ObjectId(intersectionId) }
    },
    {
      $group: {
        _id: { $hour: '$timestamp' },
        avgVehicleCount: { $avg: '$vehicleCount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { avgVehicleCount: -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        hour: '$_id',
        avgVehicleCount: 1,
        _id: 0
      }
    }
  ]);
};

/**
 * Get congestion trend over a period
 * @param {String} period - Period (7days/30days/90days)
 */
TrafficDataSchema.statics.getCongestionTrend = async function(period) {
  const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          congestionLevel: '$congestionLevel'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        low: {
          $sum: { $cond: [{ $eq: ['$_id.congestionLevel', 'low'] }, '$count', 0] }
        },
        medium: {
          $sum: { $cond: [{ $eq: ['$_id.congestionLevel', 'medium'] }, '$count', 0] }
        },
        high: {
          $sum: { $cond: [{ $eq: ['$_id.congestionLevel', 'high'] }, '$count', 0] }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

/**
 * Auto-populate metadata before saving
 */
TrafficDataSchema.pre('save', function(next) {
  if (!this.metadata.dayOfWeek) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.metadata.dayOfWeek = days[this.timestamp.getDay()];
  }
  if (!this.metadata.hour) {
    this.metadata.hour = this.timestamp.getHours();
  }
  next();
});

module.exports = mongoose.model('TrafficData', TrafficDataSchema);

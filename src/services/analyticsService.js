const Intersection = require('../models/Intersection');
const TrafficData = require('../models/TrafficData');
const Event = require('../models/Event');
const cache = require('../utils/cache');

/**
 * Analytics Service
 * Handles data aggregation and calculations for dashboard
 */

class AnalyticsService {
  /**
   * Calculate dashboard statistics
   * @returns {Object} Dashboard stats
   */
  async calculateStats() {
    // Try to get from cache first
    const cached = cache.get('dashboard:stats');
    if (cached) {
      return cached;
    }

    // Count intersections
    const totalIntersections = await Intersection.countDocuments();
    const activeIntersections = await Intersection.countDocuments({ status: 'active' });

    // Get all active intersections
    const intersections = await Intersection.find({ status: 'active' });

    // Calculate current traffic flow (sum of all vehicle counts)
    const trafficFlow = intersections.reduce((sum, int) => sum + int.vehicleCount, 0);

    // Calculate average wait time
    const totalWaitTime = intersections.reduce((sum, int) => sum + int.waitTime, 0);
    const avgWaitTime = activeIntersections > 0 
      ? Math.round(totalWaitTime / activeIntersections) 
      : 0;

    // Count active alerts (warning/error severity)
    const activeAlerts = await Event.countDocuments({
      severity: { $in: ['warning', 'error'] },
      timestamp: { $gte: new Date(Date.now() - 3600000) } // Last hour
    });

    // Calculate trends (compare with 1 hour ago)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const oldData = await TrafficData.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(oneHourAgo.getTime() - 300000), // 5 min window
            $lte: oneHourAgo
          }
        }
      },
      {
        $group: {
          _id: null,
          avgVehicleCount: { $avg: '$vehicleCount' },
          avgWaitTime: { $avg: '$waitTime' }
        }
      }
    ]);

    let trafficFlowTrend = 0;
    let waitTimeTrend = 0;

    if (oldData.length > 0) {
      const oldAvgVehicles = oldData[0].avgVehicleCount || 1;
      const oldAvgWait = oldData[0].avgWaitTime || 1;
      
      trafficFlowTrend = Math.round(((trafficFlow / activeIntersections - oldAvgVehicles) / oldAvgVehicles) * 100);
      waitTimeTrend = Math.round(((avgWaitTime - oldAvgWait) / oldAvgWait) * 100);
    }

    const stats = {
      totalIntersections,
      activeIntersections,
      trafficFlow,
      trafficFlowTrend,
      avgWaitTime,
      waitTimeTrend,
      activeAlerts,
      lastUpdate: new Date().toISOString()
    };

    // Cache for 5 seconds
    cache.set('dashboard:stats', stats, 5);

    return stats;
  }

  /**
   * Get trend data for a metric over a period
   * @param {String} metric - Metric name (vehicleCount, waitTime, etc.)
   * @param {String} period - Period (7days/30days/90days)
   * @returns {Array} Trend data
   */
  async getTrendData(metric, period = '7days') {
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await TrafficData.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          avgValue: { $avg: `$${metric}` },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          value: { $round: ['$avgValue', 2] },
          _id: 0
        }
      }
    ]);

    return data;
  }

  /**
   * Get top congested intersections
   * @param {Number} limit - Number of intersections to return
   * @returns {Array} Top congested intersections
   */
  async getTopCongested(limit = 10) {
    return await Intersection.find({ status: 'active' })
      .sort({ vehicleCount: -1 })
      .limit(limit)
      .select('name code vehicleCount waitTime currentSignal location');
  }

  /**
   * Calculate efficiency score for an intersection
   * @param {ObjectId} intersectionId - Intersection ID
   * @returns {Number} Efficiency score (0-100)
   */
  async getEfficiencyScore(intersectionId) {
    const intersection = await Intersection.findById(intersectionId);
    if (!intersection) {
      throw new Error('Intersection not found');
    }

    // Target wait time (in seconds)
    const targetWaitTime = 30;

    // Get recent traffic data (last hour)
    const recentData = await TrafficData.find({
      intersectionId,
      timestamp: { $gte: new Date(Date.now() - 3600000) }
    });

    if (recentData.length === 0) {
      return 50; // Default score if no data
    }

    // Calculate average wait time
    const avgWaitTime = recentData.reduce((sum, d) => sum + d.waitTime, 0) / recentData.length;

    // Calculate efficiency score
    // Lower wait time = higher efficiency
    let score = 100 - ((avgWaitTime / targetWaitTime) * 100);
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return Math.round(score);
  }

  /**
   * Get performance data over a period
   * @param {String} period - Period (7days/30days/90days)
   * @returns {Array} Performance data by date
   */
  async getPerformanceData(period = '7days') {
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const targetWaitTime = 30; // Target wait time in seconds

    const data = await TrafficData.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          avgWaitTime: { $avg: '$waitTime' },
          avgVehicleCount: { $avg: '$vehicleCount' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          efficiency: {
            $round: [
              {
                $max: [
                  0,
                  {
                    $min: [
                      100,
                      { $subtract: [100, { $multiply: [{ $divide: ['$avgWaitTime', targetWaitTime] }, 100] }] }
                    ]
                  }
                ]
              },
              0
            ]
          },
          _id: 0
        }
      }
    ]);

    return data;
  }

  /**
   * Get traffic status for all intersections
   * @returns {Array} Traffic status data
   */
  async getTrafficStatus() {
    // Try cache first
    const cached = cache.get('dashboard:traffic-status');
    if (cached) {
      return cached;
    }

    const intersections = await Intersection.find({ status: 'active' })
      .select('name code status currentSignal vehicleCount waitTime location')
      .lean();

    const status = intersections.map(int => ({
      id: int._id,
      name: int.name,
      code: int.code,
      status: int.status,
      currentSignal: int.currentSignal,
      vehicleCount: int.vehicleCount,
      waitTime: int.waitTime,
      congestionLevel: this.calculateCongestionLevel(int.vehicleCount),
      location: {
        lat: int.location.latitude,
        lng: int.location.longitude
      }
    }));

    // Sort by congestion (high to low)
    status.sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.congestionLevel] - order[a.congestionLevel];
    });

    // Cache for 3 seconds
    cache.set('dashboard:traffic-status', status, 3);

    return status;
  }

  /**
   * Calculate congestion level based on vehicle count
   * @param {Number} vehicleCount - Vehicle count
   * @returns {String} Congestion level
   */
  calculateCongestionLevel(vehicleCount) {
    if (vehicleCount <= 30) return 'low';
    if (vehicleCount <= 60) return 'medium';
    return 'high';
  }
}

module.exports = new AnalyticsService();

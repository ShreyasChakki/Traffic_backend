const trafficSimulator = require('./trafficSimulator');
const TrafficData = require('../models/TrafficData');
const Event = require('../models/Event');
const logger = require('../utils/logger');
const { broadcastStatsUpdate, broadcastTrafficUpdate } = require('../socket/dashboardSocket');

/**
 * Background Jobs Service
 * Manages scheduled tasks and background processes
 */

class JobsService {
  constructor() {
    this.intervals = {};
  }

  /**
   * Start all background jobs
   */
  startAll() {
    logger.info('Starting background jobs...');

    // Start traffic simulator
    trafficSimulator.start();

    // Broadcast stats update every 10 seconds
    this.intervals.statsUpdate = setInterval(() => {
      if (global.io) {
        broadcastStatsUpdate(global.io);
      }
    }, 10000);

    // Broadcast traffic update every 5 seconds
    this.intervals.trafficUpdate = setInterval(() => {
      if (global.io) {
        broadcastTrafficUpdate(global.io);
      }
    }, 5000);

    // Data cleanup job - runs every hour
    this.intervals.dataCleanup = setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // 1 hour

    // Run initial cleanup
    this.cleanupOldData();

    logger.success('All background jobs started');
  }

  /**
   * Stop all background jobs
   */
  stopAll() {
    logger.info('Stopping background jobs...');

    // Stop traffic simulator
    trafficSimulator.stop();

    // Clear all intervals
    Object.keys(this.intervals).forEach(key => {
      clearInterval(this.intervals[key]);
    });

    this.intervals = {};

    logger.info('All background jobs stopped');
  }

  /**
   * Clean up old data
   * Removes traffic data older than 90 days
   * Removes events older than 30 days
   */
  async cleanupOldData() {
    try {
      logger.info('Running data cleanup job...');

      // Delete traffic data older than 90 days
      const trafficDataCutoff = new Date();
      trafficDataCutoff.setDate(trafficDataCutoff.getDate() - 90);

      const deletedTrafficData = await TrafficData.deleteMany({
        timestamp: { $lt: trafficDataCutoff }
      });

      // Delete events older than 30 days
      const eventsCutoff = new Date();
      eventsCutoff.setDate(eventsCutoff.getDate() - 30);

      const deletedEvents = await Event.deleteMany({
        timestamp: { $lt: eventsCutoff }
      });

      logger.success(
        `Data cleanup completed: ${deletedTrafficData.deletedCount} traffic records, ` +
        `${deletedEvents.deletedCount} events deleted`
      );
    } catch (error) {
      logger.error('Error during data cleanup:', error.message);
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      trafficSimulator: trafficSimulator.isRunning,
      activeJobs: Object.keys(this.intervals).length,
      jobs: Object.keys(this.intervals)
    };
  }
}

module.exports = new JobsService();

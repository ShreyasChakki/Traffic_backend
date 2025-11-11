const Intersection = require('../models/Intersection');
const TrafficData = require('../models/TrafficData');
const Event = require('../models/Event');
const logger = require('../utils/logger');

/**
 * Traffic Simulator Service
 * Generates realistic traffic data for testing and demo
 */

class TrafficSimulator {
  constructor() {
    this.isRunning = false;
    this.dataInterval = null;
    this.eventInterval = null;
    this.signalInterval = null;
  }

  /**
   * Start traffic simulation
   */
  start() {
    if (this.isRunning) {
      logger.warn('Traffic simulator is already running');
      return;
    }

    this.isRunning = true;
    logger.success('Traffic simulator started');

    // Generate traffic data every 5 seconds
    this.dataInterval = setInterval(() => {
      this.generateTrafficData();
    }, 5000);

    // Generate events every 10 seconds
    this.eventInterval = setInterval(() => {
      this.generateRandomEvent();
    }, 10000);

    // Cycle signals every 60 seconds
    this.signalInterval = setInterval(() => {
      this.cycleSignals();
    }, 60000);

    // Initial data generation
    this.generateTrafficData();
  }

  /**
   * Stop traffic simulation
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    clearInterval(this.dataInterval);
    clearInterval(this.eventInterval);
    clearInterval(this.signalInterval);
    
    this.isRunning = false;
    logger.info('Traffic simulator stopped');
  }

  /**
   * Generate realistic traffic data
   */
  async generateTrafficData() {
    try {
      const intersections = await Intersection.find({ status: 'active' });

      for (const intersection of intersections) {
        // Get base vehicle count with time-based patterns
        const baseCount = this.getBaseVehicleCount();
        
        // Add random variation (±20%)
        const variation = Math.floor(baseCount * 0.2 * (Math.random() - 0.5) * 2);
        const vehicleCount = Math.max(0, baseCount + variation);

        // Calculate wait time based on vehicle count and signal state
        const waitTime = this.calculateWaitTime(vehicleCount, intersection.currentSignal);

        // Determine congestion level
        const congestionLevel = this.getCongestionLevel(vehicleCount);

        // Calculate average speed (inverse to congestion)
        const averageSpeed = this.calculateAverageSpeed(congestionLevel);

        // Update intersection
        await intersection.updateTrafficData(vehicleCount, waitTime);

        // Create traffic data record
        await TrafficData.create({
          intersectionId: intersection._id,
          timestamp: new Date(),
          vehicleCount,
          waitTime,
          congestionLevel,
          signalState: intersection.currentSignal,
          averageSpeed,
          metadata: {
            temperature: Math.floor(Math.random() * 15) + 20,
            weather: this.getRandomWeather(),
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            hour: new Date().getHours()
          }
        });

        // Emit socket event if global.io exists
        if (global.io) {
          global.io.to('dashboard').emit('traffic-update', {
            intersectionId: intersection._id,
            name: intersection.name,
            vehicleCount,
            waitTime,
            congestionLevel,
            currentSignal: intersection.currentSignal,
            timestamp: new Date().toISOString()
          });
        }

        // Create congestion alert if high
        if (congestionLevel === 'high' && Math.random() < 0.1) {
          await this.createCongestionAlert(intersection);
        }
      }

      logger.debug(`Generated traffic data for ${intersections.length} intersections`);
    } catch (error) {
      logger.error('Error generating traffic data:', error.message);
    }
  }

  /**
   * Get base vehicle count based on time of day
   */
  getBaseVehicleCount() {
    const hour = new Date().getHours();

    // Peak hours: 7-9 AM and 5-7 PM
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return Math.floor(Math.random() * 40) + 40;
    }

    // Business hours: 10 AM - 4 PM
    if (hour >= 10 && hour <= 16) {
      return Math.floor(Math.random() * 30) + 20;
    }

    // Off-peak hours
    return Math.floor(Math.random() * 20) + 5;
  }

  /**
   * Calculate wait time based on vehicle count and signal
   */
  calculateWaitTime(vehicleCount, signalState) {
    let baseWaitTime = vehicleCount * 0.5;

    if (signalState === 'red') {
      baseWaitTime *= 1.5;
    } else if (signalState === 'green') {
      baseWaitTime *= 0.5;
    }

    return Math.round(baseWaitTime);
  }

  /**
   * Get congestion level based on vehicle count
   */
  getCongestionLevel(vehicleCount) {
    if (vehicleCount <= 30) return 'low';
    if (vehicleCount <= 60) return 'medium';
    return 'high';
  }

  /**
   * Calculate average speed based on congestion
   */
  calculateAverageSpeed(congestionLevel) {
    const speeds = {
      low: Math.floor(Math.random() * 20) + 40,
      medium: Math.floor(Math.random() * 15) + 25,
      high: Math.floor(Math.random() * 15) + 10
    };
    return speeds[congestionLevel];
  }

  /**
   * Get random weather condition
   */
  getRandomWeather() {
    const conditions = ['Clear', 'Cloudy', 'Rainy', 'Foggy'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  /**
   * Generate random event
   */
  async generateRandomEvent() {
    try {
      const eventTypes = [
        { type: 'sync', severity: 'success', weight: 0.4 },
        { type: 'maintenance', severity: 'info', weight: 0.2 },
        { type: 'alert', severity: 'warning', weight: 0.3 },
        { type: 'override', severity: 'info', weight: 0.1 }
      ];

      const random = Math.random();
      let sum = 0;
      let selectedType = eventTypes[0];

      for (const eventType of eventTypes) {
        sum += eventType.weight;
        if (random <= sum) {
          selectedType = eventType;
          break;
        }
      }

      const intersections = await Intersection.find({ status: 'active' });
      if (intersections.length === 0) return;

      const intersection = intersections[Math.floor(Math.random() * intersections.length)];

      const messages = {
        sync: `Signal sync completed at ${intersection.name}`,
        maintenance: `Scheduled maintenance at ${intersection.name}`,
        alert: `Traffic congestion detected at ${intersection.name}`,
        override: `Manual override activated at ${intersection.name}`
      };

      const event = await Event.create({
        type: selectedType.type,
        intersectionId: intersection._id,
        message: messages[selectedType.type],
        severity: selectedType.severity,
        timestamp: new Date()
      });

      if (global.io) {
        const eventData = {
          id: event._id,
          type: event.type,
          message: event.message,
          severity: event.severity,
          timestamp: event.timestamp.toISOString(),
          relativeTime: event.getRelativeTime(),
          intersection: intersection.name
        };

        global.io.to('dashboard').emit('new-event', eventData);
      }

      logger.debug(`Generated event: ${selectedType.type} at ${intersection.name}`);
    } catch (error) {
      logger.error('Error generating event:', error.message);
    }
  }

  /**
   * Create congestion alert
   */
  async createCongestionAlert(intersection) {
    try {
      const event = await Event.create({
        type: 'alert',
        intersectionId: intersection._id,
        message: `High congestion at ${intersection.name} - ${intersection.vehicleCount} vehicles`,
        severity: 'warning',
        timestamp: new Date(),
        metadata: {
          vehicleCount: intersection.vehicleCount,
          waitTime: intersection.waitTime
        }
      });

      if (global.io) {
        global.io.to('dashboard').emit('congestion-alert', {
          id: event._id,
          intersectionId: intersection._id,
          name: intersection.name,
          vehicleCount: intersection.vehicleCount,
          waitTime: intersection.waitTime,
          congestionLevel: 'high',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Error creating congestion alert:', error.message);
    }
  }

  /**
   * Cycle traffic signals
   */
  async cycleSignals() {
    try {
      const intersections = await Intersection.find({ status: 'active' });

      for (const intersection of intersections) {
        let nextSignal;
        switch (intersection.currentSignal) {
          case 'red':
            nextSignal = 'green';
            break;
          case 'green':
            nextSignal = 'yellow';
            break;
          case 'yellow':
            nextSignal = 'red';
            break;
          default:
            nextSignal = 'red';
        }

        await intersection.changeSignal(nextSignal);

        if (global.io) {
          global.io.to('map').emit('signal-changed', {
            intersectionId: intersection._id,
            name: intersection.name,
            signalState: nextSignal,
            timestamp: new Date().toISOString()
          });
        }
      }

      logger.debug('Signals cycled for all intersections');
    } catch (error) {
      logger.error('Error cycling signals:', error.message);
    }
  }
}

module.exports = new TrafficSimulator();

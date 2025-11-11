/**
 * Data Generator Utilities
 * Generate random data for testing and seeding
 */

const { CONGESTION_LEVELS, ALERT_TYPES, ALERT_PRIORITIES } = require('../config/constants');

/**
 * Generate random number between min and max
 */
const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate random element from array
 */
const randomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generate random congestion level
 */
exports.generateCongestionLevel = () => {
  const levels = Object.values(CONGESTION_LEVELS);
  const weights = [0.4, 0.3, 0.2, 0.1]; // Low, Medium, High, Critical
  const random = Math.random();
  let sum = 0;
  
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random <= sum) {
      return levels[i];
    }
  }
  
  return levels[0];
};

/**
 * Generate random vehicle count
 */
exports.generateVehicleCount = (congestionLevel) => {
  const ranges = {
    low: [5, 20],
    medium: [21, 40],
    high: [41, 60],
    critical: [61, 100]
  };
  
  const range = ranges[congestionLevel] || [5, 20];
  return randomNumber(range[0], range[1]);
};

/**
 * Generate random signal timing (in seconds)
 */
exports.generateSignalTiming = () => {
  return {
    green: randomNumber(30, 90),
    yellow: randomNumber(3, 5),
    red: randomNumber(30, 90)
  };
};

/**
 * Generate random traffic data
 */
exports.generateRandomTrafficData = () => {
  const congestionLevel = this.generateCongestionLevel();
  
  return {
    vehicleCount: this.generateVehicleCount(congestionLevel),
    congestionLevel,
    averageSpeed: randomNumber(10, 60),
    queueLength: randomNumber(0, 20),
    timestamp: new Date()
  };
};

/**
 * Generate random intersection data
 */
exports.generateIntersectionData = (name, coordinates) => {
  const congestionLevel = this.generateCongestionLevel();
  
  return {
    name,
    location: {
      type: 'Point',
      coordinates // [longitude, latitude]
    },
    status: randomElement(['active', 'inactive', 'maintenance']),
    congestionLevel,
    vehicleCount: this.generateVehicleCount(congestionLevel),
    signalTiming: this.generateSignalTiming(),
    lastUpdated: new Date()
  };
};

/**
 * Generate random alert data
 */
exports.generateAlertData = () => {
  const types = Object.values(ALERT_TYPES);
  const priorities = Object.values(ALERT_PRIORITIES);
  
  const alertType = randomElement(types);
  
  const descriptions = {
    accident: 'Vehicle collision reported',
    congestion: 'Heavy traffic congestion detected',
    emergency: 'Emergency vehicle approaching',
    maintenance: 'Road maintenance in progress'
  };
  
  return {
    type: alertType,
    priority: randomElement(priorities),
    description: descriptions[alertType],
    location: {
      type: 'Point',
      coordinates: [
        randomNumber(72, 78) + Math.random(), // Longitude (India range)
        randomNumber(12, 28) + Math.random()  // Latitude (India range)
      ]
    },
    status: 'active',
    createdAt: new Date()
  };
};

/**
 * Generate sample intersection names
 */
exports.getSampleIntersections = () => {
  return [
    { name: 'MG Road Junction', coordinates: [77.6033, 12.9716] },
    { name: 'Brigade Road Cross', coordinates: [77.6082, 12.9726] },
    { name: 'Indiranagar 100ft Road', coordinates: [77.6408, 12.9784] },
    { name: 'Koramangala 5th Block', coordinates: [77.6193, 12.9352] },
    { name: 'Whitefield Main Road', coordinates: [77.7499, 12.9698] },
    { name: 'Electronic City Junction', coordinates: [77.6648, 12.8456] },
    { name: 'Hebbal Flyover', coordinates: [77.5971, 13.0358] },
    { name: 'Silk Board Junction', coordinates: [77.6229, 12.9165] },
    { name: 'Marathahalli Bridge', coordinates: [77.6976, 12.9591] },
    { name: 'Bannerghatta Road', coordinates: [77.5946, 12.8996] }
  ];
};

/**
 * Generate time series data
 */
exports.generateTimeSeriesData = (hours = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    data.push({
      timestamp,
      ...this.generateRandomTrafficData()
    });
  }
  
  return data;
};

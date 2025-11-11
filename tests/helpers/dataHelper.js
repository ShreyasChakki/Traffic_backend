const Event = require('../../src/models/Event');
const Intersection = require('../../src/models/Intersection');
const TrafficData = require('../../src/models/TrafficData');

/**
 * Create test intersection
 */
const createTestIntersection = async (data = {}) => {
  const defaultData = {
    name: 'Test Intersection',
    code: 'INT-001',
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Test Address, Bangalore',
    },
    status: 'active',
    currentSignal: 'red',
    vehicleCount: 0,
    waitTime: 0,
    ...data,
  };

  return await Intersection.create(defaultData);
};

/**
 * Create multiple test intersections
 */
const createTestIntersections = async (count = 3) => {
  const intersections = [];
  for (let i = 0; i < count; i++) {
    const intersection = await createTestIntersection({
      name: `Test Intersection ${i + 1}`,
      code: `INT-00${i + 1}`,
      location: {
        latitude: 12.9716 + i * 0.01,
        longitude: 77.5946 + i * 0.01,
        address: `Test Address ${i + 1}, Bangalore`,
      },
    });
    intersections.push(intersection);
  }
  return intersections;
};

/**
 * Create test event
 */
const createTestEvent = async (data = {}) => {
  const defaultData = {
    type: 'alert',
    message: 'Test event message',
    severity: 'info',
    ...data,
  };

  return await Event.create(defaultData);
};

/**
 * Create multiple test events
 */
const createTestEvents = async (count = 5, intersectionId = null) => {
  const events = [];
  const types = ['sync', 'alert', 'override', 'maintenance'];
  const severities = ['info', 'warning', 'error', 'success'];

  for (let i = 0; i < count; i++) {
    const event = await createTestEvent({
      type: types[i % types.length],
      message: `Test event ${i + 1}`,
      severity: severities[i % severities.length],
      intersectionId: intersectionId,
      isRead: i % 2 === 0, // Alternate read/unread
    });
    events.push(event);
  }
  return events;
};

/**
 * Create test traffic data
 */
const createTestTrafficData = async (intersectionId, data = {}) => {
  const defaultData = {
    intersectionId,
    timestamp: new Date(),
    vehicleCount: 50,
    waitTime: 30,
    averageSpeed: 40,
    congestionLevel: 'medium',
    signalState: 'green',
    metadata: {
      temperature: 25,
      weather: 'clear',
    },
    ...data,
  };

  return await TrafficData.create(defaultData);
};

module.exports = {
  createTestIntersection,
  createTestIntersections,
  createTestEvent,
  createTestEvents,
  createTestTrafficData,
};

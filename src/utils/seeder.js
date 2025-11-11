const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('../utils/logger');

// Load env vars
dotenv.config();

// Load models
const User = require('../models/User');
const Intersection = require('../models/Intersection');
const Event = require('../models/Event');

// Load data generator
const {
  getSampleIntersections,
  generateIntersectionData,
  generateAlertData
} = require('./dataGenerator');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

/**
 * Seed database with sample data
 */
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany();
    await Intersection.deleteMany();
    await Event.deleteMany();
    console.log('✅ Existing data cleared\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@smarttraffic.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log(`✅ Admin created: ${admin.email}\n`);

    // Create operator user
    console.log('👤 Creating operator user...');
    const operator = await User.create({
      name: 'Operator User',
      email: 'operator@smarttraffic.com',
      password: 'operator123',
      role: 'operator'
    });
    console.log(`✅ Operator created: ${operator.email}\n`);

    // Create viewer user
    console.log('👤 Creating viewer user...');
    const viewer = await User.create({
      name: 'Viewer User',
      email: 'viewer@smarttraffic.com',
      password: 'viewer123',
      role: 'viewer'
    });
    console.log(`✅ Viewer created: ${viewer.email}\n`);

    // Create sample intersections
    console.log('🚦 Creating sample intersections...');
    const sampleIntersections = getSampleIntersections();
    const intersections = [];

    for (const sample of sampleIntersections) {
      const intersection = await Intersection.create({
        name: sample.name,
        location: {
          latitude: sample.coordinates[1],
          longitude: sample.coordinates[0],
          address: sample.name
        },
        status: 'active',
        currentSignal: ['red', 'yellow', 'green'][Math.floor(Math.random() * 3)],
        vehicleCount: Math.floor(Math.random() * 50),
        waitTime: Math.floor(Math.random() * 60),
        signalTiming: {
          red: 60,
          yellow: 5,
          green: 60
        },
        isAdaptive: true
      });
      intersections.push(intersection);
    }
    console.log(`✅ Created ${intersections.length} intersections\n`);

    // Create sample events
    console.log('📋 Creating sample events...');
    const eventTypes = ['sync', 'alert', 'maintenance', 'override'];
    const severities = ['info', 'warning', 'error', 'success'];
    
    for (let i = 0; i < 10; i++) {
      const randomIntersection = intersections[Math.floor(Math.random() * intersections.length)];
      await Event.create({
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        intersectionId: randomIntersection._id,
        message: `Sample event at ${randomIntersection.name}`,
        severity: severities[Math.floor(Math.random() * severities.length)],
        timestamp: new Date(Date.now() - Math.random() * 3600000) // Random time in last hour
      });
    }
    console.log('✅ Created 10 sample events\n');

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📝 Sample Users:');
    console.log('   Admin    - admin@smarttraffic.com / admin123');
    console.log('   Operator - operator@smarttraffic.com / operator123');
    console.log('   Viewer   - viewer@smarttraffic.com / viewer123\n');
    console.log(`📍 Created ${intersections.length} intersections`);
    console.log('📋 Created 10 sample events\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

/**
 * Delete all data
 */
const deleteData = async () => {
  try {
    console.log('🗑️  Deleting all data...\n');

    await User.deleteMany();
    await Intersection.deleteMany();
    await Event.deleteMany();

    console.log('✅ All data deleted successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting data:', error);
    process.exit(1);
  }
};

// Run seeder based on command line argument
if (process.argv[2] === '-d') {
  deleteData();
} else {
  seedData();
}

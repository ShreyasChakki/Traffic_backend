/**
 * Verify MongoDB Atlas Connection and Data
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function verifyMongoDB() {
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     MongoDB Atlas Connection Verification     ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('🔌 Connecting to MongoDB Atlas...');
    console.log('   URI:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@'));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully!\n');

    // Get database info
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log('📊 Database:', dbName);

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:', collections.length);
    
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   ├─ ${collection.name}: ${count} documents`);
    }

    // Check users
    console.log('\n👥 Users in database:');
    const User = require('./src/models/User');
    const users = await User.find({}, 'name email role createdAt');
    
    if (users.length === 0) {
      console.log('   No users found');
    } else {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
        console.log(`      Created: ${user.createdAt}`);
      });
    }

    // Check refresh tokens
    console.log('\n🔑 Refresh Tokens:');
    const RefreshToken = require('./src/models/RefreshToken');
    const tokens = await RefreshToken.find({}, 'userId isActive expiresAt');
    console.log(`   Total: ${tokens.length}`);
    console.log(`   Active: ${tokens.filter(t => t.isActive).length}`);

    console.log('\n' + '═'.repeat(50));
    console.log('✅ MongoDB Atlas is working perfectly!');
    console.log('✅ Data is being persisted to the cloud');
    console.log('═'.repeat(50) + '\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

verifyMongoDB();

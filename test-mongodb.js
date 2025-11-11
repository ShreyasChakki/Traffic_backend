require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('📍 URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    console.log('');
    
    console.log('⏳ Connecting...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    });
    
    console.log('');
    console.log('✅ MongoDB connection successful!');
    console.log('📡 Host:', mongoose.connection.host);
    console.log('🗄️  Database:', mongoose.connection.name);
    console.log('🔌 Ready State:', mongoose.connection.readyState); // 1 = connected
    console.log('');
    
    // Test a simple query
    console.log('🧪 Testing database query...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.length);
    collections.forEach(col => console.log('   -', col.name));
    console.log('');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully.');
    console.log('');
    console.log('🎉 All tests passed! Your MongoDB connection is working.');
    process.exit(0);
  } catch (error) {
    console.log('');
    console.error('❌ MongoDB connection failed!');
    console.error('📛 Error:', error.message);
    console.log('');
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify MongoDB Atlas cluster is running');
    console.log('   3. Check if your IP is whitelisted in MongoDB Atlas');
    console.log('   4. Verify credentials are correct');
    console.log('   5. Try flushing DNS cache: ipconfig /flushdns');
    console.log('');
    console.log('📖 See MONGODB_TROUBLESHOOTING.md for detailed solutions');
    process.exit(1);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('   MongoDB Connection Test');
console.log('═══════════════════════════════════════════════════');
console.log('');

testConnection();

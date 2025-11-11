const User = require('../models/User');

/**
 * Bootstrap owner account on server startup
 * This ensures there's always an owner account available
 * 
 * Usage:
 * Set OWNER_EMAIL in .env file
 * If user with this email exists -> ensure role is 'owner'
 * If user doesn't exist -> create as owner with default password
 */
const bootstrapOwner = async () => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL;

    if (!ownerEmail) {
      console.log('⚠️  OWNER_EMAIL not set in environment variables');
      console.log('⚠️  No owner account will be bootstrapped');
      return;
    }

    // Check if user with this email exists
    let owner = await User.findOne({ email: ownerEmail });

    if (owner) {
      // User exists - ensure role is owner
      if (owner.role !== 'owner') {
        owner.role = 'owner';
        owner.isActive = true;
        await owner.save();
        console.log(`✅ User ${ownerEmail} promoted to owner`);
      } else {
        console.log(`✅ Owner account exists: ${ownerEmail}`);
      }
    } else {
      // User doesn't exist - create owner account
      const defaultPassword = process.env.OWNER_DEFAULT_PASSWORD || 'Owner@123456';
      
      owner = await User.create({
        name: 'System Owner',
        email: ownerEmail,
        password: defaultPassword,
        role: 'owner',
        isActive: true
      });

      console.log(`✅ Owner account created: ${ownerEmail}`);
      console.log(`⚠️  Default password: ${defaultPassword}`);
      console.log(`⚠️  PLEASE CHANGE THE PASSWORD IMMEDIATELY!`);
    }

    return owner;
  } catch (error) {
    console.error('❌ Error bootstrapping owner account:', error.message);
    throw error;
  }
};

module.exports = bootstrapOwner;

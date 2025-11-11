const mongoose = require('mongoose');

/**
 * RefreshToken Schema
 * Stores refresh tokens for JWT authentication
 */
const RefreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdByIp: {
    type: String
  },
  revokedAt: {
    type: Date
  },
  revokedByIp: {
    type: String
  },
  replacedByToken: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

/**
 * Check if token is expired
 */
RefreshTokenSchema.virtual('isExpired').get(function() {
  return Date.now() >= this.expiresAt;
});

/**
 * Check if token is valid (active and not expired)
 */
RefreshTokenSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired && !this.revokedAt;
});

/**
 * Revoke token
 */
RefreshTokenSchema.methods.revoke = function(ip) {
  this.revokedAt = Date.now();
  this.revokedByIp = ip;
  this.isActive = false;
  return this.save();
};

/**
 * Static method to clean up expired tokens
 */
RefreshTokenSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

/**
 * Static method to revoke all tokens for a user
 */
RefreshTokenSchema.statics.revokeAllForUser = async function(userId, ip) {
  const result = await this.updateMany(
    { userId, isActive: true },
    { 
      revokedAt: new Date(),
      revokedByIp: ip,
      isActive: false
    }
  );
  return result.modifiedCount;
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);

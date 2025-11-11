const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const { ErrorResponse } = require('../middleware/errorHandler');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId, ip) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  return new RefreshToken({
    token,
    userId,
    expiresAt,
    createdByIp: ip
  });
};

/**
 * Get client IP address
 */
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip;
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Validate role
  const validRoles = ['admin', 'operator', 'viewer'];
  if (role && !validRoles.includes(role)) {
    return next(new ErrorResponse('Invalid role specified', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || 'viewer'
  });

  // Generate tokens
  const accessToken = user.getSignedJwtToken();
  const refreshToken = generateRefreshToken(user._id, getIpAddress(req));
  await refreshToken.save();

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken: refreshToken.token
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Check for user (include password)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorResponse('Account is deactivated. Please contact administrator', 403));
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Generate tokens
  const accessToken = user.getSignedJwtToken();
  const refreshToken = generateRefreshToken(user._id, getIpAddress(req));
  await refreshToken.save();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      accessToken,
      refreshToken: refreshToken.token
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new ErrorResponse('Refresh token is required', 400));
  }

  // Find refresh token
  const refreshToken = await RefreshToken.findOne({ token });

  if (!refreshToken) {
    return next(new ErrorResponse('Invalid refresh token', 401));
  }

  // Check if token is valid
  if (!refreshToken.isValid) {
    return next(new ErrorResponse('Refresh token is expired or revoked', 401));
  }

  // Get user
  const user = await User.findById(refreshToken.userId);

  if (!user || !user.isActive) {
    return next(new ErrorResponse('User not found or inactive', 401));
  }

  // Generate new tokens
  const newAccessToken = user.getSignedJwtToken();
  const newRefreshToken = generateRefreshToken(user._id, getIpAddress(req));
  
  // Replace old refresh token
  refreshToken.replacedByToken = newRefreshToken.token;
  await refreshToken.revoke(getIpAddress(req));
  await newRefreshToken.save();

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token
    }
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * @desc    Logout user (revoke refresh token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (token) {
    const refreshToken = await RefreshToken.findOne({ token });
    if (refreshToken) {
      await refreshToken.revoke(getIpAddress(req));
    }
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @desc    Logout from all devices (revoke all refresh tokens)
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
exports.logoutAll = asyncHandler(async (req, res, next) => {
  const count = await RefreshToken.revokeAllForUser(req.user.id, getIpAddress(req));

  res.status(200).json({
    success: true,
    message: `Logged out from ${count} device(s)`
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    avatar: req.body.avatar
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Revoke all refresh tokens (logout from all devices)
  await RefreshToken.revokeAllForUser(user._id, getIpAddress(req));

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again.'
  });
});

/**
 * @desc    Forgot password - send reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide email', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if user exists
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash and save to user
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  await user.save({ validateBeforeSave: false });

  // In production, send email with reset link
  // For now, return token (REMOVE IN PRODUCTION)
  res.status(200).json({
    success: true,
    message: 'Password reset token generated',
    data: {
      resetToken // REMOVE IN PRODUCTION - send via email instead
    }
  });
});

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return next(new ErrorResponse('Please provide reset token and new password', 400));
  }

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  // Set new password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Revoke all refresh tokens
  await RefreshToken.revokeAllForUser(user._id, getIpAddress(req));

  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please login with your new password.'
  });
});

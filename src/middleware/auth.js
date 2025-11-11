const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const { ErrorResponse } = require('./errorHandler');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Extract token from "Bearer <token>"
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    console.log('[AUTH] No token found in request headers');
    console.log('[AUTH] Authorization header:', req.headers.authorization);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[AUTH] Token verified successfully for user ID:', decoded.id);

    // Get user from token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log('[AUTH] User not found for ID:', decoded.id);
      return next(new ErrorResponse('User not found', 404));
    }

    // Check if user is active
    if (!req.user.isActive) {
      console.log('[AUTH] User account is deactivated:', req.user.email);
      return next(new ErrorResponse('User account is deactivated', 403));
    }

    console.log('[AUTH] Authentication successful for user:', req.user.email);
    next();
  } catch (error) {
    console.log('[AUTH] Token verification failed:', error.message);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

/**
 * Role-based authorization
 * @param  {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

/**
 * Strict role-based authorization - requireRole
 * Returns 401 if not logged in, 403 if role not allowed
 * @param  {...string} roles - Allowed roles
 */
exports.requireRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Return 401 if no token (not logged in)
    if (!token) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return next(new ErrorResponse('User not found', 404));
      }

      // Check if user is active
      if (!req.user.isActive) {
        return next(new ErrorResponse('User account is deactivated', 403));
      }

      // Return 403 if role not allowed
      if (!roles.includes(req.user.role)) {
        return next(
          new ErrorResponse(
            `User role '${req.user.role}' is not authorized to access this route`,
            403
          )
        );
      }

      next();
    } catch (error) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
  });
};

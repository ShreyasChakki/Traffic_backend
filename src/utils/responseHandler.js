/**
 * Response Handler Utilities
 * Standardized response formats
 */

/**
 * Success response
 */
exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

/**
 * Error response
 */
exports.errorResponse = (res, message = 'Error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: message
  });
};

/**
 * Paginated response
 */
exports.paginatedResponse = (res, data, page, limit, total) => {
  const pages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages
    }
  });
};

/**
 * Send token response (for authentication)
 */
exports.sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Generate token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    data: user,
    message
  });
};

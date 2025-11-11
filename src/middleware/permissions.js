const { ErrorResponse } = require('./errorHandler');

/**
 * Role-based permissions middleware
 * Defines what each role can do
 */

// Permission definitions matching frontend
const PERMISSIONS = {
  admin: {
    viewDashboard: true,
    viewMap: true,
    viewAnalytics: true,
    modifySignals: true,
    overrideSignals: true,
    manageEmergencies: true,
    manageUsers: true,
    viewSettings: true,
    modifySettings: true
  },
  operator: {
    viewDashboard: true,
    viewMap: true,
    viewAnalytics: true,
    modifySignals: true,
    overrideSignals: false, // Cannot override
    manageEmergencies: true,
    manageUsers: false,
    viewSettings: true,
    modifySettings: false
  },
  viewer: {
    viewDashboard: true,
    viewMap: true,
    viewAnalytics: true,
    modifySignals: false,
    overrideSignals: false,
    manageEmergencies: false,
    manageUsers: false,
    viewSettings: false,
    modifySettings: false
  }
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole];

    if (!userPermissions) {
      return next(new ErrorResponse('Invalid role', 403));
    }

    if (!userPermissions[permission]) {
      return next(new ErrorResponse(
        `Role '${userRole}' does not have permission to ${permission}`,
        403
      ));
    }

    next();
  };
};

/**
 * Check if user has any of the specified permissions
 * @param {Array<string>} permissions - Array of permissions
 */
const hasAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole];

    if (!userPermissions) {
      return next(new ErrorResponse('Invalid role', 403));
    }

    const hasAny = permissions.some(permission => userPermissions[permission]);

    if (!hasAny) {
      return next(new ErrorResponse(
        `Role '${userRole}' does not have required permissions`,
        403
      ));
    }

    next();
  };
};

/**
 * Check if user has all specified permissions
 * @param {Array<string>} permissions - Array of permissions
 */
const hasAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole];

    if (!userPermissions) {
      return next(new ErrorResponse('Invalid role', 403));
    }

    const hasAll = permissions.every(permission => userPermissions[permission]);

    if (!hasAll) {
      return next(new ErrorResponse(
        `Role '${userRole}' does not have all required permissions`,
        403
      ));
    }

    next();
  };
};

/**
 * Get user permissions
 * Endpoint to return user's permissions for frontend
 */
const getUserPermissions = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  const userRole = req.user.role;
  const permissions = PERMISSIONS[userRole] || {};

  res.status(200).json({
    success: true,
    data: {
      role: userRole,
      permissions
    }
  });
};

module.exports = {
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions
};

/**
 * Application constants
 */

module.exports = {
  // User roles
  ROLES: {
    ADMIN: 'admin',
    OPERATOR: 'operator',
    VIEWER: 'viewer'
  },

  // Traffic congestion levels
  CONGESTION_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  // Alert types
  ALERT_TYPES: {
    ACCIDENT: 'accident',
    CONGESTION: 'congestion',
    EMERGENCY: 'emergency',
    MAINTENANCE: 'maintenance'
  },

  // Alert priorities
  ALERT_PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  // Socket rooms
  SOCKET_ROOMS: {
    DASHBOARD: 'dashboard',
    MAP: 'map',
    ALERTS: 'alerts'
  },

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

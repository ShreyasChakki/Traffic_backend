/**
 * Logger Utility
 * Console logger with colors and timestamps
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Get formatted timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Logger functions
 */
const logger = {
  info: (message, ...args) => {
    console.log(
      `${colors.blue}[INFO]${colors.reset} ${colors.cyan}${getTimestamp()}${colors.reset} - ${message}`,
      ...args
    );
  },

  success: (message, ...args) => {
    console.log(
      `${colors.green}[SUCCESS]${colors.reset} ${colors.cyan}${getTimestamp()}${colors.reset} - ${message}`,
      ...args
    );
  },

  warn: (message, ...args) => {
    console.warn(
      `${colors.yellow}[WARN]${colors.reset} ${colors.cyan}${getTimestamp()}${colors.reset} - ${message}`,
      ...args
    );
  },

  error: (message, ...args) => {
    console.error(
      `${colors.red}[ERROR]${colors.reset} ${colors.cyan}${getTimestamp()}${colors.reset} - ${message}`,
      ...args
    );
  },

  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.magenta}[DEBUG]${colors.reset} ${colors.cyan}${getTimestamp()}${colors.reset} - ${message}`,
        ...args
      );
    }
  }
};

module.exports = logger;

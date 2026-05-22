/**
 * Logging Utility
 * Comprehensive logging for debugging and monitoring
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const LOG_LEVEL_PRIORITY = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor(module, minLevel = 'INFO') {
    this.module = module;
    this.minLevel = minLevel;
  }

  /**
   * Format log message with timestamp and metadata
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level,
      module: this.module,
      message,
    };

    return {
      ...baseLog,
      ...meta,
    };
  }

  /**
   * Write log to file and console
   */
  writeLog(level, message, meta = {}) {
    // Check if log level should be logged
    if (LOG_LEVEL_PRIORITY[level] > LOG_LEVEL_PRIORITY[this.minLevel]) {
      return;
    }

    const logEntry = this.formatMessage(level, message, meta);
    const logString = JSON.stringify(logEntry);

    // Write to console
    const consoleMethod = {
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug',
    }[level];

    console[consoleMethod](logString);

    // Write to file
    const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
    fs.appendFileSync(logFile, logString + '\n');

    // Write to combined log
    const combinedFile = path.join(logsDir, 'combined.log');
    fs.appendFileSync(combinedFile, logString + '\n');
  }

  /**
   * Log error
   */
  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code,
      }),
    };
    this.writeLog(LOG_LEVELS.ERROR, message, errorMeta);
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    this.writeLog(LOG_LEVELS.WARN, message, meta);
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    this.writeLog(LOG_LEVELS.INFO, message, meta);
  }

  /**
   * Log debug
   */
  debug(message, meta = {}) {
    this.writeLog(LOG_LEVELS.DEBUG, message, meta);
  }

  /**
   * Log API request
   */
  logApiRequest(req, responseTime = null) {
    this.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userId: req.user?.id,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      statusCode: req.statusCode,
    });
  }

  /**
   * Log API response
   */
  logApiResponse(req, statusCode, responseTime) {
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    this.writeLog(level, `${req.method} ${req.path} - ${statusCode}`, {
      method: req.method,
      path: req.path,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userId: req.user?.id,
    });
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(operation, collection, duration, meta = {}) {
    this.info(`Database ${operation} on ${collection}`, {
      operation,
      collection,
      duration: `${duration}ms`,
      ...meta,
    });
  }

  /**
   * Log YouTube API call
   */
  logYoutubeApiCall(endpoint, statusCode, duration) {
    const level = statusCode >= 400 ? 'WARN' : 'INFO';
    this.writeLog(level, `YouTube API ${endpoint}`, {
      endpoint,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  /**
   * Log user action
   */
  logUserAction(userId, action, details = {}) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ...details,
    });
  }

  /**
   * Clear old logs (older than retention days)
   */
  clearOldLogs(retentionDays = 30) {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    fs.readdirSync(logsDir).forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
        this.info(`Deleted old log file: ${file}`);
      }
    });
  }
}

module.exports = Logger;

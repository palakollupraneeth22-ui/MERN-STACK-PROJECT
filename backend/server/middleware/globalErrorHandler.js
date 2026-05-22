/**
 * Global Error Handler Middleware
 * Standardizes error responses across the application
 */

const Logger = require('../utils/logger');

const logger = new Logger('ErrorHandler');

/**
 * Global error handler middleware
 * This should be the last middleware in the express app
 */
const globalErrorHandler = (err, req, res, _next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_SERVER_ERROR';

  // Handle specific error types
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    const errors = Object.values(err.errors).map(e => e.message);
    if (errors.length) {
      message = errors.join(', ');
    }
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
    code = 'DUPLICATE_FIELD';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    code = 'TOKEN_EXPIRED';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.path}`, err, {
      statusCode,
      code,
      userId: req.user?.id,
      ip: req.ip,
    });
  } else if (statusCode >= 400) {
    logger.warn(`${req.method} ${req.path} - ${statusCode}`, {
      statusCode,
      code,
      message,
      userId: req.user?.id,
    });
  }

  // Send error response
  const errorResponse = {
    success: false,
    message,
    code,
    ...(isDevelopment && { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 Not Found
 */
const notFoundHandler = (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`, {
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
  });
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', new Error(String(reason)), {
      promise: String(promise),
    });
  });
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  handleUncaughtException,
  handleUnhandledRejection,
};

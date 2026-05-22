/**
 * Error Handling Utility
 * Standardized error responses across the application
 */

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

const errorMessages = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already registered',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid or malformed token',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  PASSWORD_RESET_TOKEN_INVALID: 'Password reset token is invalid or expired',

  // Validation errors
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED_FIELD: 'Missing required field: {field}',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  INVALID_URL: 'Invalid URL format',
  INVALID_YOUTUBE_URL: 'Invalid YouTube URL',
  INVALID_PAGINATION: 'Invalid pagination parameters',

  // Course errors
  COURSE_NOT_FOUND: 'Course not found',
  COURSE_ALREADY_EXISTS: 'Course with this title already exists',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',

  // Module/Lesson errors
  MODULE_NOT_FOUND: 'Module not found',
  LESSON_NOT_FOUND: 'Lesson not found',

  // File upload errors
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_UPLOAD_FAILED: 'File upload failed',

  // YouTube import errors
  YOUTUBE_API_ERROR: 'YouTube API error',
  PLAYLIST_NOT_FOUND: 'YouTube playlist not found',
  YOUTUBE_API_KEY_MISSING: 'YouTube API key not configured',
  YOUTUBE_QUOTA_EXCEEDED: 'YouTube API quota exceeded',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_API_ERROR: 'External API error',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
};

const errorHandler = {
  /**
   * Handle validation errors from joi/express-validator
   */
  handleValidationError: (errors) => {
    const formattedErrors = {};
    
    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        formattedErrors[error.path || error.param] = error.msg || error.message;
      });
    } else if (errors.details) {
      errors.details.forEach((error) => {
        formattedErrors[error.path.join('.')] = error.message;
      });
    }

    return new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      formattedErrors
    );
  },

  /**
   * Safe error response (hide sensitive info in production)
   */
  getSafeErrorResponse: (error, isDevelopment = false) => {
    const response = {
      success: false,
      message: error.message || errorMessages.INTERNAL_SERVER_ERROR,
      code: error.code || 'INTERNAL_SERVER_ERROR',
      timestamp: error.timestamp || new Date().toISOString(),
    };

    // Include stack trace only in development
    if (isDevelopment && error.stack) {
      response.stack = error.stack;
    }

    return response;
  },

  /**
   * Handle async route errors
   */
  asyncHandler: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },

  /**
   * Throw validation error
   */
  throwValidationError: (field, message) => {
    throw new AppError(
      message || `Invalid ${field}`,
      400,
      'VALIDATION_ERROR'
    );
  },

  /**
   * Throw authentication error
   */
  throwAuthError: (message = errorMessages.UNAUTHORIZED) => {
    throw new AppError(message, 401, 'AUTH_ERROR');
  },

  /**
   * Throw authorization error
   */
  throwForbiddenError: (message = errorMessages.INSUFFICIENT_PERMISSIONS) => {
    throw new AppError(message, 403, 'FORBIDDEN_ERROR');
  },

  /**
   * Throw not found error
   */
  throwNotFoundError: (resource) => {
    throw new AppError(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  },

  /**
   * Throw conflict error
   */
  throwConflictError: (message) => {
    throw new AppError(message, 409, 'CONFLICT_ERROR');
  },

  /**
   * Throw server error
   */
  throwServerError: (message = errorMessages.INTERNAL_SERVER_ERROR) => {
    throw new AppError(message, 500, 'SERVER_ERROR');
  },

  /**
   * Throw rate limit error
   */
  throwRateLimitError: () => {
    throw new AppError(
      errorMessages.RATE_LIMIT_EXCEEDED,
      429,
      'RATE_LIMIT_ERROR'
    );
  },
};

module.exports = {
  AppError,
  errorMessages,
  errorHandler,
};

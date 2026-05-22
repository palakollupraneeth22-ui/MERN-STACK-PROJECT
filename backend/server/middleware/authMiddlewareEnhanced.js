/**
 * Enhanced Authentication Middleware
 * Includes JWT verification, refresh token handling, and permission checking
 */

const jwt = require('jsonwebtoken');
const Logger = require('../utils/logger');
const { errorMessages } = require('../utils/errorHandler');

const logger = new Logger('AuthMiddleware');

/**
 * Verify JWT Access Token
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: errorMessages.UNAUTHORIZED,
        code: 'MISSING_TOKEN',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      );

      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: errorMessages.TOKEN_EXPIRED,
          code: 'TOKEN_EXPIRED',
        });
      }

      logger.warn('Invalid token attempt', {
        token: token.substring(0, 20) + '...',
        error: error.message,
      });

      return res.status(401).json({
        success: false,
        message: errorMessages.INVALID_TOKEN,
        code: 'INVALID_TOKEN',
      });
    }
  } catch (error) {
    logger.error('Auth middleware error', error);
    return res.status(500).json({
      success: false,
      message: errorMessages.INTERNAL_SERVER_ERROR,
      code: 'SERVER_ERROR',
    });
  }
};

/**
 * Verify Admin Access
 */
const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: errorMessages.UNAUTHORIZED,
        code: 'NOT_AUTHENTICATED',
      });
    }

    if (!req.user.isAdmin) {
      logger.warn('Unauthorized admin access attempt', {
        userId: req.user.id,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        message: errorMessages.INSUFFICIENT_PERMISSIONS,
        code: 'NOT_ADMIN',
      });
    }

    next();
  } catch (error) {
    logger.error('Admin verification error', error);
    return res.status(500).json({
      success: false,
      message: errorMessages.INTERNAL_SERVER_ERROR,
      code: 'SERVER_ERROR',
    });
  }
};

/**
 * Verify Ownership (for resources)
 */
const verifyOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user?.id;

      if (!resourceId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters',
          code: 'MISSING_PARAMS',
        });
      }

      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          code: 'NOT_FOUND',
        });
      }

      // Check if user owns the resource or is admin
      if (resource.userId?.toString() !== userId && !req.user.isAdmin) {
        logger.warn('Unauthorized resource access attempt', {
          userId,
          resourceId,
          path: req.path,
        });

        return res.status(403).json({
          success: false,
          message: errorMessages.INSUFFICIENT_PERMISSIONS,
          code: 'NOT_OWNER',
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership verification error', error);
      return res.status(500).json({
        success: false,
        message: errorMessages.INTERNAL_SERVER_ERROR,
        code: 'SERVER_ERROR',
      });
    }
  };
};

/**
 * Optional Authentication (doesn't fail if not authenticated)
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        );
        req.user = decoded;
      } catch (error) {
        // Log error but don't fail the request
        logger.debug('Optional auth token verification failed', {
          error: error.message,
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', error);
    next(); // Continue anyway
  }
};

/**
 * Validate request body format
 */
const validateContentType = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    const contentType = req.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE',
      });
    }
  }

  next();
};

/**
 * Validate request size
 */
const validateRequestSize = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (req.get('content-length') > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE',
    });
  }

  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyOwnership,
  optionalAuth,
  validateContentType,
  validateRequestSize,
};

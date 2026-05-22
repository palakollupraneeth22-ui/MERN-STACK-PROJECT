/**
 * Enhanced Authentication Routes
 * Includes email verification, refresh tokens, password reset, and better error handling
 */

const express = require('express');
const {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  logoutUser,
} = require('../controllers/authControllerEnhanced');
const { verifyToken } = require('../middleware/authMiddlewareEnhanced');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * Public Routes
 */

// Register new user
router.post('/register', registerLimiter, registerUser);

// Verify email
router.post('/verify-email', verifyEmail);

// Login user
router.post('/login', authLimiter, loginUser);

// Refresh access token
router.post('/refresh-token', refreshAccessToken);

// Request password reset
router.post('/forgot-password', requestPasswordReset);

// Reset password
router.post('/reset-password', resetPassword);

/**
 * Protected Routes
 */

// Logout user
router.post('/logout', verifyToken, logoutUser);

// Get current user
router.get('/me', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;

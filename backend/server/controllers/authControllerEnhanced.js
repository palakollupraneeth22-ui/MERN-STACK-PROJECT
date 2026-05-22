/**
 * Enhanced Authentication Controller
 * Includes email verification, refresh tokens, password reset, and better error handling
 */

const User = require("../models/user");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Logger = require("../utils/logger");
const { AppError, errorHandler, errorMessages } = require("../utils/errorHandler");
const validator = require("../utils/validators");

const logger = new Logger("AuthController");

// Email service (mock for now, implement with nodemailer)
const sendEmail = async (to, subject, _html) => {
  // TODO: Implement with nodemailer
  logger.info(`Email sent to ${to}: ${subject}`);
  return true;
};

/**
 * Generate JWT tokens
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      isAdmin: user.isAdmin 
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "15m" } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
    { expiresIn: "7d" } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
};

/**
 * Generate email verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate password reset token
 */
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash token for secure storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Register User with email verification
 */
const registerUser = errorHandler.asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;

  // Validation
  if (!validator.isValidEmail(email)) {
    throw new AppError(errorMessages.INVALID_EMAIL, 400, 'INVALID_EMAIL');
  }

  if (!validator.isValidPassword(password)) {
    throw new AppError(errorMessages.INVALID_PASSWORD, 400, 'INVALID_PASSWORD');
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
  }

  if (!name || name.length < 2) {
    throw new AppError('Name must be at least 2 characters', 400, 'INVALID_NAME');
  }

  const isAdmin = role === "admin" || email === "admin@gmail.com";

  if (isAdmin) {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      throw new AppError(errorMessages.EMAIL_EXISTS, 409, 'EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = generateVerificationToken();
    const hashedVerificationToken = hashToken(verificationToken);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Send verification email
    await sendEmail(
      email,
      'Verify Your Email',
      `Click this link to verify your email: ${process.env.FRONTEND_URL}/verify-email/${verificationToken}`
    );

    logger.logUserAction(admin._id, 'ADMIN_REGISTERED', { email });

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully. Please verify your email.',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        isAdmin: true,
        emailVerified: false,
      },
    });
  } else {
    // Regular user registration
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new AppError(errorMessages.EMAIL_EXISTS, 409, 'EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = generateVerificationToken();
    const hashedVerificationToken = hashToken(verificationToken);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpiry: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Send verification email
    await sendEmail(
      email,
      'Verify Your Email',
      `Click this link to verify your email: ${process.env.FRONTEND_URL}/verify-email/${verificationToken}`
    );

    logger.logUserAction(user._id, 'USER_REGISTERED', { email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: false,
      },
    });
  }
});

/**
 * Verify Email
 */
const verifyEmail = errorHandler.asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Verification token is required', 400, 'MISSING_TOKEN');
  }

  const hashedToken = hashToken(token);

  // Try to find in User collection first
  let user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

    if (!user) {
    user = await Admin.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
    });
  }

  if (!user) {
    throw new AppError(errorMessages.INVALID_TOKEN, 400, 'INVALID_TOKEN');
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();

  logger.logUserAction(user._id, 'EMAIL_VERIFIED', { email: user.email });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
});

/**
 * Login User with improved security
 */
const loginUser = errorHandler.asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!validator.isValidEmail(email)) {
    throw new AppError(errorMessages.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
  }

  if (!password) {
    throw new AppError(errorMessages.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
  }

  // Find user
  let user = await User.findOne({ email });
  let isAdmin = false;

  if (!user) {
    user = await Admin.findOne({ email });
    isAdmin = true;
  }

  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${email}`);
    throw new AppError(errorMessages.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
  }

  // Check email verification
  if (!user.emailVerified) {
    throw new AppError(errorMessages.EMAIL_NOT_VERIFIED, 403, 'EMAIL_NOT_VERIFIED');
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    logger.warn(`Failed login attempt for user: ${email}`);
    throw new AppError(errorMessages.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  logger.logUserAction(user._id, 'LOGIN_SUCCESS', { email });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin,
    },
  });
});

/**
 * Refresh Access Token
 */
const refreshAccessToken = errorHandler.asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400, 'MISSING_TOKEN');
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key"
    );

    // Find user and verify refresh token
    let user = await User.findById(decoded.id);

    if (!user) {
      user = await Admin.findById(decoded.id);
    }

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError(errorMessages.INVALID_TOKEN, 401, 'INVALID_REFRESH_TOKEN');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    throw new AppError(errorMessages.INVALID_TOKEN, 401, 'INVALID_REFRESH_TOKEN');
  }
});

/**
 * Request Password Reset
 */
const requestPasswordReset = errorHandler.asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!validator.isValidEmail(email)) {
    throw new AppError(errorMessages.INVALID_EMAIL, 400, 'INVALID_EMAIL');
  }

  // Find user
  let user = await User.findOne({ email });
  if (!user) {
    user = await Admin.findOne({ email });
  }

  if (!user) {
    // Don't reveal if email exists (security best practice)
    return res.status(200).json({
      success: true,
      message: 'If this email exists, a password reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = generatePasswordResetToken();
  const hashedResetToken = hashToken(resetToken);

  user.passwordResetToken = hashedResetToken;
  user.passwordResetExpiry = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
  await user.save();

  // Send reset email
  await sendEmail(
    email,
    'Password Reset Request',
    `Click this link to reset your password: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`
  );

  logger.logUserAction(user._id, 'PASSWORD_RESET_REQUESTED', { email });

  res.status(200).json({
    success: true,
    message: 'Password reset link has been sent to your email.',
  });
});

/**
 * Reset Password
 */
const resetPassword = errorHandler.asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token) {
    throw new AppError('Reset token is required', 400, 'MISSING_TOKEN');
  }

  if (!validator.isValidPassword(password)) {
    throw new AppError(errorMessages.INVALID_PASSWORD, 400, 'INVALID_PASSWORD');
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
  }

  const hashedToken = hashToken(token);

  // Find user with valid reset token
  let user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  });

  if (!user) {
    user = await Admin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });
  }

  if (!user) {
    throw new AppError(errorMessages.PASSWORD_RESET_TOKEN_INVALID, 400, 'INVALID_TOKEN');
  }

  // Update password
  user.password = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  user.refreshToken = undefined; // Invalidate all sessions
  await user.save();

  logger.logUserAction(user._id, 'PASSWORD_RESET_SUCCESS', { email: user.email });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please login again.',
  });
});

/**
 * Logout User
 */
const logoutUser = errorHandler.asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (userId) {
    // Find and clear refresh token
    let user = await User.findById(userId);
    if (!user) {
      user = await Admin.findById(userId);
    }

    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    logger.logUserAction(userId, 'LOGOUT', {});
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  logoutUser,
};

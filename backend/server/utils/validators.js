/**
 * Input Validation Utility
 * Comprehensive validation for all user inputs across the application
 */

const validator = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  },

  // Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
  isValidPassword: (password) => {
    if (!password || password.length < 8) return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  },

  // Username validation
  isValidUsername: (username) => {
    if (!username || username.length < 3 || username.length > 30) return false;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(username);
  },

  // Course title validation
  isValidCourseTitle: (title) => {
    return title && title.trim().length >= 3 && title.trim().length <= 255;
  },

  // Course description validation
  isValidDescription: (description) => {
    return !description || (description.length >= 10 && description.length <= 5000);
  },

  // Module title validation
  isValidModuleTitle: (title) => {
    return title && title.trim().length >= 2 && title.trim().length <= 100;
  },

  // Lesson title validation
  isValidLessonTitle: (title) => {
    return title && title.trim().length >= 2 && title.trim().length <= 200;
  },

  // URL validation
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // YouTube URL validation
  isValidYoutubeUrl: (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
    return youtubeRegex.test(url);
  },

  // MongoDB ObjectId validation
  isValidObjectId: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  // Number validation
  isValidNumber: (value, min = 0, max = Infinity) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  // Duration validation (in minutes)
  isValidDuration: (duration) => {
    return Number.isInteger(duration) && duration > 0 && duration <= 999999;
  },

  // Status validation
  isValidStatus: (status) => {
    const validStatuses = ['not-started', 'in-progress', 'completed'];
    return validStatuses.includes(status);
  },

  // Sanitize input (basic XSS prevention)
  sanitizeString: (str) => {
    if (typeof str !== 'string') return '';
    return str
      .trim()
      .replace(/[<>]/g, '')
      .slice(0, 10000); // Max length protection
  },

  // Validate pagination parameters
  isValidPagination: (page, limit) => {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return (
      !isNaN(pageNum) && pageNum >= 1 &&
      !isNaN(limitNum) && limitNum >= 1 && limitNum <= 100
    );
  },

  // Validate sort parameters
  isValidSort: (sort, allowedFields) => {
    if (!sort) return true;
    const fields = sort.split(',');
    return fields.every(field => {
      const cleanField = field.replace(/^-/, '');
      return allowedFields.includes(cleanField);
    });
  },

  // Validate filter parameters
  isValidFilter: (filter, allowedFields) => {
    if (!filter) return true;
    const filterObj = JSON.parse(filter);
    return Object.keys(filterObj).every(key => allowedFields.includes(key));
  },

  // Validate file upload
  isValidFile: (file, maxSize = 104857600, allowedMimes = []) => {
    if (!file) return false;
    if (file.size > maxSize) return false;
    if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
      return false;
    }
    return true;
  },

  // Validate video file
  isValidVideoFile: (file) => {
    const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    return validator.isValidFile(file, maxSize, allowedMimes);
  },
};

module.exports = validator;

// services/email/utils.js

/**
 * Email Service Utilities
 * Helper functions for validation, formatting, error handling
 */

// ─── EMAIL VALIDATION ──────────────────────────────────────────────────────

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} True if valid, false otherwise
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email?.trim() || '');
};

/**
 * Sanitize email (trim whitespace, lowercase)
 * @param {String} email - Email to sanitize
 * @returns {String} Sanitized email
 */
export const sanitizeEmail = (email) => {
  return email?.trim().toLowerCase() || '';
};

// ─── ERROR HANDLING ────────────────────────────────────────────────────────

/**
 * Format email error response
 * @param {Error} error - Error object
 * @returns {Object} Formatted error object
 */
export const formatEmailError = (error) => {
  return {
    success: false,
    message: error.message || 'Failed to send email',
    error: process.env.NODE_ENV === 'development' ? error : undefined
  };
};

/**
 * Log email event
 * @param {String} type - Event type (send, fail, retry, etc)
 * @param {String} email - Email address
 * @param {String} subject - Email subject
 * @param {Object} meta - Additional metadata
 */
export const logEmailEvent = (type, email, subject, meta = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] EMAIL_${type.toUpperCase()}: ${email} - ${subject}`, meta);
};

// ─── RESPONSE HELPERS ──────────────────────────────────────────────────────

/**
 * Success response
 * @param {String} message - Success message
 * @returns {Object} Success response
 */
export const successResponse = (message = 'Email sent successfully') => {
  return {
    success: true,
    message
  };
};

/**
 * Error response
 * @param {String} message - Error message
 * @returns {Object} Error response
 */
export const errorResponse = (message = 'Failed to send email') => {
  return {
    success: false,
    message
  };
};

// ─── RATE LIMITING (Optional) ──────────────────────────────────────────────

/**
 * Check if email can be sent (rate limiting)
 * @param {String} email - Email to check
 * @param {Map} sentEmails - Map of recently sent emails
 * @param {Number} limit - Max emails per minute (default: 5)
 * @returns {Boolean} True if can send, false if rate limited
 */
export const checkRateLimit = (email, sentEmails = new Map(), limit = 5) => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Get emails sent to this address in last minute
  if (!sentEmails.has(email)) {
    sentEmails.set(email, []);
  }

  const emailTimes = sentEmails.get(email).filter(time => time > oneMinuteAgo);

  if (emailTimes.length >= limit) {
    return false; // Rate limited
  }

  emailTimes.push(now);
  sentEmails.set(email, emailTimes);
  return true; // Can send
};


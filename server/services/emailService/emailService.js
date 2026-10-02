// services/email/emailService.js

/**
 * Email Service
 * Main service that orchestrates email sending
 * Imports from: config.js, templates.js, utils.js
 */

import { transporter } from './config.js';
import templates from './templates.js';
import {
  validateEmail,
  sanitizeEmail,
  logEmailEvent,
  successResponse,
  errorResponse
} from './utils.js';

// ─── GENERIC EMAIL SENDER ──────────────────────────────────────────────────

/**
 * Generic email sender function
 * All other functions use this internally
 * @param {String} email - Recipient email
 * @param {String} subject - Email subject
 * @param {String} html - HTML content
 * @returns {Promise<Object>} Response object
 */
const sendEmail = async (email, subject, html) => {
  try {
    // Validate email
    const cleanEmail = sanitizeEmail(email);
    if (!validateEmail(cleanEmail)) {
      throw new Error('Invalid email address');
    }

    // Prepare mail options
    const mailOptions = {
      from: `"VTU App" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: cleanEmail,
      subject,
      html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log success
    logEmailEvent('sent', cleanEmail, subject, { messageId: info.messageId });

    return successResponse('Email sent successfully');
  } catch (error) {
    // Log error
    logEmailEvent('failed', email, subject, { error: error.message });

    // Format and throw error
    throw error;
  }
};

// ─── PUBLIC EMAIL FUNCTIONS ────────────────────────────────────────────────

/**
 * Send OTP verification email
 * @param {String} email - User email
 * @param {String} otp - 6-digit OTP code
 * @returns {Promise<Object>}
 */
export const sendOTPEmail = async (email, otp) => {
  if (!otp) throw new Error('OTP is required');

  if (process.env.NODE_ENV === 'production') {
    return sendEmail(email, 'Email Verification - Your OTP Code', templates.otp(otp));
  } else {
    // Development mode: log to console
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║          📧 OTP VERIFICATION EMAIL (DEV)            ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`📧 To: ${email}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log(`⏱️  Expires: 5 minutes`);
    console.log('═══════════════════════════════════════════════════════\n');
    return successResponse('OTP logged to console');
  }
};

/**
 * Send password reset email
 * @param {String} email - User email
 * @param {String} resetToken - Reset token
 * @returns {Promise<Object>}
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  if (!resetToken) throw new Error('Reset token is required');

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  if (process.env.NODE_ENV === 'production') {
    return sendEmail(email, 'Password Reset Request - VTU App', templates.passwordReset(resetUrl));
  } else {
    return successResponse('Reset email logged to console');
  }
};

/**
 * Send welcome email
 * @param {String} email - User email
 * @param {String} name - User name
 * @returns {Promise<Object>}
 */
export const sendWelcomeEmail = async (email, name) => {
  if (!name) throw new Error('User name is required');

  try {
    return await sendEmail(email, 'Welcome to VTU App!', templates.welcome(name));
  } catch (error) {
    // Log but don't throw (welcome email is non-critical)
    logEmailEvent('warning', email, 'Welcome Email', { error: error.message });
    return errorResponse('Welcome email failed (non-critical)');
  }
};

/**
 * Send transaction receipt
 * @param {String} email - User email
 * @param {Object} transaction - Transaction data
 * @returns {Promise<Object>}
 */
export const sendTransactionReceipt = async (email, transaction) => {
  if (!transaction || typeof transaction !== 'object') {
    throw new Error('Invalid transaction data');
  }

  try {
    return await sendEmail(
      email,
      `Transaction Receipt - ${transaction.type || 'VTU'}`,
      templates.receipt(transaction)
    );
  } catch (error) {
    logEmailEvent('warning', email, 'Transaction Receipt', { error: error.message });
    return errorResponse('Receipt email failed');
  }
};

// ─── EMAIL SERVICE OBJECT ──────────────────────────────────────────────────

const emailService = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendTransactionReceipt,
  // Expose utility functions if needed
  validateEmail,
  sanitizeEmail
};

export default emailService;
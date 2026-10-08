// routes/auth.js
import express from 'express';
import {
  // Registration
  register,
  verifyRegistration,

  // Login & Auth
  login,
  refresh,
  logout,
  changePassword,

  // Password Reset
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,

  // Utilities
  resendOTP,
} from '../controllers/authController.js';

import {
  validateRegister,
  validateVerifyRegistration,
  validateLogin,
  validateRefresh,
  validateChangePassword,
  validateSendPasswordResetOTP,
  validateVerifyOTP,
  validateCompletePasswordReset,
  validateResendOTP,
} from '../middleware/validate.js';

import protect from '../middleware/auth.js';

const router = express.Router();

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// ─── REGISTRATION (OTP-based) ──────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @desc    Send OTP for registration
 * @access  Public
 * @body    { name, email, phone, password, confirmPassword }
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/register/verify
 * @desc    Verify OTP and complete registration
 * @access  Public
 * @body    { email, otp }
 */
router.post('/register/verify', validateVerifyRegistration, verifyRegistration);

// ─── LOGIN ─────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', validateLogin, login);

// ─── TOKEN REFRESH ─────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', validateRefresh, refresh);

// ─── PASSWORD RESET (OTP-based, email only) ────────────────────────────────

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send OTP for password reset
 * @access  Public
 * @body    { email }
 * @returns { success, message, expiresIn }
 */
router.post('/forgot-password', validateSendPasswordResetOTP, sendPasswordResetOTP);

/**
 * @route   POST /api/auth/forgot-password/verify
 * @desc    Verify OTP for password reset
 * @access  Public
 * @body    { email, otp }
 * @returns { success, message, resetToken, expiresIn }
 */
router.post('/forgot-password/verify', validateVerifyOTP, verifyPasswordResetOTP);

/**
 * @route   POST /api/auth/forgot-password/reset
 * @desc    Reset password with token
 * @access  Public
 * @body    { email, resetToken, newPassword, confirmNewPassword }
 * @returns { success, message, accessToken, refreshToken, user }
 */
router.post('/forgot-password/reset', validateCompletePasswordReset, resetPassword);

// ─── RESEND OTP ────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP for registration or password reset
 * @access  Public
 * @body    { email, purpose } purpose: 'registration' | 'password_reset'
 */
router.post('/resend-otp', validateResendOTP, resendOTP);

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString(),
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/auth/logout
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   POST /api/auth/change-password
 * @access  Private
 */
router.post('/change-password', protect, validateChangePassword, changePassword);

/**
 * @route   GET /api/auth/profile
 * @access  Private
 */
router.get('/profile', protect, (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
        createdAt: req.user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
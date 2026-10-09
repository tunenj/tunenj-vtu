// routes/auth.js
import express from 'express';
import {
  register,
  verifyRegistration,
  login,
  refresh,
  logout,
  changePassword,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
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

// ─── REGISTRATION ──────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/register
 * @body    { firstName, lastName, email, phone, password, confirmPassword, referralCode? }
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/register/verify
 * @body    { email, otp }
 */
router.post('/register/verify', validateVerifyRegistration, verifyRegistration);

// ─── LOGIN ─────────────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/login
 * @body    { email, password }
 */
router.post('/login', validateLogin, login);

// ─── TOKEN REFRESH ─────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/refresh
 * @body    { refreshToken }
 */
router.post('/refresh', validateRefresh, refresh);

// ─── PASSWORD RESET (email only) ───────────────────────────────────────────
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Step 1 — send 4-digit OTP to email
 * @body    { email }
 * @returns { success, message, expiresIn }
 */
router.post('/forgot-password', validateSendPasswordResetOTP, sendPasswordResetOTP);

/**
 * @route   POST /api/auth/forgot-password/verify
 * @desc    Step 2 — verify OTP, receive resetToken
 * @body    { email, otp }
 * @returns { success, message, resetToken, expiresIn }
 */
router.post('/forgot-password/verify', validateVerifyOTP, verifyPasswordResetOTP);

/**
 * @route   POST /api/auth/forgot-password/reset
 * @desc    Step 3 — set new password using resetToken
 * @body    { email, resetToken, newPassword, confirmNewPassword }
 * @returns { success, message, accessToken, refreshToken, user }
 */
router.post('/forgot-password/reset', validateCompletePasswordReset, resetPassword);

// ─── RESEND OTP ────────────────────────────────────────────────────────────
/**
 * @route   POST /api/auth/resend-otp
 * @body    { email, purpose }  purpose: 'registration' | 'password_reset'
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

// ─── PROTECTED ─────────────────────────────────────────────────────────────
router.post('/logout', protect, logout);
router.post('/change-password', protect, validateChangePassword, changePassword);

router.get('/profile', protect, (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      user: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
        referralCode: req.user.referralCode,
        createdAt: req.user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
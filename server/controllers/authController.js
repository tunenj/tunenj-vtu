// controllers/authController.js

/**
 * Authentication Controller
 * OTP-based registration as primary flow
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import crypto from 'crypto';

// Import services
import { emailService } from '../services/emailService/index.js';
import OTPService from '../services/otpService.js';

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '10m' // 10 minutes
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d' // 7 days
  });
  return { accessToken, refreshToken };
};

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ═════════════════════════════════════════════════════════════════════════════
// REGISTRATION - OTP-BASED (PRIMARY)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Send OTP for registration
 * @route   POST /api/auth/register
 * @access  Public
 * @body    { name, email, phone, password, confirmPassword }
 * @returns { success, message, email, expiresIn }
 */
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate input
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, and password'
      });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
      isEmailVerified: true
    });

    if (existingUser) {
      if (existingUser.email === email && existingUser.phone === phone) {
        return res.status(400).json({
          success: false,
          message: 'Email and phone already registered'
        });
      } else if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered'
        });
      }
    }

    // Check for pending registration
    let user = await User.findOne({
      $or: [{ email }, { phone }],
      isEmailVerified: false
    });

    // Generate OTP
    const otp = OTPService.generateOTP();
    const hashedOTP = await OTPService.hashOTP(otp);

    if (user) {
      // Update existing pending user
      user.name = name;
      user.password = password;
      user.email = email;
      user.phone = phone;
      user.pendingRegistration = {
        name,
        email,
        phone,
        password
      };
      user.otp = {
        code: hashedOTP,
        purpose: 'registration',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        verified: false
      };
    } else {
      // Create new pending user
      user = new User({
        name,
        email,
        phone,
        password,
        pendingRegistration: {
          name,
          email,
          phone,
          password
        },
        otp: {
          code: hashedOTP,
          purpose: 'registration',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
          verified: false
        }
      });
    }

    await user.save();

    // Send OTP via email
    try {
      await emailService.sendRegistrationOTP(email, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Valid for 10 minutes.',
      email,
      expiresIn: 600 // seconds
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Verify OTP and complete registration
 * @route   POST /api/auth/register/verify
 * @access  Public
 * @body    { email, otp }
 * @returns { success, message, accessToken, refreshToken, user }
 */
export const verifyRegistration = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Find user with pending registration
    const user = await User.findOne({
      email,
      isEmailVerified: false,
      'otp.purpose': 'registration',
      'otp.verified': false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found. Please register again.'
      });
    }

    // Check if OTP expired
    if (Date.now() > user.otp.expiresAt) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    // Check attempts
    if (user.otp.attempts >= 3) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isValid = await OTPService.verifyOTP(otp, user.otp.code);

    if (!isValid) {
      user.otp.attempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: 3 - user.otp.attempts
      });
    }

    // Move pending data to main user document
    user.name = user.pendingRegistration.name;
    user.password = user.pendingRegistration.password;
    user.isEmailVerified = true;
    user.verifiedAt = new Date();

    // Clear temporary fields
    user.pendingRegistration = undefined;
    user.otp = undefined;

    await user.save();

    // Create wallet
    await Wallet.create({ user: user._id });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Verify registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Login user with email and password
 * @route   POST /api/auth/login
 * @access  Public
 * @body    { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first. Complete your registration.'
      });
    }

    // Update last login info
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip || req.connection.remoteAddress;
    user.lastLoginUserAgent = req.headers['user-agent'];
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// REFRESH TOKEN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 * @body    { refreshToken }
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const { accessToken } = generateTokens(user._id);
    res.json({
      success: true,
      accessToken
    });
  } catch (err) {
    console.error('Refresh token error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private (requires authentication)
 */
export const logout = async (req, res) => {
  try {
    if (req.user) {
      console.log(`User ${req.user.id} logged out`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Change user password
 * @route   POST /api/auth/change-password
 * @access  Private (requires authentication)
 * @body    { currentPassword, newPassword }
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      success: true,
      message: 'Password changed successfully',
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// PASSWORD RESET - OTP-BASED
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Send OTP for password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 * @body    { email }
 */
export const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    const user = await User.findOne({
      email,
      isEmailVerified: true
    });

    if (!user) {
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset OTP',
        expiresIn: 600
      });
    }

    // Rate limiting
    if (user.otp?.expiresAt &&
      user.otp.expiresAt > new Date(Date.now() - 2 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 2 minutes before requesting another OTP'
      });
    }

    const otp = OTPService.generateOTP();
    const hashedOTP = await OTPService.hashOTP(otp);

    user.otp = {
      code: hashedOTP,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      verified: false
    };

    await user.save();

    try {
      await emailService.sendPasswordResetOTP(email, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset OTP',
      expiresIn: 600
    });

  } catch (error) {
    console.error('Send password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Verify OTP for password reset
 * @route   POST /api/auth/forgot-password/verify
 * @access  Public
 * @body    { email, otp }
 */
export const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    const user = await User.findOne({
      email,
      isEmailVerified: true,
      'otp.purpose': 'password_reset',
      'otp.verified': false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request or OTP expired'
      });
    }

    if (Date.now() > user.otp.expiresAt) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Request new OTP.'
      });
    }

    if (user.otp.attempts >= 3) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Request new OTP.'
      });
    }

    const isValid = await OTPService.verifyOTP(otp, user.otp.code);

    if (!isValid) {
      user.otp.attempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: 3 - user.otp.attempts
      });
    }

    user.otp.verified = true;
    const resetToken = OTPService.generateToken();
    const hashedToken = OTPService.hashToken(resetToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Reset password after OTP verification
 * @route   POST /api/auth/forgot-password/reset
 * @access  Public
 * @body    { email, resetToken, newPassword }
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, resetToken, and newPassword'
      });
    }

    const hashedToken = OTPService.hashToken(resetToken);

    const user = await User.findOne({
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.otp = undefined;

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// RESEND OTP
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Resend OTP for registration or password reset
 * @route   POST /api/auth/resend-otp
 * @access  Public
 * @body    { email, purpose }
 */
export const resendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and purpose (registration or password_reset)'
      });
    }

    if (!['registration', 'password_reset'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose. Use "registration" or "password_reset"'
      });
    }

    let user;
    if (purpose === 'registration') {
      user = await User.findOne({
        email,
        isEmailVerified: false
      });
    } else {
      user = await User.findOne({
        email,
        isEmailVerified: true
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Rate limiting
    if (user.otp?.expiresAt &&
      user.otp.expiresAt > new Date(Date.now() - 2 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 2 minutes before requesting another OTP'
      });
    }

    const otp = OTPService.generateOTP();
    const hashedOTP = await OTPService.hashOTP(otp);

    user.otp = {
      code: hashedOTP,
      purpose: purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      verified: false
    };

    await user.save();

    try {
      if (purpose === 'registration') {
        await emailService.sendRegistrationOTP(email, otp);
      } else {
        await emailService.sendPasswordResetOTP(email, otp);
      }
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'New OTP sent to your email',
      expiresIn: 600
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
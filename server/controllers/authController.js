// controllers/authController.js

/**
 * Authentication Controller
 * Email-OTP registration flow:
 *   register -> verify 4-digit code sent to the email -> login
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';

// Import services
import { emailService } from '../services/emailService/index.js';
import OTPService from '../services/otpService.js';

// ─── CONSTANTS ─────────────────────────────────────────────────────────────

const REG_OTP_LENGTH = 4;              // the app shows 4 code boxes
const OTP_TTL_MS = 10 * 60 * 1000;     // code valid for 10 minutes
const OTP_MAX_ATTEMPTS = 3;            // wrong guesses before the code is thrown away
const RESEND_COOLDOWN_MS = 60 * 1000;  // the app shows a 60 second "Resend" countdown

const PHONE_REGEX = /^0[789][01]\d{8}$/;  // same Nigerian format the app checks
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

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

/** 08012345678, +2348012345678 and 2348012345678 all become 08012345678 */
const normalizePhone = (value = '') => {
  let phone = String(value).replace(/[\s-]/g, '');
  if (phone.startsWith('+234')) phone = '0' + phone.slice(4);
  else if (phone.startsWith('234') && phone.length === 13) phone = '0' + phone.slice(3);
  return phone;
};

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

/** The app lets people log in with a phone number OR an email */
const identifierQuery = (identifier) =>
  identifier.includes('@')
    ? { email: normalizeEmail(identifier) }
    : { phone: normalizePhone(identifier) };

/** Accounts created before the phone flow only have isEmailVerified, so accept either */
const isAccountVerified = (user) => Boolean(user.isPhoneVerified || user.isEmailVerified);

/** Random 4-digit code, with leading zeros kept (for example 0482) */
const generateRegistrationOTP = () =>
  crypto.randomInt(0, 10 ** REG_OTP_LENGTH).toString().padStart(REG_OTP_LENGTH, '0');

const buildOtp = async (otp, purpose) => ({
  code: await OTPService.hashOTP(otp),
  purpose,
  expiresAt: new Date(Date.now() + OTP_TTL_MS),
  sentAt: new Date(),
  attempts: 0,
  verified: false
});

const isCoolingDown = (user) => {
  const sentAt = user.otp?.sentAt;
  return sentAt ? Date.now() - new Date(sentAt).getTime() < RESEND_COOLDOWN_MS : false;
};

const cooldownSecondsLeft = (user) =>
  Math.max(
    1,
    Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - new Date(user.otp.sentAt).getTime())) / 1000)
  );

/**
 * Sends the registration code by email. Returns true if the email went out.
 */
const sendRegistrationCode = async ({ phone, email, otp }) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Registration OTP for ${email} (${phone || 'no phone'}): ${otp}`);
  }

  try {
    await emailService.sendRegistrationOTP(email, otp);
    return true;
  } catch (mailError) {
    console.error('Failed to send OTP email:', mailError?.message);
    return false;
  }
};

/** Own referral code shown on the Profile page, for example JOHN4821 */
const generateReferralCode = async (firstName) => {
  const base = String(firstName)
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, 'X');

  for (let i = 0; i < 10; i += 1) {
    const code = `${base}${crypto.randomInt(1000, 10000)}`;
    // eslint-disable-next-line no-await-in-loop
    if (!(await User.exists({ referralCode: code }))) return code;
  }
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  referralCode: user.referralCode,
  role: user.role
});

// ═════════════════════════════════════════════════════════════════════════════
// REGISTRATION - EMAIL OTP (PRIMARY)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Create a pending account and send a 4-digit code to the email
 * @route   POST /api/auth/register
 * @access  Public
 * @body    { firstName, lastName, phone, email, password, confirmPassword?,
 *            referralCode?, acceptedTerms? }
 * @returns { success, message, email, phone, expiresIn, resendIn, codeLength }
 */
export const register = async (req, res) => {
  try {
    const { firstName, lastName, password, confirmPassword, referralCode, acceptedTerms } = req.body;
    const phone = normalizePhone(req.body.phone);
    const email = normalizeEmail(req.body.email);
    const first = String(firstName || '').trim();
    const last = String(lastName || '').trim();

    // Validate input (same rules as the app, so the messages match)
    const errors = {};
    if (first.length < 2 || first.length > 50) errors.firstName = 'Enter your first name';
    if (last.length < 2 || last.length > 50) errors.lastName = 'Enter your last name';
    if (!PHONE_REGEX.test(phone)) errors.phone = 'Enter a valid Nigerian number, e.g. 08012345678';
    if (!EMAIL_REGEX.test(email)) errors.email = 'Enter a valid email address';
    if (typeof password !== 'string' || password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please check the highlighted fields',
        errors
      });
    }

    // Optional referral code: if one is given, it must belong to a real user
    let referrer = null;
    const code = String(referralCode || '').trim().toUpperCase();
    if (code) {
      referrer = await User.findOne({ referralCode: code }).select('_id');
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'That referral code was not found',
          errors: { referralCode: 'Referral code not found' }
        });
      }
    }

    // Already registered and verified?
    const existingUser = await User.findOne({
      $and: [
        { $or: [{ email }, { phone }] },
        { $or: [{ isPhoneVerified: true }, { isEmailVerified: true }] }
      ]
    }).select('email phone');

    if (existingUser) {
      const conflict = {};
      if (existingUser.email === email) conflict.email = 'Email already registered';
      if (existingUser.phone === phone) conflict.phone = 'Phone number already registered';
      return res.status(409).json({
        success: false,
        message: Object.values(conflict).join('. '),
        errors: conflict
      });
    }

    // A pending (not yet verified) registration for the same email or phone?
    let user = await User.findOne({
      $or: [{ email }, { phone }],
      isPhoneVerified: { $ne: true },
      isEmailVerified: { $ne: true }
    });

    // Do not spam the same address: wait for the resend cooldown
    if (
      user &&
      user.email === email &&
      user.otp?.purpose === 'registration' &&
      isCoolingDown(user)
    ) {
      const retryAfter = cooldownSecondsLeft(user);
      return res.status(429).json({
        success: false,
        message: `Please wait ${retryAfter} seconds before requesting another code`,
        retryAfter
      });
    }

    const otp = generateRegistrationOTP();
    const otpData = await buildOtp(otp, 'registration');

    if (user) {
      // Update the existing pending user. The password is hashed by the model on save.
      user.firstName = first;
      user.lastName = last;
      user.email = email;
      user.phone = phone;
      user.password = password;
      user.referredBy = referrer ? referrer._id : undefined;
      user.termsAcceptedAt = acceptedTerms ? new Date() : user.termsAcceptedAt;
      user.pendingRegistration = undefined; // old field, it held a plain-text password
      user.otp = otpData;
    } else {
      user = new User({
        firstName: first,
        lastName: last,
        email,
        phone,
        password,
        referredBy: referrer ? referrer._id : undefined,
        termsAcceptedAt: acceptedTerms ? new Date() : undefined,
        otp: otpData
      });
    }

    await user.save();

    const sent = await sendRegistrationCode({ phone, email, otp });
    if (!sent) {
      return res.status(503).json({
        success: false,
        message: 'We could not send your verification code. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: `We sent a ${REG_OTP_LENGTH}-digit code to your email. Valid for 10 minutes.`,
      email,
      phone,
      expiresIn: OTP_TTL_MS / 1000,   // seconds
      resendIn: RESEND_COOLDOWN_MS / 1000,
      codeLength: REG_OTP_LENGTH
    });

  } catch (error) {
    // Duplicate key: someone else grabbed the same email or phone at the same moment
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'That email or phone number is already in use'
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};

/**
 * @desc    Verify the 4-digit code and finish registration
 * @route   POST /api/auth/register/verify
 * @access  Public
 * @body    { email, otp }
 * @returns { success, message, accessToken, refreshToken, user }
 */
export const verifyRegistration = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.otp ?? req.body.code ?? '').trim();

    // Validate input
    if (!EMAIL_REGEX.test(email) || !new RegExp(`^\\d{${REG_OTP_LENGTH}}$`).test(code)) {
      return res.status(400).json({
        success: false,
        message: `Enter the ${REG_OTP_LENGTH}-digit code we sent to your email`
      });
    }

    // Find the pending registration for this email
    const user = await User.findOne({
      email,
      isPhoneVerified: { $ne: true },
      isEmailVerified: { $ne: true },
      'otp.purpose': 'registration',
      'otp.verified': false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found. Please register again.'
      });
    }

    // Check if the code expired
    if (Date.now() > user.otp.expiresAt) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Code expired. Please request a new code.'
      });
    }

    // Check attempts
    if (user.otp.attempts >= OTP_MAX_ATTEMPTS) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Too many wrong attempts. Please request a new code.'
      });
    }

    // Check the code
    const isValid = await OTPService.verifyOTP(code, user.otp.code);

    if (!isValid) {
      user.otp.attempts += 1;

      // Last wrong guess: throw the code away straight away
      if (user.otp.attempts >= OTP_MAX_ATTEMPTS) {
        user.otp = undefined;
        await user.save();
        return res.status(400).json({
          success: false,
          message: 'Too many wrong attempts. Please request a new code.',
          attemptsLeft: 0
        });
      }

      user.markModified('otp');
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'That code is wrong or has expired.',
        attemptsLeft: OTP_MAX_ATTEMPTS - user.otp.attempts
      });
    }

    // Mark the account as verified (email is what we actually sent the OTP to)
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.isPhoneVerified = true;        // keep in sync if you also verify by phone elsewhere
    user.phoneVerifiedAt = new Date();
    user.verifiedAt = new Date();
    user.referralCode =
      user.referralCode || (await generateReferralCode(user.firstName || 'USER'));

    // Clear temporary fields
    user.pendingRegistration = undefined;
    user.otp = undefined;

    await user.save();

    // Create the wallet (only once)
    const hasWallet = await Wallet.exists({ user: user._id });
    if (!hasWallet) await Wallet.create({ user: user._id });

    // Send the welcome email (non-blocking — a mail failure must not fail registration)
    emailService
      .sendWelcomeEmail(user.email, user.firstName)
      .catch((err) =>
        console.error('Welcome email failed:', err?.message || err)
      );

    // TODO: if (user.referredBy) { reward the referrer here, using your own rules }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: publicUser(user)
    });

  } catch (error) {
    console.error('Verify registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Login with phone number or email, and password
 * @route   POST /api/auth/login
 * @access  Public
 * @body    { identifier, password }   (email is accepted instead of identifier)
 */
export const login = async (req, res) => {
  try {
    const identifier = String(req.body.identifier ?? req.body.email ?? '').trim();
    const { password } = req.body;

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your phone number or email, and your password'
      });
    }

    const user = await User.findOne(identifierQuery(identifier));

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // The account must be verified. The app can use needsVerification to open the code page.
    if (!isAccountVerified(user)) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your account to continue.',
        needsVerification: true,
        email: user.email
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
      user: publicUser(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
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
      email: normalizeEmail(email),
      $or: [{ isPhoneVerified: true }, { isEmailVerified: true }]
    });

    if (!user) {
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset OTP',
        expiresIn: 600
      });
    }

    // Rate limiting (one code per resend cooldown)
    if (isCoolingDown(user)) {
      const retryAfter = cooldownSecondsLeft(user);
      return res.status(429).json({
        success: false,
        message: `Please wait ${retryAfter} seconds before requesting another OTP`,
        retryAfter
      });
    }

    const otp = OTPService.generateOTP();
    user.otp = await buildOtp(otp, 'password_reset');

    await user.save();

    try {
      await emailService.sendPasswordResetOTP(user.email, otp);
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
      email: normalizeEmail(email),
      $or: [{ isPhoneVerified: true }, { isEmailVerified: true }],
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

    if (user.otp.attempts >= OTP_MAX_ATTEMPTS) {
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
      user.markModified('otp');
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: OTP_MAX_ATTEMPTS - user.otp.attempts
      });
    }

    user.otp.verified = true;
    user.markModified('otp');
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
      email: normalizeEmail(email),
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
      user: publicUser(user)
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
 * @desc    Resend a code for registration or password reset
 * @route   POST /api/auth/resend-otp
 * @access  Public
 * @body    { email, purpose: 'registration' }
 * @body    { email, purpose: 'password_reset' }
 */
export const resendOTP = async (req, res) => {
  try {
    const purpose = req.body.purpose || 'registration';

    if (!['registration', 'password_reset'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purpose. Use "registration" or "password_reset"'
      });
    }

    const email = normalizeEmail(req.body.email);

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    let user;
    if (purpose === 'registration') {
      user = await User.findOne({
        email,
        isPhoneVerified: { $ne: true },
        isEmailVerified: { $ne: true }
      });
    } else {
      user = await User.findOne({
        email,
        $or: [{ isPhoneVerified: true }, { isEmailVerified: true }]
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Rate limiting (the app also shows a 60 second countdown)
    if (isCoolingDown(user)) {
      const retryAfter = cooldownSecondsLeft(user);
      return res.status(429).json({
        success: false,
        message: `Please wait ${retryAfter} seconds before requesting another code`,
        retryAfter
      });
    }

    const otp = purpose === 'registration' ? generateRegistrationOTP() : OTPService.generateOTP();
    user.otp = await buildOtp(otp, purpose);

    await user.save();

    if (purpose === 'registration') {
      const sent = await sendRegistrationCode({ phone: user.phone, email: user.email, otp });
      if (!sent) {
        return res.status(503).json({
          success: false,
          message: 'We could not send a new code. Please try again.'
        });
      }
    } else {
      try {
        await emailService.sendPasswordResetOTP(user.email, otp);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError.message);
      }
    }

    res.json({
      success: true,
      message: 'A new code has been sent',
      expiresIn: OTP_TTL_MS / 1000,
      resendIn: RESEND_COOLDOWN_MS / 1000
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
};
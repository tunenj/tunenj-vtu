// models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,  // This automatically creates an index - NO NEED for index:true
    lowercase: true
  },

  phone: {
    type: String,
    required: true,
    unique: true,  // This automatically creates an index - NO NEED for index:true
  },

  password: {
    type: String,
    required: true
  },

  pin: {
    type: String
  }, // 4-digit transaction PIN (hashed)

  role: {
    type: String,
    enum: ['user', 'admin', 'reseller'],
    default: 'user'
  },

  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },

  // OTP fields
  otp: {
    code: {
      type: String
    },
    purpose: {
      type: String,
      enum: ['registration', 'password_reset', 'pin_reset', 'login']
    },
    expiresAt: {
      type: Date
    },
    attempts: {
      type: Number,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false
    }
  },

  // Temporary storage for pending registration
  pendingRegistration: {
    name: {
      type: String
    },
    email: {
      type: String
    },
    phone: {
      type: String
    },
    password: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600 // Auto-delete after 1 hour
    }
  },

  // Password reset fields
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },

  // Beneficiaries
  beneficiaries: [
    {
      phone: { type: String },
      network: { type: String },
      nickname: { type: String },
      type: { type: String },
    }
  ],

  // Login tracking
  lastLoginAt: { type: Date },
  lastLoginIP: { type: String },
  lastLoginUserAgent: { type: String },

}, { timestamps: true });

// ─── INDEXES ───────────────────────────────────────────────────────────────
// REMOVED DUPLICATE INDEXES for email and phone
// Keep only the TTL index for auto-deleting expired OTPs
UserSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────
UserSchema.pre('save', async function () {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Hash PIN if modified
  if (this.isModified('pin') && this.pin) {
    this.pin = await bcrypt.hash(this.pin, 12);
  }
  // Don't call next() - async functions auto-resolve
});
// ─── METHODS ───────────────────────────────────────────────────────────────

/**
 * Compare entered password with hashed password
 */
UserSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

/**
 * Compare entered PIN with hashed PIN
 */
UserSchema.methods.matchPIN = function (entered) {
  if (!this.pin) return false;
  return bcrypt.compare(entered, this.pin);
};

/**
 * Check if OTP is valid and not expired
 */
UserSchema.methods.isOTPValid = function (otp) {
  return this.otp?.code === otp && Date.now() < this.otp?.expiresAt;
};

/**
 * Clear OTP fields after verification
 */
UserSchema.methods.clearOTP = function () {
  this.otp = undefined;
};

/**
 * Verify email and mark as verified
 */
UserSchema.methods.verifyEmail = async function () {
  this.isEmailVerified = true;
  this.verifiedAt = new Date();
  this.clearOTP();
  return this.save();
};

export default mongoose.model('User', UserSchema);
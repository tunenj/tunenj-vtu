// models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },

  lastName: {
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

  referralCode: {
    type: String,
    unique: true,
    sparse: true,  // allow multiple users without a code (pending registrations)
    uppercase: true,
    trim: true
  },

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Phone verification fields
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerifiedAt: {
    type: Date
  },

  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },

  termsAcceptedAt: {
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
    sentAt: {
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
// email and phone already have unique indexes from the schema definitions.
// Add a TTL index so expired OTPs get cleaned up automatically.
UserSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 });

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
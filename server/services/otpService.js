import crypto from 'crypto';
import bcrypt from 'bcryptjs';

class OTPService {
  /**
   * Generate a random OTP
   * @param {number} length - OTP length (default: 4)
   * @returns {string} - Generated OTP
   */
  generateOTP(length = 4) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Hash OTP for secure storage
   * @param {string} otp - Plain OTP
   * @returns {Promise<string>} - Hashed OTP
   */
  async hashOTP(otp) {
    return await bcrypt.hash(otp, 10);
  }

  /**
   * Compare plain OTP with hashed OTP
   * @param {string} plainOTP - Plain OTP to verify
   * @param {string} hashedOTP - Stored hashed OTP
   * @returns {Promise<boolean>}
   */
  async verifyOTP(plainOTP, hashedOTP) {
    return await bcrypt.compare(plainOTP, hashedOTP);
  }

  /**
   * Generate a secure token (for password reset links)
   * @returns {string} - Random token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token for storage
   * @param {string} token - Plain token
   * @returns {string} - Hashed token
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export default new OTPService();
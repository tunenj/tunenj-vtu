// services/email/templates.js

/**
 * Email Templates
 * All HTML email templates in one organized file
 */

// ─── OTP TEMPLATE ──────────────────────────────────────────────────────────

const otpTemplate = (otp) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Email Verification</h2>
    <p>Your OTP code is:</p>
    <h1 style="font-size: 48px; letter-spacing: 8px; color: #6F0C15;">
      ${otp}
    </h1>
    <p>This code expires in 5 minutes.</p>
  </div>
`;

// ─── PASSWORD RESET TEMPLATE ───────────────────────────────────────────────

const passwordResetTemplate = (resetUrl) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Password Reset Request</h2>
    <p>Click below to reset your password:</p>
    <a href="${resetUrl}" style="background-color: #6F0C15; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Reset Password
    </a>
    <p>Or copy this link:</p>
    <p>${resetUrl}</p>
    <p>This link expires in 1 hour.</p>
  </div>
`;

// ─── WELCOME TEMPLATE ──────────────────────────────────────────────────────

const welcomeTemplate = (name) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welcome to VTU App, ${name}! 🎉</h2>
    <p>Your email has been verified successfully.</p>
    <p>You can now:</p>
    <ul>
      <li>Buy airtime and data instantly</li>
      <li>Manage your beneficiaries</li>
      <li>Track transaction history</li>
    </ul>
  </div>
`;

// ─── TRANSACTION RECEIPT TEMPLATE ──────────────────────────────────────────

const receiptTemplate = (transaction) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Transaction Receipt</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>Type:</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">${transaction.type || 'N/A'}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>Amount:</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">₦${transaction.amount || '0'}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>Date:</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px;">${transaction.date || new Date().toLocaleString()}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;"><strong>Status:</strong></td>
        <td style="border: 1px solid #ddd; padding: 10px; color: green;"><strong>${transaction.status || 'Pending'}</strong></td>
      </tr>
    </table>
  </div>
`;

// ─── EXPORT TEMPLATES OBJECT ───────────────────────────────────────────────

const templates = {
  otp: otpTemplate,
  passwordReset: passwordResetTemplate,
  welcome: welcomeTemplate,
  receipt: receiptTemplate
};

export { templates };

export default templates;
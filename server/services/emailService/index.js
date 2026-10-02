import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    if (this.isDevelopment) {
      // For development: use ethereal.email for testing
      this.initializeTestAccount();
    } else {
      // For production: use Gmail
      this.initializeTransporter();
    }
  }

  async initializeTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      console.log('📧 Email service initialized in DEVELOPMENT mode');
    } catch (error) {
      console.error('Failed to initialize test email account:', error);
    }
  }

  initializeTransporter() {
    // ✅ Use Gmail service instead of host/port
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,    // Your existing env vars
        pass: process.env.SMTP_PASS
      }
    });
    
    console.log('✅ Gmail service ready for production');
  }

  async sendEmail({ to, subject, html }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"VTU Backend" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      });

      if (this.isDevelopment) {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendRegistrationOTP(email, otp) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to VTU Backend!</h2>
        <p>Your email verification OTP is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - VTU Backend',
      html
    });
  }

  async sendPasswordResetOTP(email, otp) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Use this OTP to proceed:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset OTP - VTU Backend',
      html
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - VTU Backend',
      html
    });
  }
}

export const emailService = new EmailService();
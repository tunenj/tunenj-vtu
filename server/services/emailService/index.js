import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';

    if (this.isDevelopment) {
      // Development: use Ethereal for testing
      this.initializeTestAccount();
    } else {
      // Production: use Gmail
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
          pass: testAccount.pass,
        },
      });

      console.log('📧 Email service initialized in DEVELOPMENT mode');
    } catch (error) {
      console.error('Failed to initialize test email account:', error);
    }
  }

  initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('✅ Gmail service ready for production');
  }

  async sendEmail({ to, subject, html }) {
    try {
      const info = await this.transporter.sendMail({
        // For now Gmail is still the real email address.
        // "Tunenj" is only the display name.
        from: `"Tunenj" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      if (this.isDevelopment) {
        console.log(
          '📧 Preview URL:',
          nodemailer.getTestMessageUrl(info)
        );
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Email sending failed:', error.message);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendRegistrationOTP(email, otp) {
    const html = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">
        <h2 style="color: #281C9D;">Welcome to Tunenj 👋</h2>

        <p>
          Thank you for creating your Tunenj account.
        </p>

        <p>
          Your email verification code is:
        </p>

        <div style="
          background: #f4f4f4;
          padding: 20px;
          text-align: center;
          font-size: 32px;
          letter-spacing: 5px;
          font-weight: bold;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>
          This code will expire in <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not create a Tunenj account, you can safely ignore
          this email.
        </p>

        <hr style="border: none; border-top: 1px solid #eee;">

        <p style="font-size: 12px; color: #777;">
          Tunenj<br>
          Airtime • Data • Bills • Payments
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Tunenj Account',
      html,
    });
  }

  async sendWelcomeEmail(email, firstName = 'there') {
    const safeName = String(firstName || 'there').trim() || 'there';

    const html = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">
        <h2 style="color: #281C9D;">Welcome to Tunenj, ${safeName}! 🎉</h2>

        <p>
          Your account is now verified and ready to use.
        </p>

        <p>
          With Tunenj you can:
        </p>

        <ul style="line-height: 1.8;">
          <li>Buy airtime for MTN, GLO, AIRTEL, and 9MOBILE</li>
          <li>Purchase data bundles in seconds</li>
          <li>Pay electricity bills</li>
          <li>Subscribe to DSTV, GOTV, and Startimes</li>
          <li>Send and receive money securely</li>
        </ul>

        <p>
          We're glad to have you on board.
        </p>

        <hr style="border: none; border-top: 1px solid #eee;">

        <p style="font-size: 12px; color: #777;">
          Tunenj<br>
          Airtime • Data • Bills • Payments
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Tunenj 🎉',
      html,
    });
  }

  async sendPasswordResetOTP(email, otp) {
    const html = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">
        <h2 style="color: #281C9D;">Reset Your Tunenj Password</h2>

        <p>
          We received a request to reset your Tunenj password.
        </p>

        <p>
          Your verification code is:
        </p>

        <div style="
          background: #f4f4f4;
          padding: 20px;
          text-align: center;
          font-size: 32px;
          letter-spacing: 5px;
          font-weight: bold;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>
          This code will expire in <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not request a password reset, please ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #eee;">

        <p style="font-size: 12px; color: #777;">
          Tunenj<br>
          Airtime • Data • Bills • Payments
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Tunenj Password Reset Code',
      html,
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 30px;
        color: #333;
      ">
        <h2 style="color: #281C9D;">Reset Your Tunenj Password</h2>

        <p>
          We received a request to reset your Tunenj password.
        </p>

        <p>
          Click the button below to create a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a
            href="${resetUrl}"
            style="
              background: #281C9D;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
            "
          >
            Reset Password
          </a>
        </div>

        <p style="font-size: 13px; color: #777;">
          If you did not request a password reset, you can safely ignore
          this email.
        </p>

        <hr style="border: none; border-top: 1px solid #eee;">

        <p style="font-size: 12px; color: #777;">
          Tunenj<br>
          Airtime • Data • Bills • Payments
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Tunenj Password',
      html,
    });
  }
}

export const emailService = new EmailService();
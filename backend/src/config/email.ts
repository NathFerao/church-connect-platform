import nodemailer from 'nodemailer';

// Create transporter
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
export const emailTemplates = {
  passwordReset: (resetLink: string, firstName: string) => ({
    subject: 'Reset Your Password - Church Connect',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4F46E5, #6366f1); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>We received a request to reset your password for your Church Connect account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetLink}" class="button">Reset Password</a>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <div class="footer">
                <p>Church Connect<br>Stay connected with your church community</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${firstName},
      
      We received a request to reset your password for your Church Connect account.
      
      Click the link below to reset your password:
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
      
      Church Connect
    `,
  }),
};

// Send email helper
export const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Church Connect" <noreply@churchconnect.com>',
      to,
      subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

// Send contact form notification email
export const sendContactNotification = async (contactData) => {
  try {
    const { name, email, subject, message, ipAddress } = contactData;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER, // Send to yourself
      subject: `🔔 New Contact Form Message: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #ff9955; margin-bottom: 20px;">New Contact Form Submission</h2>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ipAddress || 'N/A'}</p>
          </div>

          <div style="background-color: #fff; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; color: #555;">${message}</p>
          </div>

          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
            <p>You can reply directly to this message by clicking the email address above.</p>
            <p>Or view all messages in your admin panel: <a href="${process.env.CORS_ORIGIN}/admin/contacts" style="color: #ff9955;">Admin Panel</a></p>
          </div>
        </div>
      `,
      replyTo: email // Allow direct reply to the sender
    };

    const info = await getTransporter().sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw error - we don't want email failure to break the contact form
    return { success: false, error: error.message };
  }
};

// Test email configuration
export const testEmailConfig = async () => {
  try {
    await getTransporter().verify();
    console.log('✅ Email configuration is valid and ready to send emails');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

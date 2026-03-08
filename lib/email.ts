import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  });
};

interface SendMessageNotificationParams {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messagePreview: string;
}

/**
 * Send an email notification to a user about a new unread message
 */
export async function sendMessageNotification({
  recipientEmail,
  recipientName,
  senderName,
  messagePreview,
}: SendMessageNotificationParams): Promise<boolean> {
  try {
    console.log('=== EMAIL DEBUG INFO ===');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_USER (SMTP Login):', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
    console.log('EMAIL_FROM (Sender):', process.env.EMAIL_FROM || process.env.EMAIL_USER);
    console.log('Recipient:', recipientEmail);
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email transporter not configured, skipping email notification');
      return false;
    }

    // Use EMAIL_FROM if set (verified sender), otherwise fall back to EMAIL_USER
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: `"DartSwap" <${fromEmail}>`,
      to: recipientEmail,
      subject: 'New Message on DartSwap',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #00693e;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
              }
              .content {
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
                border-top: none;
                border-radius: 0 0 5px 5px;
              }
              .message-preview {
                background-color: white;
                padding: 15px;
                border-left: 4px solid #00693e;
                margin: 20px 0;
                font-style: italic;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #00693e;
                color: white !important;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
              }
              a {
                color: #00693e;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>DartSwap</h1>
              </div>
              <div class="content">
                <h2>Hi ${recipientName},</h2>
                <p>You have a new message from <strong>${senderName}</strong>:</p>
                <div class="message-preview">
                  ${messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview}
                </div>
                <p>Log in to DartSwap to read and reply to this message.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/messages" class="button">
                  View Message
                </a>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} DartSwap. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${recipientName},

You have a new message from ${senderName}:

"${messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview}"

Log in to DartSwap to read and reply to this message: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/messages

This is an automated message. Please do not reply to this email.

© ${new Date().getFullYear()} DartSwap. All rights reserved.`,
    };

    console.log('Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('=== EMAIL SEND RESULT ===');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('Pending:', info.pending);
    console.log(`Message notification email sent to ${recipientEmail}`);
    console.log('========================');
    return true;
  } catch (error) {
    console.error('=== EMAIL ERROR ===');
    console.error('Error sending message notification email:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    console.error('===================');
    return false;
  }
}
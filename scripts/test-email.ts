import dotenv from 'dotenv';
import { sendMessageNotification } from '../lib/email';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEmail() {
  console.log('Testing Brevo SMTP email...');
  console.log('Sending to: cody.r.kletter.29@dartmouth.edu');
  
  const result = await sendMessageNotification({
    recipientEmail: 'cody.r.kletter.29@dartmouth.edu',
    recipientName: 'Cody',
    senderName: 'Test User',
    messagePreview: 'This is a test email from DartSwap using Brevo SMTP. If you receive this, your email configuration is working correctly!'
  });
  
  if (result) {
    console.log('✅ Test email sent successfully!');
    console.log('Check your inbox at cody.r.kletter.29@dartmouth.edu');
  } else {
    console.log('❌ Failed to send test email. Check the error messages above.');
  }
  
  process.exit(0);
}

testEmail();

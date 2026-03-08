# Email Notifications Setup Guide

This guide explains how to set up and use the email notification feature for DartSwap.

## Overview

The email notification system sends automated emails to users when they receive a new message and have been inactive for more than 15 minutes. This helps keep users engaged even when they're not actively using the app.

## Features

- **Automatic Detection**: Tracks user activity and only sends emails to inactive users
- **Inactivity Threshold**: Emails are sent only if the user has been inactive for 15+ minutes
- **Professional Design**: HTML emails with DartSwap branding
- **Do Not Reply**: Clearly marked as automated notifications
- **Direct Links**: Includes a button to view messages directly

## Setup Instructions

### 1. Configure Email Credentials

You need to add email configuration to your `.env.local` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Gmail Setup (Recommended for Development)

If using Gmail, you'll need to create an **App Password**:

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification (enable if not already)
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use this password in `EMAIL_PASS` (not your regular Gmail password)

**Important**: Never commit your `.env.local` file to version control!

### 3. Production Email Services

For production, consider using dedicated email services:

- **SendGrid**: Reliable, free tier available
- **AWS SES**: Cost-effective for high volume
- **Mailgun**: Developer-friendly API
- **Postmark**: Excellent deliverability

To use these services, modify [`lib/email.ts`](lib/email.ts) to use their SMTP settings or API.

## How It Works

### 1. Activity Tracking

The [`User`](models/User.ts) model now includes a `lastActiveAt` timestamp that tracks when users were last active.

### 2. Activity Updates

User activity is updated through the [`updateUserActivity()`](lib/auth.ts:82) function in [`lib/auth.ts`](lib/auth.ts). You can call this function in:

- API routes that users interact with
- Middleware for page loads
- WebSocket connections (if implemented)

**Example usage:**
```typescript
import { updateUserActivity } from '@/lib/auth';

// In any API route
const user = await getCurrentUser();
if (user) {
  await updateUserActivity(user.userId);
}
```

### 3. Message Notification Logic

When a message is sent in [`app/api/conversations/[id]/messages/route.ts`](app/api/conversations/[id]/messages/route.ts:155):

1. The recipient's `lastActiveAt` is checked
2. If inactive for 15+ minutes, an email is sent
3. Email sending happens asynchronously (doesn't block the response)
4. Errors are logged but don't fail the message send

### 4. Email Template

The email template in [`lib/email.ts`](lib/email.ts) includes:

- DartSwap branding with Dartmouth green (#00693e)
- Sender's name
- Message preview (truncated to 100 characters)
- Direct link to messages page
- Professional HTML and plain text versions

## Customization

### Change Inactivity Threshold

In [`app/api/conversations/[id]/messages/route.ts`](app/api/conversations/[id]/messages/route.ts:165):

```typescript
const INACTIVE_THRESHOLD_MINUTES = 15; // Change this value
```

### Customize Email Template

Edit the HTML template in [`lib/email.ts`](lib/email.ts:40) to:
- Change colors and styling
- Modify the message format
- Add additional information
- Update branding

### Add More Activity Tracking

To track activity in more places, add calls to `updateUserActivity()`:

```typescript
// Example: In a page component's API route
import { updateUserActivity, getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (user) {
    await updateUserActivity(user.userId);
  }
  // ... rest of your code
}
```

## Testing

### Test Email Sending

1. Set up your email credentials in `.env.local`
2. Create two test accounts
3. Log in with Account A
4. Wait 15+ minutes (or temporarily reduce the threshold for testing)
5. Log in with Account B and send a message to Account A
6. Check Account A's email inbox

### Test Without Waiting

For quick testing, temporarily change the threshold in [`app/api/conversations/[id]/messages/route.ts`](app/api/conversations/[id]/messages/route.ts:165):

```typescript
const INACTIVE_THRESHOLD_MINUTES = 0; // Send email immediately for testing
```

**Remember to change it back to 15 after testing!**

## Troubleshooting

### Emails Not Sending

1. **Check credentials**: Verify `EMAIL_USER` and `EMAIL_PASS` in `.env.local`
2. **Check console logs**: Look for error messages in your terminal
3. **Gmail App Password**: Make sure you're using an App Password, not your regular password
4. **2-Step Verification**: Gmail requires 2-Step Verification to be enabled
5. **Less Secure Apps**: If using older Gmail setup, you may need to enable "Less secure app access"

### Emails Going to Spam

- Add a proper "From" name in the email configuration
- Consider using a dedicated email service (SendGrid, etc.)
- Set up SPF, DKIM, and DMARC records for your domain

### Activity Not Updating

Make sure you're calling `updateUserActivity()` in the right places. Add it to:
- Login/authentication routes
- Frequently accessed API endpoints
- Page load handlers

## Security Considerations

1. **Never commit `.env.local`**: Keep credentials out of version control
2. **Use App Passwords**: Don't use your main email password
3. **Rate Limiting**: Consider adding rate limits to prevent email spam
4. **Email Validation**: The system only sends to verified @dartmouth.edu emails
5. **Async Sending**: Emails are sent asynchronously to prevent blocking

## Future Enhancements

Potential improvements to consider:

- **Email Preferences**: Let users opt-out of notifications
- **Digest Emails**: Batch multiple messages into one email
- **Custom Schedules**: Allow users to set quiet hours
- **Push Notifications**: Add browser/mobile push notifications
- **Email Templates**: Create different templates for different notification types
- **Unsubscribe Link**: Add one-click unsubscribe functionality

## Files Modified

- [`models/User.ts`](models/User.ts) - Added `lastActiveAt` field
- [`lib/auth.ts`](lib/auth.ts) - Added `updateUserActivity()` function
- [`lib/email.ts`](lib/email.ts) - New file with email sending logic
- [`app/api/conversations/[id]/messages/route.ts`](app/api/conversations/[id]/messages/route.ts) - Added notification trigger
- [`.env.example`](.env.example) - Added email configuration variables
- [`package.json`](package.json) - Added nodemailer dependencies

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your email configuration
3. Test with a simple email first
4. Review the troubleshooting section above
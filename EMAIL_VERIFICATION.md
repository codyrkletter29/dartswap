# Email Verification System Documentation

## Overview

DartSwap implements a secure email verification system to ensure all users have valid Dartmouth email addresses. New users must verify their email before accessing protected features of the application.

### Key Features

- **6-digit verification codes** sent via email
- **10-minute code expiration** for security
- **Rate limiting** (60-second cooldown between resend requests)
- **Attempt limiting** (5 attempts per code before requiring a new one)
- **Graceful degradation** (registration succeeds even if email fails to send)
- **Protected routes** using VerificationGuard component
- **Seamless user experience** with automatic redirects

---

## How It Works

### Step-by-Step Verification Flow

1. **User Registration**
   - User submits registration form with name, email (@dartmouth.edu), and password
   - Server creates user account with `isVerified: false`
   - Server generates a random 6-digit verification code
   - Code is stored in database with 10-minute expiration
   - Verification email is sent to user's Dartmouth email
   - User is logged in and redirected to `/verify-email`

2. **Email Verification**
   - User receives email with 6-digit code
   - User enters code on verification page
   - Server validates code against stored hash
   - On success: `isVerified` set to `true`, user redirected to home
   - On failure: Error shown with remaining attempts

3. **Protected Route Access**
   - User attempts to access protected page (e.g., `/sell`, `/messages`)
   - `VerificationGuard` checks if user is verified
   - If not verified: redirect to `/verify-email`
   - If verified: render protected content

4. **Code Resend**
   - User can request new code if not received
   - 60-second cooldown prevents spam
   - New code invalidates previous code
   - Attempt counter resets

---

## API Endpoints

### POST `/api/auth/register`

Creates a new user account and sends verification email.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@dartmouth.edu",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@dartmouth.edu"
  }
}
```

**Errors:**
- `400` - Validation failed or user already exists
- `500` - Server error

---

### POST `/api/auth/verify-email`

Verifies the user's email with the provided code.

**Authentication:** Required (JWT cookie)

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Errors:**
- `400` - Invalid code, expired code, or too many attempts
- `401` - Not authenticated
- `404` - User not found
- `500` - Server error

**Error Examples:**
```json
{
  "error": "Invalid verification code. 3 attempts remaining."
}
```
```json
{
  "error": "Verification code has expired. Please request a new code."
}
```
```json
{
  "error": "Too many failed attempts. Please request a new verification code."
}
```

---

### POST `/api/auth/resend-verification`

Sends a new verification code to the user's email.

**Authentication:** Required (JWT cookie)

**Request Body:** None

**Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

**Errors:**
- `400` - Email already verified
- `401` - Not authenticated
- `404` - User not found
- `429` - Rate limit exceeded (must wait before requesting new code)
- `500` - Server error

**Rate Limit Error Example:**
```json
{
  "error": "Please wait 45 seconds before requesting a new code"
}
```

---

### POST `/api/auth/login`

Authenticates a user and creates a session.

**Note:** Login does NOT require email verification. Unverified users can log in but will be redirected to `/verify-email` when accessing protected routes.

**Request Body:**
```json
{
  "email": "john.doe@dartmouth.edu",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@dartmouth.edu"
  }
}
```

---

### GET `/api/auth/me`

Returns the current authenticated user's information including verification status.

**Authentication:** Required (JWT cookie)

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@dartmouth.edu",
    "isVerified": true
  }
}
```

---

## Database Schema

### User Model Fields

```typescript
interface IUser {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastActiveAt: Date;
  
  // Verification fields
  verificationCode?: string;           // 6-digit code (select: false)
  verificationCodeExpiry?: Date;       // Expiration timestamp
  verificationAttempts: number;        // Failed attempt counter (default: 0)
  isVerified: boolean;                 // Verification status (default: false)
  lastCodeSentAt?: Date;              // Rate limiting timestamp
}
```

**Indexes:**
- `email` (unique)
- `isVerified` (for query performance)

---

## Configuration Requirements

### Environment Variables

The email verification system requires the following environment variables to be configured in `.env.local`:

```bash
# Brevo SMTP Configuration
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-smtp-login@example.com
EMAIL_PASS=your-brevo-smtp-key
EMAIL_FROM=verified-sender@dartmouth.edu

# Application URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret (for authentication)
JWT_SECRET=your-secure-random-secret-key

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dartswap
```

### Brevo Setup

1. **Create Brevo Account**
   - Sign up at [brevo.com](https://www.brevo.com)
   - Verify your account

2. **Configure SMTP**
   - Go to SMTP & API settings
   - Generate SMTP key
   - Copy credentials to `.env.local`

3. **Verify Sender Email**
   - Add your @dartmouth.edu email as a sender
   - Complete verification process
   - Use this email as `EMAIL_FROM`

For detailed Brevo setup instructions, see [`BREVO_SETUP_GUIDE.md`](BREVO_SETUP_GUIDE.md).

---

## UI Components

### VerificationGuard Component

Protects routes by checking user authentication and verification status.

**Location:** `components/VerificationGuard.tsx`

**Usage:**
```tsx
import VerificationGuard from '@/components/VerificationGuard';

export default function ProtectedPage() {
  return (
    <VerificationGuard>
      <div>Protected content here</div>
    </VerificationGuard>
  );
}
```

**Behavior:**
- Shows loading state while checking auth
- Redirects to `/login` if not authenticated
- Redirects to `/verify-email` if not verified
- Renders children if authenticated and verified

**Protected Pages:**
- `/` (Home page with listings)
- `/sell` (Create listing)
- `/my-listings` (User's listings)
- `/messages` (Conversations list)
- `/messages/[id]` (Conversation detail)

### Verify Email Page

**Location:** `app/verify-email/page.tsx`

**Features:**
- 6-digit code input with validation
- Real-time input formatting (numbers only)
- Resend button with 60-second countdown
- Error and success messages
- Auto-redirect on successful verification
- Redirects to login if not authenticated
- Redirects to home if already verified

---

## Testing Instructions

### Manual Testing

1. **Test Registration Flow**
   ```bash
   # Start development server
   npm run dev
   
   # Navigate to http://localhost:3000/register
   # Fill in registration form with @dartmouth.edu email
   # Submit form
   # Check email for verification code
   # Verify you're redirected to /verify-email
   ```

2. **Test Verification**
   ```bash
   # Enter the 6-digit code from email
   # Verify success message appears
   # Verify redirect to home page
   # Verify you can access protected routes
   ```

3. **Test Invalid Code**
   ```bash
   # Enter incorrect code
   # Verify error message shows remaining attempts
   # Try 5 times to trigger lockout
   # Verify code is invalidated after 5 attempts
   ```

4. **Test Code Expiration**
   ```bash
   # Wait 10 minutes after receiving code
   # Try to verify with expired code
   # Verify expiration error message
   # Request new code
   ```

5. **Test Resend Functionality**
   ```bash
   # Click "Resend code" button
   # Verify countdown timer appears
   # Verify button is disabled during countdown
   # Check email for new code
   # Verify new code works
   ```

6. **Test Rate Limiting**
   ```bash
   # Request new code
   # Immediately try to request another
   # Verify rate limit error with seconds remaining
   ```

7. **Test Protected Routes**
   ```bash
   # Log out
   # Try to access /sell
   # Verify redirect to /login
   # Log in with unverified account
   # Verify redirect to /verify-email
   # Verify email
   # Verify access to /sell is granted
   ```

### Automated Testing with Test Script

```bash
# Run the email test script
npm run test:email
```

This script tests the email sending functionality without creating a user.

---

## Security Considerations

### Implemented Security Measures

1. **Code Expiration**
   - Codes expire after 10 minutes
   - Prevents long-term code reuse

2. **Attempt Limiting**
   - Maximum 5 attempts per code
   - Code invalidated after 5 failed attempts
   - Prevents brute force attacks

3. **Rate Limiting**
   - 60-second cooldown between resend requests
   - Prevents email spam and abuse

4. **Secure Storage**
   - Verification codes excluded from queries by default (`select: false`)
   - Codes stored in database, not in JWT
   - Codes deleted after successful verification

5. **Authentication Required**
   - All verification endpoints require valid JWT
   - Prevents unauthorized verification attempts

6. **HTTPS in Production**
   - Cookies set with `secure: true` in production
   - Prevents man-in-the-middle attacks

### Best Practices

- ✅ Codes are random 6-digit numbers (100,000 - 999,999)
- ✅ Codes are single-use (deleted after verification)
- ✅ Email failures don't prevent registration (graceful degradation)
- ✅ Clear error messages without exposing sensitive info
- ✅ Verification status checked on every protected route access

---

## Troubleshooting Common Issues

### Issue: Verification emails not being sent

**Symptoms:**
- User registers but doesn't receive email
- Console shows email errors

**Solutions:**
1. Check environment variables are set correctly
   ```bash
   # Verify in .env.local
   EMAIL_USER=your-smtp-login
   EMAIL_PASS=your-smtp-key
   EMAIL_FROM=verified-sender@dartmouth.edu
   ```

2. Verify Brevo SMTP credentials
   - Log into Brevo dashboard
   - Check SMTP key is active
   - Regenerate key if needed

3. Check sender email is verified in Brevo
   - Go to Senders & IP settings
   - Verify sender email status
   - Complete verification if pending

4. Check server logs for detailed error messages
   ```bash
   # Look for "EMAIL ERROR" in console
   npm run dev
   ```

5. Test email configuration
   ```bash
   npm run test:email
   ```

---

### Issue: "Verification code has expired"

**Symptoms:**
- User enters code but gets expiration error
- Code was received more than 10 minutes ago

**Solutions:**
1. Request a new verification code
   - Click "Resend code" button
   - Check email for new code
   - Enter new code within 10 minutes

2. Check system time is correct
   - Verify server time matches actual time
   - Time zone issues can cause premature expiration

---

### Issue: "Too many failed attempts"

**Symptoms:**
- User entered wrong code 5 times
- Code is now locked

**Solutions:**
1. Request a new verification code
   - Click "Resend code" button
   - Wait for 60-second cooldown if needed
   - Use new code

2. Verify code is being entered correctly
   - Check for typos
   - Ensure all 6 digits are entered
   - Code is numbers only

---

### Issue: Rate limit error when resending

**Symptoms:**
- "Please wait X seconds before requesting a new code"

**Solutions:**
1. Wait for the countdown to complete
   - Countdown shown in button text
   - Button re-enables automatically

2. If stuck, check `lastCodeSentAt` in database
   ```javascript
   // In MongoDB shell or Compass
   db.users.findOne({ email: "user@dartmouth.edu" })
   ```

---

### Issue: User stuck on verification page after verifying

**Symptoms:**
- User verified but still sees verification page
- No redirect to home

**Solutions:**
1. Refresh the page
   - Browser may have cached old state

2. Check `isVerified` status in database
   ```javascript
   db.users.findOne({ email: "user@dartmouth.edu" })
   // Should show isVerified: true
   ```

3. Log out and log back in
   - Ensures fresh user data is loaded

---

### Issue: Protected routes accessible without verification

**Symptoms:**
- Unverified users can access protected pages

**Solutions:**
1. Verify VerificationGuard is wrapping the page
   ```tsx
   // Page should look like this:
   export default function ProtectedPage() {
     return (
       <VerificationGuard>
         {/* content */}
       </VerificationGuard>
     );
   }
   ```

2. Check AuthContext is providing correct user data
   - Verify `isVerified` field is included in user object
   - Check `/api/auth/me` endpoint returns `isVerified`

---

## Implementation Details

### Email Template

The verification email includes:
- DartSwap branding with Dartmouth green (#00693e)
- Large, easy-to-read 6-digit code
- Expiration notice (10 minutes)
- Professional HTML and plain text versions
- Responsive design for mobile devices

### Code Generation

```typescript
function generateVerificationCode(): string {
  // Generates random number between 100000 and 999999
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}
```

### Verification Logic

```typescript
// Pseudo-code for verification process
1. Validate code format (6 digits)
2. Check user is authenticated
3. Check user exists and is not already verified
4. Check code exists and hasn't expired
5. Check attempts < 5
6. Compare submitted code with stored code
7. If match:
   - Set isVerified = true
   - Clear verification fields
   - Return success
8. If no match:
   - Increment attempts
   - Return error with remaining attempts
9. If attempts >= 5:
   - Invalidate code
   - Return error requiring new code
```

---

## Future Enhancements

### Potential Improvements

1. **Email Verification Link**
   - Add clickable link in email as alternative to code
   - One-click verification for better UX

2. **SMS Verification**
   - Add phone number verification option
   - Two-factor authentication

3. **Email Change Verification**
   - Require verification when user changes email
   - Send code to both old and new email

4. **Admin Dashboard**
   - View verification statistics
   - Manually verify users if needed
   - Resend verification emails

5. **Verification Reminders**
   - Send reminder email after 24 hours if not verified
   - Limit account functionality until verified

6. **Analytics**
   - Track verification completion rate
   - Monitor email delivery success rate
   - Identify common verification issues

---

## Related Documentation

- [`BREVO_SETUP_GUIDE.md`](BREVO_SETUP_GUIDE.md) - Detailed Brevo configuration
- [`EMAIL_NOTIFICATIONS.md`](EMAIL_NOTIFICATIONS.md) - Message notification system
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - Overall system architecture
- [`README.md`](README.md) - General project documentation

---

## Support

For issues or questions:
1. Check this documentation first
2. Review troubleshooting section
3. Check server logs for detailed errors
4. Verify environment variables are set correctly
5. Test email configuration with test script

---

**Last Updated:** April 8, 2026
**Version:** 1.0.0

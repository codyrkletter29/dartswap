# Brevo Email Setup Guide

## Issue Diagnosed
Authentication Error: `535 5.7.8 Authentication failed`

Your current Brevo SMTP credentials are invalid or expired. You need to generate new SMTP credentials.

## Steps to Fix

### 1. Log into Brevo
Go to https://app.brevo.com and log in

### 2. Navigate to SMTP & API Settings
- Click on your name/profile in the top right
- Select **"SMTP & API"** from the dropdown menu
- OR go directly to: https://app.brevo.com/settings/keys/smtp

### 3. Generate New SMTP Credentials

#### Option A: If you see existing SMTP credentials
- You should see your SMTP login and password
- Copy the **Login** (format: something like `your-email@smtp-brevo.com`)
- Copy the **SMTP Key/Password** (long alphanumeric string)

#### Option B: If you need to create new credentials
- Click **"Generate a new SMTP key"** or **"Create SMTP key"**
- Give it a name (e.g., "DartSwap Development")
- Copy the generated SMTP key immediately (you won't be able to see it again!)
- Your SMTP login will be shown (format: `xxxxx@smtp-brevo.com`)

### 4. Verify Sender Email (IMPORTANT!)
Before emails will be delivered, you must verify a sender email:

1. Go to **Settings → Senders & IP** (or https://app.brevo.com/senders)
2. Click **"Add a Sender"**
3. Enter your email address (recommended: `cody.r.kletter.29@dartmouth.edu`)
4. Brevo will send a verification email to that address
5. Check your email and click the verification link
6. Wait for confirmation that the sender is verified

### 5. Update Your .env.local File

Once you have the new credentials, update these values in `.env.local`:

```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-new-login@smtp-brevo.com
EMAIL_PASS=your-new-smtp-key-here
EMAIL_FROM=cody.r.kletter.29@dartmouth.edu  # Your verified sender email
```

### 6. Test Again
Run: `npm run test-email`

## Common Issues

### "Authentication failed"
- SMTP credentials are wrong or expired
- Generate new SMTP key in Brevo dashboard

### "Email sent but not received"
- Sender email not verified in Brevo
- Check spam/junk folder
- Verify sender email in Brevo settings

### "Invalid sender"
- The EMAIL_FROM address must be verified in Brevo
- Go to Senders & IP and verify your email

## Need Help?
1. Make sure you're logged into the correct Brevo account
2. Check that your Brevo account is active (not suspended)
3. Verify you're on a plan that allows SMTP sending (free tier allows 300 emails/day)

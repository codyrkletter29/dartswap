# Development Environment Reset Guide

This guide will help you completely reset your development environment to test the email verification feature from scratch.

## Overview

To properly test the email verification flow, you need to:
1. Clear your browser authentication (logout)
2. Clear the MongoDB development database
3. Register a new account

---

## Step 1: Clear Browser Authentication

You have two options to clear your login session:

### Option A: Logout via the App (Recommended)
1. Open the app in your browser
2. Click on your profile/user menu in the navbar
3. Click "Logout"
4. This will clear the JWT authentication cookie

### Option B: Manually Clear Browser Cookies
If you can't access the logout button or want to ensure a clean slate:

**Chrome/Edge:**
1. Open DevTools (F12 or Cmd+Option+I on Mac)
2. Go to the "Application" tab
3. In the left sidebar, expand "Cookies"
4. Click on your localhost URL (e.g., `http://localhost:3000`)
5. Find and delete the `auth-token` cookie
6. Refresh the page

**Firefox:**
1. Open DevTools (F12 or Cmd+Option+I on Mac)
2. Go to the "Storage" tab
3. Expand "Cookies" in the left sidebar
4. Click on your localhost URL
5. Find and delete the `auth-token` cookie
6. Refresh the page

**Safari:**
1. Open Web Inspector (Cmd+Option+I)
2. Go to the "Storage" tab
3. Click "Cookies" in the left sidebar
4. Select your localhost URL
5. Find and delete the `auth-token` cookie
6. Refresh the page

---

## Step 2: Clear the MongoDB Database

The database clearing script will remove all data from your development database, including:
- All users
- All listings
- All conversations
- All messages

### Run the Clear Database Script

```bash
npm run clear-db
```

### What to Expect

The script will:
1. Show you the current environment and MongoDB URI
2. Display a warning about data deletion
3. Ask for confirmation (type `yes` to continue)
4. Show the current database state (document counts)
5. Clear all collections
6. Verify the deletion was successful
7. Display next steps

### Example Output

```
⚠️  DATABASE CLEARING SCRIPT
================================
Environment: development
MongoDB URI: mongodb+srv://...

⚠️  WARNING: This will DELETE ALL DATA from the database!
This includes:
  - All users
  - All listings
  - All conversations
  - All messages

Are you sure you want to continue? (yes/no): yes

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Current database state:
   - Users: 3
   - Listings: 8
   - Conversations: 1
   - Messages: 2

🗑️  Clearing database...
   ✓ Cleared Users collection
   ✓ Cleared Listings collection
   ✓ Cleared Conversations collection
   ✓ Cleared Messages collection

📊 Database state after clearing:
   - Users: 0
   - Listings: 0
   - Conversations: 0
   - Messages: 0

✅ Database cleared successfully!

📝 Next steps:
   1. Clear your browser cookies/logout from the app
   2. Register a new account to test email verification
   3. Or run: npm run seed (to populate with test data)

🔌 Disconnected from MongoDB
```

---

## Step 3: Test Email Verification Flow

Now that your environment is clean, you can test the complete email verification flow:

### 1. Register a New Account
1. Navigate to `/register` in your browser
2. Fill in the registration form with a valid `@dartmouth.edu` email
3. Submit the form

### 2. Check for Verification Email
- Check your email inbox for the verification code
- The email should arrive within a few seconds
- Subject: "Verify Your DartSwap Account"

### 3. Verify Your Email
1. You'll be redirected to `/verify-email`
2. Enter the 6-digit verification code from your email
3. Click "Verify Email"

### 4. Access the App
- Once verified, you should be able to access all features
- Try creating a listing, browsing items, etc.

---

## Troubleshooting

### Database Won't Clear
- **Issue**: Script fails to connect to MongoDB
- **Solution**: Check that your `.env.local` file has the correct `MONGODB_URI`

### Still Logged In After Clearing Cookies
- **Issue**: Browser cache or session storage
- **Solution**: 
  - Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
  - Or open an incognito/private browsing window

### Verification Email Not Arriving
- **Issue**: Email service not configured or rate limiting
- **Solution**: 
  - Check your Brevo API key in `.env.local`
  - Wait 60 seconds between verification email requests (rate limit)
  - Check spam folder

### Want to Start with Test Data
- **Issue**: Empty database after clearing
- **Solution**: Run `npm run seed` to populate with test users and listings
  - Test accounts: `alice.johnson@dartmouth.edu`, `bob.smith@dartmouth.edu`, `charlie.brown@dartmouth.edu`
  - Password for all: `password123`
  - Note: Seeded users are NOT verified by default

---

## Quick Reset Commands

```bash
# Clear the database
npm run clear-db

# Populate with test data (optional)
npm run seed

# Start the development server
npm run dev
```

---

## Safety Features

The clear database script includes several safety features:
- ✅ Displays environment and MongoDB URI before proceeding
- ✅ Requires explicit "yes" confirmation
- ✅ Shows document counts before and after deletion
- ✅ Verifies all collections are empty after clearing
- ✅ Provides clear next steps

---

## Additional Notes

- The script only affects your **development database**
- Production databases should never be cleared using this script
- Always ensure you have backups of important data
- The script uses the same MongoDB connection as your app (from `.env.local`)

---

## Related Documentation

- [`EMAIL_VERIFICATION.md`](EMAIL_VERIFICATION.md) - Email verification feature documentation
- [`BREVO_SETUP_GUIDE.md`](BREVO_SETUP_GUIDE.md) - Email service setup
- [`scripts/clear-db.ts`](scripts/clear-db.ts) - Database clearing script source code
- [`scripts/seed.ts`](scripts/seed.ts) - Database seeding script source code

# Netlify Deployment Guide: DartSwap

This guide provides comprehensive instructions for deploying DartSwap to Netlify with a focus on managing separate **Development** and **Production** environments.

---

## Table of Contents

1. [Overview](#overview)
2. [Dev vs. Prod Environment Strategy](#dev-vs-prod-environment-strategy)
3. [Prerequisites](#prerequisites)
4. [MongoDB Setup: Dev vs. Prod](#mongodb-setup-dev-vs-prod)
5. [Netlify Deployment Steps](#netlify-deployment-steps)
6. [Environment Variables Configuration](#environment-variables-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

DartSwap is a Next.js application that can be deployed to Netlify as a serverless application. Netlify's Next.js Runtime automatically handles:
- Server-Side Rendering (SSR)
- API Routes as serverless functions
- Static asset optimization via CDN
- Automatic deployments from Git

**Key Benefits:**
- ✅ Free tier with generous limits
- ✅ Automatic HTTPS
- ✅ CDN-edge performance
- ✅ Zero-config Next.js support
- ✅ Preview deployments for branches

---

## Dev vs. Prod Environment Strategy

### Recommended Approach: Two Netlify Sites

Create **two separate Netlify sites** to maintain complete isolation between environments:

| Environment | Purpose | Git Branch | MongoDB Database | URL Example |
|-------------|---------|------------|------------------|-------------|
| **Development** | Testing, staging, QA | `develop` or `staging` | `dartswap-dev` | `dartswap-dev.netlify.app` |
| **Production** | Live user-facing app | `main` or `production` | `dartswap-prod` | `dartswap.netlify.app` |

### Why Separate Sites?

1. **Data Isolation**: Development testing won't affect production data
2. **Environment Variables**: Different MongoDB URIs, API keys, and secrets
3. **Testing Safety**: Test new features without risking production stability
4. **Independent Scaling**: Different rate limits and resource allocation
5. **Rollback Control**: Deploy to dev first, verify, then promote to prod

### Alternative: Branch Deploys (Single Site)

For smaller teams, you can use Netlify's branch deploy feature with a single site:
- **Production**: `main` branch → `dartswap.netlify.app`
- **Development**: `develop` branch → `develop--dartswap.netlify.app`

⚠️ **Limitation**: Both environments share the same environment variables, so you'll need to use different MongoDB databases within the same cluster or implement runtime environment detection.

---

## Prerequisites

Before deploying, ensure you have:

### 1. GitHub Repository
- Code pushed to GitHub
- Clear branch strategy (`main` for prod, `develop` for dev)

### 2. MongoDB Atlas Account
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free M0 cluster (sufficient for both dev and prod initially)

### 3. Brevo Email Account
- Sign up at [Brevo](https://www.brevo.com/) (formerly Sendinblue)
- Verify sender email address
- Get SMTP credentials

### 4. Netlify Account
- Sign up at [Netlify](https://www.netlify.com/)
- Connect your GitHub account

---

## MongoDB Setup: Dev vs. Prod

### Strategy 1: Separate Databases (Recommended)

Create **two databases** within the same MongoDB Atlas cluster:

#### Step-by-Step:

1. **Log in to MongoDB Atlas** → Select your cluster

2. **Create Development Database:**
   - Click "Browse Collections" → "Add My Own Data"
   - Database name: `dartswap-dev`
   - Collection name: `users` (others will be created automatically)

3. **Create Production Database:**
   - Repeat the process
   - Database name: `dartswap-prod`
   - Collection name: `users`

4. **Get Connection Strings:**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace the database name in the URI:

   **Development:**
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dartswap-dev?retryWrites=true&w=majority
   ```

   **Production:**
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dartswap-prod?retryWrites=true&w=majority
   ```

5. **Network Access:**
   - Go to "Network Access" → "Add IP Address"
   - Select "Allow Access from Anywhere" (`0.0.0.0/0`)
   - This is required for serverless platforms with dynamic IPs

### Strategy 2: Separate Clusters (Enterprise)

For larger organizations with strict compliance requirements:
- Create two separate MongoDB Atlas clusters
- Completely isolated infrastructure
- Different access controls and monitoring
- Higher cost but maximum security

---

## Netlify Deployment Steps

### Part A: Deploy Development Environment

#### 1. Create Development Site

1. Log in to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize access
4. Select your **`dartswap`** repository
5. Configure build settings:
   - **Branch to deploy:** `develop` (or your dev branch)
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Netlify should auto-detect the Next.js plugin**

#### 2. Configure Development Environment Variables

Go to **Site settings** → **Environment variables** → **Add a variable**

Add the following variables for **Development**:

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://...dartswap-dev?...` | Dev database |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | Unique for dev |
| `NODE_ENV` | `production` | Always use `production` for Netlify |
| `NEXT_PUBLIC_APP_URL` | `https://dartswap-dev.netlify.app` | Your dev site URL |
| `EMAIL_HOST` | `smtp-relay.brevo.com` | Brevo SMTP |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USER` | Your Brevo SMTP login | From Brevo dashboard |
| `EMAIL_PASS` | Your Brevo SMTP key | From Brevo dashboard |
| `EMAIL_FROM` | `dev-noreply@dartswap.com` | Verified sender (dev) |

#### 3. Deploy Development Site

1. Click **"Deploy site"**
2. Wait for build to complete (2-5 minutes)
3. Netlify will assign a URL like `random-name-123.netlify.app`
4. Rename it: **Site settings** → **Change site name** → `dartswap-dev`

#### 4. Test Development Deployment

- Visit `https://dartswap-dev.netlify.app`
- Register a test user
- Create a test listing
- Send a test message
- Check Netlify Function logs for any errors

---

### Part B: Deploy Production Environment

#### 1. Create Production Site

1. In Netlify, click **"Add new site"** again
2. Import the **same repository**
3. Configure build settings:
   - **Branch to deploy:** `main` (or your production branch)
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

#### 2. Configure Production Environment Variables

Add the following variables for **Production**:

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://...dartswap-prod?...` | **Prod database** |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | **Different from dev** |
| `NODE_ENV` | `production` | Always use `production` |
| `NEXT_PUBLIC_APP_URL` | `https://dartswap.netlify.app` | Your prod site URL |
| `EMAIL_HOST` | `smtp-relay.brevo.com` | Brevo SMTP |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USER` | Your Brevo SMTP login | Same as dev or separate |
| `EMAIL_PASS` | Your Brevo SMTP key | Same as dev or separate |
| `EMAIL_FROM` | `noreply@dartswap.com` | Verified sender (prod) |

⚠️ **Critical:** Ensure `JWT_SECRET` is **different** between dev and prod. This prevents JWT tokens from being valid across environments.

#### 3. Deploy Production Site

1. Click **"Deploy site"**
2. Wait for build to complete
3. Rename site: **Site settings** → **Change site name** → `dartswap`
4. Your production URL: `https://dartswap.netlify.app`

#### 4. Custom Domain (Optional)

To use a custom domain like `dartswap.com`:

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain: `dartswap.com`
4. Follow DNS configuration instructions
5. Netlify will automatically provision SSL certificate

---

## Environment Variables Configuration

### Complete Reference

Here's a complete breakdown of all environment variables:

#### `MONGODB_URI`
- **Purpose:** Connection string to MongoDB Atlas
- **Dev Example:** `mongodb+srv://user:pass@cluster.mongodb.net/dartswap-dev?retryWrites=true&w=majority`
- **Prod Example:** `mongodb+srv://user:pass@cluster.mongodb.net/dartswap-prod?retryWrites=true&w=majority`
- **Security:** Never commit to Git. Store in Netlify dashboard only.

#### `JWT_SECRET`
- **Purpose:** Secret key for signing authentication tokens
- **Generation:** Run `openssl rand -base64 32` in terminal
- **Dev Example:** `K8mN2pQ5rT9vW3xZ6bC4dF7gH0jL1mN4pQ8rT2vW5xZ9`
- **Prod Example:** `A1bC3dE5fG7hI9jK2lM4nO6pQ8rS0tU2vW4xY6zA8bC1` (different!)
- **Security:** Must be different between dev and prod. Never share or commit.

#### `NODE_ENV`
- **Purpose:** Tells Node.js the environment mode
- **Value:** Always set to `production` for Netlify deployments
- **Why:** Even for dev site, use `production` to enable Next.js optimizations

#### `NEXT_PUBLIC_APP_URL`
- **Purpose:** Base URL for the application (used in emails, redirects)
- **Dev Example:** `https://dartswap-dev.netlify.app`
- **Prod Example:** `https://dartswap.netlify.app` or `https://dartswap.com`
- **Note:** The `NEXT_PUBLIC_` prefix makes it available in browser code

#### Email Variables (`EMAIL_*`)
- **Purpose:** SMTP configuration for sending transactional emails
- **Provider:** Brevo (formerly Sendinblue)
- **Setup:** See [BREVO_SETUP_GUIDE.md](./BREVO_SETUP_GUIDE.md)
- **Dev vs Prod:** Can use same credentials or separate for better tracking

### How to Update Environment Variables

1. Go to Netlify dashboard
2. Select your site (dev or prod)
3. **Site settings** → **Environment variables**
4. Click **"Edit variables"**
5. Update values
6. Click **"Save"**
7. **Trigger a new deploy** for changes to take effect:
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Clear cache and deploy site"**

---

## Post-Deployment Verification

### Development Environment Checklist

After deploying to dev, verify:

- [ ] **Site loads:** Visit `https://dartswap-dev.netlify.app`
- [ ] **Database connection:** Register a test user
- [ ] **Authentication:** Log in and log out
- [ ] **API routes:** Create a test listing
- [ ] **Email delivery:** Send a message (triggers email notification)
- [ ] **Function logs:** Check Netlify dashboard → Functions → View logs
- [ ] **No errors:** Review build logs and function logs

### Production Environment Checklist

Before announcing production launch:

- [ ] **All dev tests pass:** Complete dev checklist above
- [ ] **Custom domain:** Configured and SSL active (if applicable)
- [ ] **Environment variables:** Double-check all values are correct
- [ ] **JWT_SECRET:** Confirmed different from dev
- [ ] **MongoDB:** Confirmed using `dartswap-prod` database
- [ ] **Email sender:** Using production sender address
- [ ] **Security headers:** Verify at [securityheaders.com](https://securityheaders.com)
- [ ] **Performance:** Test with Lighthouse or PageSpeed Insights
- [ ] **Mobile responsive:** Test on mobile devices
- [ ] **Error monitoring:** Set up Netlify notifications or external monitoring

---

## Troubleshooting

### Issue: Build Fails with "Module not found"

**Symptoms:**
```
Error: Cannot find module 'mongoose'
```

**Solution:**
1. Ensure `package.json` includes all dependencies
2. Delete `node_modules` and `package-lock.json` locally
3. Run `npm install` to regenerate
4. Commit and push changes
5. Trigger new deploy

---

### Issue: API Routes Return 500 Error

**Symptoms:**
- Frontend loads but API calls fail
- Function logs show database connection errors

**Solution:**
1. Check MongoDB Atlas network access allows `0.0.0.0/0`
2. Verify `MONGODB_URI` environment variable is correct
3. Check MongoDB Atlas cluster is running (not paused)
4. Review function logs in Netlify dashboard
5. Test connection string locally with `scripts/test-email.ts`

---

### Issue: "Cannot connect to MongoDB"

**Symptoms:**
```
MongooseServerSelectionError: Could not connect to any servers
```

**Solutions:**

1. **Check Network Access:**
   - MongoDB Atlas → Network Access
   - Ensure `0.0.0.0/0` is whitelisted
   - Serverless platforms use dynamic IPs

2. **Verify Connection String:**
   - Check for typos in `MONGODB_URI`
   - Ensure password doesn't contain special characters (URL encode if needed)
   - Confirm database name is correct (`dartswap-dev` or `dartswap-prod`)

3. **Check Cluster Status:**
   - MongoDB Atlas → Clusters
   - Ensure cluster is not paused (free tier pauses after inactivity)
   - Click "Resume" if paused

---

### Issue: Emails Not Sending

**Symptoms:**
- Messages sent but no email notifications received
- Function logs show email errors

**Solutions:**

1. **Verify Brevo Credentials:**
   - Check `EMAIL_USER` and `EMAIL_PASS` are correct
   - Test credentials with `scripts/test-email.ts` locally

2. **Check Sender Verification:**
   - Brevo dashboard → Senders
   - Ensure `EMAIL_FROM` address is verified
   - Verify domain if using custom domain

3. **Review Function Timeout:**
   - Netlify functions timeout after 10 seconds (free tier)
   - Check if email sending is taking too long
   - Consider upgrading Netlify plan if needed

4. **Check Spam Folder:**
   - Emails might be marked as spam
   - Add sender to contacts/whitelist

---

### Issue: Environment Variables Not Working

**Symptoms:**
- Variables are set but app doesn't see them
- `process.env.VARIABLE_NAME` returns `undefined`

**Solutions:**

1. **Trigger New Deploy:**
   - Environment variable changes require a new deploy
   - Netlify → Deploys → Trigger deploy → Clear cache and deploy site

2. **Check Variable Names:**
   - Ensure no typos in variable names
   - Variable names are case-sensitive

3. **Client vs Server:**
   - Client-side code can only access `NEXT_PUBLIC_*` variables
   - Server-side code (API routes) can access all variables
   - Never put secrets in `NEXT_PUBLIC_*` variables

---

### Issue: "Function invocation failed" Error

**Symptoms:**
- API routes return 502 or 504 errors
- Function logs show timeout or memory errors

**Solutions:**

1. **Check Function Logs:**
   - Netlify dashboard → Functions → Select function → View logs
   - Look for specific error messages

2. **Optimize Database Queries:**
   - Ensure indexes are created in MongoDB
   - Avoid loading too much data at once
   - Use pagination for large datasets

3. **Increase Function Timeout:**
   - Free tier: 10 seconds
   - Pro tier: 26 seconds
   - Upgrade plan if needed

---

### Issue: JWT Token Invalid After Deploy

**Symptoms:**
- Users logged out after deployment
- "Invalid token" errors

**Explanation:**
- This is expected if `JWT_SECRET` changed
- All existing tokens become invalid

**Solution:**
- Users need to log in again
- Communicate maintenance window to users
- Consider implementing refresh tokens for production

---

### Issue: Different Behavior Between Local and Netlify

**Common Causes:**

1. **Environment Variables:**
   - Local uses `.env.local`
   - Netlify uses dashboard variables
   - Ensure they match

2. **Node Version:**
   - Check Node version locally: `node -v`
   - Set in Netlify: Environment variables → `NODE_VERSION` → `18.x`

3. **Build Command:**
   - Ensure `npm run build` works locally
   - Check for build warnings

---

## Best Practices

### 1. Development Workflow

**Recommended Git Flow:**

```
feature/new-feature → develop → main
                         ↓         ↓
                    Dev Site   Prod Site
```

1. Create feature branch from `develop`
2. Develop and test locally
3. Merge to `develop` → Auto-deploys to dev site
4. Test on dev site
5. Merge `develop` to `main` → Auto-deploys to prod site

### 2. Database Management

**Seeding Development Database:**

```bash
# Update MONGODB_URI in .env.local to point to dev database
MONGODB_URI=mongodb+srv://...dartswap-dev?...

# Run seed script
npm run seed
```

**Never seed production database** with test data!

### 3. Environment Variable Security

- ✅ Store in Netlify dashboard only
- ✅ Use different `JWT_SECRET` for each environment
- ✅ Rotate secrets periodically
- ❌ Never commit `.env` files to Git
- ❌ Never share secrets in Slack/email
- ❌ Never use production credentials in development

### 4. Monitoring and Alerts

**Set up Netlify notifications:**
1. Site settings → Build & deploy → Deploy notifications
2. Add email or Slack webhook
3. Get notified of:
   - Failed builds
   - Successful deploys
   - Function errors

**External monitoring:**
- Use [UptimeRobot](https://uptimerobot.com/) for uptime monitoring
- Use [Sentry](https://sentry.io/) for error tracking
- Use [LogRocket](https://logrocket.com/) for session replay

### 5. Performance Optimization

**Enable Netlify Features:**
- ✅ Asset optimization (automatic)
- ✅ Image optimization (via Next.js Image component)
- ✅ Brotli compression (automatic)
- ✅ HTTP/2 Server Push (automatic)

**Next.js Optimizations:**
- Use `next/image` for images
- Implement ISR (Incremental Static Regeneration) where possible
- Lazy load components with `next/dynamic`
- Minimize client-side JavaScript

### 6. Backup Strategy

**MongoDB Backups:**
- Atlas M0 (free tier): No automatic backups
- Consider upgrading to M2+ for automated backups
- Manual backup: Use `mongodump` periodically

**Code Backups:**
- Git is your backup
- Ensure all code is committed and pushed
- Tag production releases: `git tag v1.0.0`

---

## Summary

You now have:
- ✅ Two separate Netlify sites (dev and prod)
- ✅ Isolated MongoDB databases
- ✅ Proper environment variable configuration
- ✅ Automated deployments from Git
- ✅ Troubleshooting knowledge

**Next Steps:**
1. Test thoroughly on development site
2. Deploy to production when ready
3. Set up monitoring and alerts
4. Document any custom configurations
5. Train team on deployment workflow

**Related Documentation:**
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - General deployment overview
- [BREVO_SETUP_GUIDE.md](./BREVO_SETUP_GUIDE.md) - Email configuration
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Application architecture

---

**Need Help?**
- Netlify Support: [support.netlify.com](https://support.netlify.com)
- MongoDB Atlas Support: [support.mongodb.com](https://support.mongodb.com)
- DartSwap Issues: Create an issue in the GitHub repository

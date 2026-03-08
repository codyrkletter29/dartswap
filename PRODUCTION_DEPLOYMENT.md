# Production Deployment Plan: DartSwap

This document outlines the comprehensive strategy for deploying the DartSwap application to production.

## 1. Architecture Decision

**Recommendation: Serverless Deployment on Netlify**

After analyzing the project structure (`app/` directory with API routes in `app/api/`) and verifying the codebase, the recommended approach is to deploy DartSwap as a **Serverless Next.js Application on Netlify**.

### Rationale
-   **Framework Design:** Next.js is designed to handle both frontend (React Server Components, Client Components) and backend (API Routes) in a unified environment.
-   **Cost & Performance:** Netlify offers a generous free tier and CDN-edge performance for static assets, which is ideal for this project.
-   **Verified Compatibility:** The codebase uses stateless authentication (`jose`/JWT) and database connection caching, making it fully compatible with serverless environments.

### Critical Requirement: "Fire-and-Forget" Mitigation
**Before deploying to Netlify, you MUST apply a code fix.**
Serverless functions may freeze immediately after returning a response. The current "fire-and-forget" email sending in `app/api/conversations/[id]/messages/route.ts` is unreliable in this environment. You must `await` the email sending promise to ensure it completes before the response is sent.

---

## 2. Prerequisites

Before deploying, ensure you have the following:

1.  **MongoDB Atlas Cluster (Database)**
    -   Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
    -   **Network Access:** Whitelist `0.0.0.0/0` (allow all IPs) since serverless platforms use dynamic IPs.
    -   **Connection String:** Get the URI: `mongodb+srv://<username>:<password>@cluster.mongodb.net/dartswap?retryWrites=true&w=majority`

2.  **Brevo (formerly Sendinblue) Account (Email)**
    -   Sign up at [Brevo](https://www.brevo.com/).
    -   Get SMTP credentials (Host, Port, Login, Password).
    -   Verify a sender email address.

3.  **GitHub Repository**
    -   Ensure your code is pushed to a GitHub repository.

---

## 3. Environment Variables

These variables must be set in your production environment (Netlify or Heroku).

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `MONGODB_URI` | Connection string for MongoDB Atlas | `mongodb+srv://user:pass@cluster...` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `openssl rand -base64 32` (generate one) |
| `NODE_ENV` | Environment mode | `production` |
| `NEXT_PUBLIC_APP_URL` | The public URL of your deployed app | `https://dartswap.netlify.app` |
| `EMAIL_HOST` | SMTP Host | `smtp-relay.brevo.com` |
| `EMAIL_PORT` | SMTP Port | `587` |
| `EMAIL_USER` | SMTP Login/Email | `your-email@example.com` |
| `EMAIL_PASS` | SMTP Password/Key | `xsmtpsib-...` |
| `EMAIL_FROM` | Verified Sender Email | `noreply@dartswap.com` |

---

## 4. Option A: Netlify Deployment (Recommended)

Netlify's "Next.js Runtime" automatically configures the environment to serve the Next.js app, including API routes, as serverless functions.

### Configuration Files
-   **`netlify.toml`**: (Optional but recommended)
    ```toml
    [build]
      command = "npm run build"
      publish = ".next"

    [[plugins]]
      package = "@netlify/plugin-nextjs"
    ```

### Step-by-Step Guide
1.  **Code Fix:** Ensure you have updated `app/api/conversations/[id]/messages/route.ts` to `await` the `sendMessageNotification` call.
2.  **Login to Netlify:** Go to [app.netlify.com](https://app.netlify.com).
3.  **Add New Site:** Click "Add new site" -> "Import an existing project".
4.  **Connect GitHub:** Select GitHub and authorize.
5.  **Pick Repository:** Choose `dartswap`.
6.  **Configure Build:**
    -   **Build command:** `npm run build`
    -   **Publish directory:** `.next`
    -   *Netlify should detect the Next.js plugin automatically.*
7.  **Add Environment Variables:**
    -   Click "Show advanced" or go to "Site settings" > "Environment variables" after creation.
    -   Add all variables listed in Section 3.
8.  **Deploy:** Click "Deploy site".

### Verification
-   Visit the deployed URL.
-   Register a new user to test database connection.
-   Check "Function logs" in Netlify if you encounter API errors.

---

## 5. Option B: Heroku Deployment (Alternative)

Heroku runs the application as a standard Node.js server. This is useful if you need background workers or WebSockets that require a persistent connection.

### Configuration Files
-   **`Procfile`**: Created in project root.
    ```
    web: npm start
    ```
-   **`package.json`**: Ensure `start` script is `next start`.

### Step-by-Step Guide
1.  **Install Heroku CLI:** `brew tap heroku/brew && brew install heroku`
2.  **Login:** `heroku login`
3.  **Create App:**
    ```bash
    heroku create dartswap-production
    ```
4.  **Set Environment Variables:**
    ```bash
    heroku config:set MONGODB_URI="your_mongodb_uri"
    heroku config:set JWT_SECRET="your_jwt_secret"
    heroku config:set NODE_ENV="production"
    heroku config:set NEXT_PUBLIC_APP_URL="https://dartswap-production.herokuapp.com"
    heroku config:set EMAIL_HOST="smtp-relay.brevo.com"
    heroku config:set EMAIL_PORT="587"
    heroku config:set EMAIL_USER="your_brevo_user"
    heroku config:set EMAIL_PASS="your_brevo_pass"
    heroku config:set EMAIL_FROM="your_verified_sender"
    ```
5.  **Deploy:**
    ```bash
    git push heroku main
    ```
6.  **Scale Dynos (Optional):** Ensure at least one web dyno is running:
    ```bash
    heroku ps:scale web=1
    ```

---

## 6. Post-Deployment Verification

After deployment, perform these checks to ensure production readiness:

1.  **Security Headers:**
    -   Security headers have been configured in `next.config.js`.
    -   Verify they are active by inspecting the network tab in your browser or using a tool like [securityheaders.com](https://securityheaders.com).
    -   Key headers to check: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`.

2.  **Database Connection:**
    -   Log in to MongoDB Atlas and check the "Connections" tab to see if your app is successfully connecting.

3.  **Email Delivery:**
    -   Trigger a password reset or welcome email (if implemented) to verify Brevo integration.

4.  **Functionality Test:**
    -   **Register:** Create a new user.
    -   **Login:** Log out and log back in.
    -   **Create Listing:** Post a new item.
    -   **Message:** Send a message to another user (requires two accounts).

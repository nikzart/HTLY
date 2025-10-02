# HTLY Deployment Guide - Vercel + Railway

This guide will walk you through deploying HTLY using Vercel (frontend) and Railway (backend).

## Prerequisites

- GitHub account
- Vercel account (free): https://vercel.com/signup
- Railway account (free $5/month): https://railway.app/
- Auth0 account with your application configured
- Azure OpenAI API key

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to https://railway.app/ and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your `HTLY` repository
5. Railway will detect it's a Python app

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a `DATABASE_URL` environment variable

### Step 3: Configure Environment Variables

In Railway, go to your backend service → Variables tab and add:

```
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
AUTH0_ALGORITHMS=RS256

AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=text-embedding-3-large

FLASK_ENV=production
ALLOWED_ORIGINS=https://your-app.vercel.app

# Railway auto-provides these:
# DATABASE_URL (automatically set)
# PORT (automatically set)
```

**Important:** Leave `ALLOWED_ORIGINS` as `*` initially, we'll update it after deploying the frontend.

### Step 4: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Once deployed, copy your Railway backend URL (e.g., `https://your-app.up.railway.app`)
3. Save this URL - you'll need it for the frontend

### Step 5: Update Auth0 Allowed Callback URLs

In your Auth0 dashboard:
1. Go to Applications → Your App → Settings
2. Add to "Allowed Callback URLs": `https://your-app.vercel.app/callback`
3. Add to "Allowed Logout URLs": `https://your-app.vercel.app`
4. Add to "Allowed Web Origins": `https://your-app.vercel.app`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Project

1. Go to https://vercel.com/ and sign in
2. Click "Add New..." → "Project"
3. Import your `HTLY` repository
4. Vercel will auto-detect it's a Vite app

### Step 2: Configure Build Settings

Vercel should auto-detect:
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
VITE_API_BASE=https://your-app.up.railway.app/api
```

**Replace `your-app.up.railway.app` with your actual Railway backend URL from Part 1.**

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Once deployed, copy your Vercel URL (e.g., `https://your-app.vercel.app`)

### Step 5: Update Backend CORS

1. Go back to Railway → Your backend service → Variables
2. Update `ALLOWED_ORIGINS` to your Vercel URL:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
3. Railway will automatically redeploy with the new setting

---

## Part 3: File Storage (Avatars)

**Important:** The current avatar upload stores files locally, which **won't work** on Railway (files are ephemeral).

### Option A: Use Cloudinary (Recommended)

1. Sign up at https://cloudinary.com (free tier available)
2. Get your Cloud Name, API Key, and API Secret
3. Add to Railway environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Update `app.py` to use Cloudinary for uploads (code modification needed)

### Option B: Use AWS S3

1. Create S3 bucket
2. Add AWS credentials to Railway
3. Update `app.py` to upload to S3 (code modification needed)

### Temporary Solution

For now, you can disable avatar uploads or use avatar URLs only (no file uploads).

---

## Part 4: Database Migration (SQLite → PostgreSQL)

Your current code uses SQLite, but Railway requires PostgreSQL for production.

### Quick Migration Steps:

1. **Backup your local data:**
   ```bash
   sqlite3 backend/htly.db .dump > backup.sql
   ```

2. **The database will auto-initialize** when your Railway app starts (it creates tables automatically in `database.py`)

3. **For future:** You'll need to create a migration script to transfer data from SQLite to PostgreSQL if you have important data

**Note:** The provided `database_postgres.py` file is a template for PostgreSQL support. Full migration requires updating all database queries from SQLite syntax to PostgreSQL syntax.

---

## Part 5: Testing Your Deployment

### Check Backend Health

Visit: `https://your-app.up.railway.app/api/health`

You should see: `{"status": "healthy"}`

### Check Frontend

1. Visit `https://your-app.vercel.app`
2. Try logging in with Auth0
3. Post a thought
4. Check if WebSocket connections work (real-time updates)

---

## Troubleshooting

### Backend won't start
- Check Railway logs: Project → Deployments → View Logs
- Verify all environment variables are set
- Check `DATABASE_URL` is automatically provided by Railway

### Frontend can't connect to backend
- Verify `VITE_API_BASE` points to your Railway URL
- Check Railway backend logs for CORS errors
- Ensure `ALLOWED_ORIGINS` in Railway matches your Vercel URL

### WebSocket not working
- Railway supports WebSockets by default
- Check browser console for connection errors
- Verify eventlet is installed (`pip install eventlet`)

### Auth0 login fails
- Check Auth0 dashboard callback URLs match your Vercel domain
- Verify Auth0 environment variables in both Vercel and Railway

### Database errors
- Check Railway logs for PostgreSQL connection errors
- Verify `DATABASE_URL` environment variable exists
- Check database.py is creating tables on startup

---

## Automatic Deployments

Both Vercel and Railway are configured for automatic deployments:

- **Push to `main` branch** → Both frontend and backend automatically redeploy
- **Environment variable changes** → Railway automatically restarts

---

## Costs

### Free Tier Limits:

**Vercel:**
- 100 GB bandwidth/month
- Unlimited personal projects
- Free SSL certificates

**Railway:**
- $5 free credit/month (~500 hours)
- ~$5-10/month after free tier
- PostgreSQL database included

**Total estimated cost:** $0-10/month depending on usage

---

## Security Checklist

- [ ] Update `ALLOWED_ORIGINS` to specific domain (not `*`)
- [ ] Keep `.env` files out of Git (already in `.gitignore`)
- [ ] Use Auth0 production tenant (not dev)
- [ ] Enable Auth0 MFA for admin accounts
- [ ] Regularly rotate API keys
- [ ] Monitor Railway/Vercel usage

---

## Next Steps

1. Set up custom domain (optional)
2. Configure file uploads (Cloudinary/S3)
3. Set up monitoring/error tracking (Sentry)
4. Configure database backups (Railway auto-backups PostgreSQL)
5. Add rate limiting for API endpoints
6. Set up CI/CD tests before deployment

---

## Support

For issues:
1. Check Railway logs
2. Check Vercel deployment logs
3. Check browser console for frontend errors
4. Review this deployment guide

**Congratulations! Your HTLY app is now live! 🎉**

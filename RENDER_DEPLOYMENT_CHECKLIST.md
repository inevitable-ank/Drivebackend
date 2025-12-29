# ✅ Render Deployment Checklist

Use this checklist to ensure you have everything ready before deploying to Render.

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code is committed to Git
- [ ] Code is pushed to GitHub repository
- [ ] `render.yaml` file exists in root directory
- [ ] `.nvmrc` file exists with Node.js version (18)
- [ ] `package.json` has correct `build` and `start` scripts

### 2. Database Setup
- [ ] Created PostgreSQL database on Render
- [ ] Copied Internal Database URL
- [ ] Database is in the same region as your web service

### 3. AWS S3 Setup (REQUIRED for Production)
- [ ] Created S3 bucket in AWS
- [ ] Created IAM user with S3 access
- [ ] Generated Access Key ID and Secret Access Key
- [ ] Copied AWS credentials securely
- [ ] Configured S3 bucket CORS (if needed for frontend access)

### 4. Google OAuth Configuration
- [ ] Updated Google OAuth redirect URI with Render URL
- [ ] Format: `https://your-app-name.onrender.com/api/auth/google/callback`
- [ ] Copied Google Client ID and Secret

### 5. Environment Variables Ready
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (from Render PostgreSQL)
- [ ] `SESSION_SECRET` (strong random string)
- [ ] `JWT_SECRET` (strong random string, different from SESSION_SECRET)
- [ ] `FRONTEND_URL` (your frontend domain)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_CALLBACK_URL` (with your Render URL)
- [ ] `STORAGE_TYPE=s3` (IMPORTANT: must be 's3' for production)
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION`
- [ ] `AWS_S3_BUCKET_NAME`

### 6. Render Service Configuration
- [ ] Created Web Service on Render
- [ ] Connected GitHub repository
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Start Command: `npm start`
- [ ] Set Health Check Path: `/health`
- [ ] Added all environment variables
- [ ] Connected PostgreSQL database

## Post-Deployment Verification

- [ ] Service builds successfully (check build logs)
- [ ] Service starts without errors (check runtime logs)
- [ ] Health endpoint works: `https://your-app.onrender.com/health`
- [ ] Database connection successful (check logs)
- [ ] Can upload files (tests S3 connection)
- [ ] Google OAuth login works
- [ ] API endpoints respond correctly

## Common Issues to Watch For

- ⚠️ **Files not persisting**: Ensure `STORAGE_TYPE=s3` is set
- ⚠️ **Database connection fails**: Use Internal Database URL, not External
- ⚠️ **OAuth redirect error**: Verify callback URL matches exactly in Google Console
- ⚠️ **Service keeps restarting**: Check all required env vars are set
- ⚠️ **Slow first request**: Normal on free tier (service spins down after 15 min)

## Quick Commands

### Generate Secure Secrets
```bash
# Linux/Mac
openssl rand -base64 32

# Or visit: https://randomkeygen.com/
```

### Test Health Endpoint
```bash
curl https://your-app-name.onrender.com/health
```

### Check Render Logs
- Go to Render Dashboard → Your Service → Logs

---

**Need Help?** Check the main README.md for detailed troubleshooting steps.


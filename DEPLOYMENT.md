# Deployment Guide - Momentum

This guide covers deploying **Momentum** to production environments.

---

## 📋 Pre-Deployment Checklist

- [ ] All tests pass locally
- [ ] Frontend builds without errors (`npm run build` in frontend/)
- [ ] Backend builds without errors (`npm run build` in backend/)
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Email service configured (EmailJS)
- [ ] Security review completed
- [ ] `.env` files are NOT committed (check `.gitignore`)

---

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Cluster

```bash
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up/Login
3. Create a new cluster (Free tier available)
4. Create a database user with password
5. Whitelist IP addresses (0.0.0.0/0 for any IP)
6. Get your connection string
```

### 2. Connection String Format

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/momentum?retryWrites=true&w=majority
```

---

## 🚀 Backend Deployment (Railway/Render)

### Option 1: Railway

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login & Initialize**
```bash
railway login
cd backend
railway init
```

3. **Set Environment Variables**
```bash
railway variables set PORT=5002
railway variables set MONGODB_URI="your-mongodb-connection-string"
railway variables set JWT_SECRET="your-production-jwt-secret"
railway variables set NODE_ENV=production
```

4. **Deploy**
```bash
railway up
```

### Option 2: Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: momentum-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

5. Add Environment Variables:
```
PORT=5002
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

---

## 🌐 Frontend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy from Frontend Directory

```bash
cd frontend
vercel
```

### 3. Configure Build Settings

When prompted or in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-backend-url.railway.app/api",
    "VITE_EMAILJS_SERVICE_ID": "your-service-id",
    "VITE_EMAILJS_TEMPLATE_ID": "your-template-id",
    "VITE_EMAILJS_PUBLIC_KEY": "your-public-key"
  }
}
```

### 4. Set Environment Variables in Vercel Dashboard

1. Go to Project Settings → Environment Variables
2. Add all `VITE_*` variables
3. Redeploy

### Alternative: Netlify

```bash
cd frontend
npm install -g netlify-cli
netlify deploy --prod
```

**Build settings:**
- Build command: `npm run build`
- Publish directory: `dist`

---

## 🔐 Security Best Practices

### 1. Environment Variables

**Never commit these:**
```bash
# ❌ DON'T DO THIS
git add .env
git commit -m "Add env file"  # NEVER!
```

**Always use:**
- `.env` in `.gitignore` ✅
- Platform-specific env variable managers (Railway Variables, Vercel Environment Variables)

### 2. JWT Secret

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Use this output as your `JWT_SECRET` in production.

### 3. CORS Configuration

Update backend CORS settings for production domains:

```typescript
// backend/src/app.ts
app.use(cors({
  origin: [
    'https://your-frontend-domain.vercel.app',
    'https://momentum.yourdomain.com'
  ],
  credentials: true
}));
```

### 4. Database Security

- Use strong passwords
- Enable IP whitelisting
- Regular backups
- Monitor access logs

---

## 🌍 Custom Domain Setup

### Frontend (Vercel)

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `momentum.yourdomain.com`)
3. Update DNS records as instructed
4. Enable automatic HTTPS

### Backend (Railway)

1. Go to Settings → Networking
2. Add custom domain
3. Update DNS `CNAME` record
4. Wait for SSL certificate provisioning

---

## 📊 Monitoring & Logs

### Backend Logs

**Railway:**
```bash
railway logs
```

**Render:**
- View logs in Dashboard → Logs tab

### Frontend Errors

Use browser console and Vercel Analytics:
```bash
vercel --logs
```

---

## 🔄 CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          cd frontend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🐛 Troubleshooting

### Backend Not Starting

1. Check environment variables are set correctly
2. Verify MongoDB connection string
3. Check logs: `railway logs` or Render dashboard
4. Ensure port is correct (Railway auto-assigns)

### Frontend API Errors

1. Verify `VITE_API_URL` points to deployed backend
2. Check CORS configuration in backend
3. Ensure backend is running
4. Check browser console for errors

### Database Connection Issues

1. Verify MongoDB Atlas IP whitelist
2. Check connection string format
3. Ensure database user has correct permissions
4. Test connection locally first

---

## 📈 Performance Optimization

### Frontend

1. **Enable Gzip Compression** (Vercel handles automatically)
2. **Image Optimization**: Use WebP format
3. **Code Splitting**: Already handled by Vite
4. **Caching**: Set cache headers

### Backend

1. **Database Indexing**: Add indexes to frequently queried fields
2. **Rate Limiting**: Implement API rate limiting
3. **CDN**: Use CDN for static assets
4. **Compression**: Enable gzip middleware

---

## 🎉 Post-Deployment

1. Test all features in production
2. Monitor error rates
3. Set up uptime monitoring (UptimeRobot, Pingdom)
4. Configure backups
5. Document deployment process
6. Share with team/users!

---

## 📞 Support

For deployment issues:
- Check [Railway Docs](https://docs.railway.app/)
- Check [Vercel Docs](https://vercel.com/docs)
- Check [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)

---

**Need help?** Contact: rishabh.292002@gmail.com

Good luck with your deployment! 🚀

# Vercel Deployment Guide - Momentum (Productivity Tracker)

## 🚀 Quick Deployment Steps

### 1️⃣ Deploy Backend First

1. **Install Vercel CLI** (if not already):
   ```bash
   npm install -g vercel
   ```

2. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   - Follow prompts to link/create project
   - Choose project name (e.g., `momentum-backend`)
   - Set root directory to `backend`

4. **Add Environment Variables** via Vercel Dashboard or CLI:
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add NODE_ENV
   ```

   **Required Environment Variables:**
   - `MONGODB_URI` - Your MongoDB connection string (e.g., from MongoDB Atlas)
   - `JWT_SECRET` - Secret key for JWT tokens (use a strong random string)
   - `NODE_ENV` - Set to `production`
   - `BLOB_READ_WRITE_TOKEN` - Get from Vercel Blob Storage setup (see below)
   - `PORT` - Not needed on Vercel (auto-configured)

5. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

6. **Copy your backend URL** (e.g., `https://momentum-backend.vercel.app`)

---

### 2️⃣ Deploy Frontend

1. **Navigate to frontend folder**:
   ```bash
   cd ../frontend
   ```

2. **Update frontend/vercel.json** - Replace `your-backend.vercel.app` with your actual backend URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://momentum-backend.vercel.app/api/:path*"
       }
     ]
   }
   ```

3. **Update frontend/src/config/env.ts** - Replace the placeholder:
   ```typescript
   export const env = {
     API_URL: import.meta.env.VITE_API_URL || 
              (import.meta.env.PROD ? 'https://momentum-backend.vercel.app/api' : 'http://localhost:5002/api')
   };
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   - Choose project name (e.g., `momentum-frontend`)
   - Set root directory to `frontend`

5. **Add Environment Variables** (optional for custom API URL):
   ```bash
   vercel env add VITE_API_URL
   ```
   Value: `https://momentum-backend.vercel.app/api`

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

7. **Your app is live!** 🎉
   Visit your frontend URL (e.g., `https://momentum-frontend.vercel.app`)

---

## 🔧 Alternative: Deploy via Vercel Dashboard

### Backend:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select `backend` folder as root directory
4. Add environment variables in "Environment Variables" section
5. Click "Deploy"

### Frontend:
1. Import the same repository again
2. Select `frontend` folder as root directory
3. Add `VITE_API_URL` environment variable
4. Click "Deploy"

---

## ⚠️ Important Notes

### Vercel Blob Storage Setup (REQUIRED for Avatar Uploads)
The app now uses Vercel Blob Storage for avatar uploads:

1. **Enable Blob Storage in Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to "Storage" tab
   - Click "Create Database" → Select "Blob"
   - Copy the `BLOB_READ_WRITE_TOKEN` from the connection details

2. **Add token to environment variables**:
   ```bash
   vercel env add BLOB_READ_WRITE_TOKEN
   ```
   Or add it via Vercel Dashboard → Settings → Environment Variables

### File Uploads Issue
✅ **SOLVED**: Avatar uploads now use **Vercel Blob Storage** (already implemented).

**What's configured:**
- Avatar uploads automatically save to Vercel Blob
- Old avatars are automatically deleted when new ones are uploaded
- No persistent file system needed

**You just need to:**
1. Enable Vercel Blob Storage in your project
2. Add `BLOB_READ_WRITE_TOKEN` to environment variables

~~Alternative solutions (not needed):~~
- ~~Cloudinary~~ 
- ~~Vercel Blob Storage~~ ✅ Already implemented
- ~~Disable uploads~~

### MongoDB Connection
- Use **MongoDB Atlas** (cloud) for production
- Get connection string from Atlas dashboard
- Whitelist Vercel IPs (or use `0.0.0.0/0` for testing)

### CORS Configuration
- Backend already has CORS enabled
- If you get CORS errors, update `backend/src/app.ts`:
  ```typescript
  app.use(cors({
    origin: ['https://momentum-frontend.vercel.app', 'http://localhost:5173'],
    credentials: true
  }));
  ```

---

## 🔄 Update Deployments

After making code changes:

```bash
# Backend
cd backend
git add .
git commit -m "Update backend"
git push origin main  # Vercel auto-deploys from GitHub

# Or manual deploy
vercel --prod

# Frontend
cd frontend
git add .
git commit -m "Update frontend"
git push origin main

# Or manual deploy
vercel --prod
```

---

## 🐛 Troubleshooting

### Backend not responding
- Check Vercel Function Logs in dashboard
- Verify MongoDB connection string
- Ensure all environment variables are set

### Frontend can't connect to backend
- Check browser console for CORS errors
- Verify backend URL in `frontend/vercel.json` and `frontend/src/config/env.ts`
- Test backend directly: `https://your-backend.vercel.app/api/auth/health`

### Database connection errors
- Verify MongoDB Atlas whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has read/write permissions

---

## 📝 Environment Variables Checklist

### Backend (Required):
- [x] `MONGODB_URI` - MongoDB connection string
- [x] `JWT_SECRET` - JWT secret key
- [x] `NODE_ENV` - Set to `production`
- [x] `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage token (get from Vercel dashboard)

### Frontend (Optional):
- [ ] `VITE_API_URL` - Override API URL

---

## 🎯 Next Steps

1. Deploy backend first, get URL
2. Enable Vercel Blob Storage and get token
3. Add all environment variables (including `BLOB_READ_WRITE_TOKEN`)
4. Update frontend config with backend URL
5. Deploy frontend
6. Test the full application (including avatar uploads!)
7. (Optional) Set up custom domain in Vercel dashboard

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)

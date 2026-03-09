# DevLog Deployment Guide

## Pre-Deployment Checklist

### ✅ Backend (FastAPI on Render)

- [x] CORS configured via environment variable
- [x] requirements.txt up to date
- [ ] **⚠️ DATABASE**: Currently uses flat-file JSON (`devlog_data.json`). This won't persist on Render's free tier.
  - **Solution**: Switch to PostgreSQL (Render provides one free with each app)
  - Or: Use a free tier solution like Firebase/Firestore
  - See: Database Migration section below

### ✅ Frontend (React + Vite on Netlify)

- [x] API URL uses environment variable (`VITE_API_URL`)
- [x] `.env` file for development (uses proxy)
- [x] `.env.production` template for production
- [x] Build command: `npm run build` ✓
- [x] Publish directory: `dist` ✓

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/devlog.git
git push -u origin main
```

### Step 2: Deploy Backend to Render

1. Go to [render.com](https://render.com)
2. Connect your GitHub repo
3. Create **New → Web Service**
   - **Name**: `devlog-backend`
   - **Branch**: `main`
   - **Root Directory**: `backend/`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**:
     ```
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```

4. Click **Advanced** and add Environment Variables:
   ```
   GROQ_API_KEY = your_groq_key_here
   CORS_ORIGINS = https://your-app.netlify.app
   ```
   (⚠️ Don't deploy yet! Update CORS_ORIGINS after you deploy frontend)

5. Click **Deploy**
6. Wait for build to complete → Copy your backend URL (e.g., `https://devlog-backend.onrender.com`)

### Step 3: Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repo
3. Create new site from Git
   - **Owner**: Your account
   - **Repository**: devlog
   - **Base directory**: `frontend/`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

4. Click **Site Settings → Build & Deploy → Environment**
5. Add Environment Variable:
   ```
   VITE_API_URL = https://devlog-backend.onrender.com
   ```
   (Replace with your actual Render backend URL from Step 2)

6. Click **Deploys → Trigger Deploy → Deploy Site**
7. Wait for build to complete → Your Netlify URL is in the Deploys tab

### Step 4: Update Backend CORS

1. Go back to Render dashboard
2. Select your `devlog-backend` web service
3. Go to **Environment → CORS_ORIGINS**
4. Update to:
   ```
   https://your-app.netlify.app
   ```
   (Use the actual Netlify URL from Step 3)
5. Manual Deploy to apply changes

---

## 📊 Database Migration (Important!)

Your current setup uses local JSON file storage which **won't persist** on Render. Choose one:

### Option 1: PostgreSQL (Recommended)
- Render gives you a free PostgreSQL database
- Update `requirements.txt`:
  ```
  sqlalchemy==2.0.0
  psycopg2-binary==2.9.0
  ```
- Update `main.py` to use SQLAlchemy with PostgreSQL
- Connection string from Render environment variables

### Option 2: Firebase/Firestore
- Free tier includes storage
- Add `firebase-admin` to requirements.txt
- Minimal code changes needed

### Option 3: Keep JSON (Not Recommended)
- Use Render's Persistent Disk ($7/month minimum)
- Data still not guaranteed between deploys

---

## 🔧 Environment Variables Summary

### Backend (.env on Render)
```
GROQ_API_KEY=your_key
CORS_ORIGINS=https://your-app.netlify.app
```

### Frontend (.env on Netlify)
```
VITE_API_URL=https://devlog-backend.onrender.com
```

---

## 📝 After Deployment

- [ ] Test homepage loads in Netlify URL
- [ ] Test adding a log entry (should hit backend API)
- [ ] Check browser DevTools → Network tab (should see `api.onrender.com` calls)
- [ ] Check Render dashboard for backend errors

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "ERR_CONNECTION_REFUSED" on frontend | Update `VITE_API_URL` in Netlify env vars + redeploy |
| CORS error in browser | Update `CORS_ORIGINS` in Render env + manual deploy |
| 502 Bad Gateway on Render | Check logs in Render dashboard → "Runtime logs" |
| Build fails on Netlify | Check build logs → usually missing env var |


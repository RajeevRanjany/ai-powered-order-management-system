# Deployment Guide

## Backend → Render

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create eyewear-oms --public --push
```

### 2. Create Render services
Go to [render.com](https://render.com) → New → Blueprint → connect your repo.
Render will read `render.yaml` and create both the web service and the PostgreSQL database automatically.

**Or manually:**

**New Web Service:**
- Environment: Node
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Plan: Free

**New PostgreSQL:**
- Name: `eyewear-oms-db`
- Plan: Free (1GB storage)

### 3. Set environment variables on Render
In the web service → Environment tab, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(auto-filled from Render DB → Internal URL)* |
| `GEMINI_API_KEY` | your Gemini API key |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | your Gmail app password |
| `ALERT_EMAIL_TO` | recipient email for alerts |

### 4. Run migrations on the Render DB
Once deployed, open the Render Shell (web service → Shell tab) and run:
```bash
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(fs.readFileSync('./database/schema.sql', 'utf8')).then(() => {
  console.log('Schema applied');
  return pool.query(fs.readFileSync('./database/seed.sql', 'utf8'));
}).then(() => { console.log('Seed applied'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
"
```

### 5. Verify
```
https://your-service.onrender.com/health
```
Expected: `{"status":"ok","ts":"..."}`

---

## Frontend → Vercel

### 1. Set the backend URL
Create `frontend/.env.production`:
```
VITE_API_URL=https://your-service.onrender.com/api
```

> Replace `your-service` with the actual Render service name shown after deploy.

### 2. Deploy to Vercel
```bash
cd frontend
npm install -g vercel   # if not already installed
vercel --prod
```

When prompted:
- Set up and deploy: **Y**
- Which scope: your account
- Link to existing project: **N**
- Project name: `eyewear-oms`
- Directory: `./` (you're already in frontend/)
- Override settings: **N** (vercel.json handles it)

### 3. Verify
Visit the Vercel URL → should load the dashboard with live data from Render.

---

## Post-deployment checklist

- [ ] `/health` returns 200 on Render URL
- [ ] Dashboard loads orders from Render DB
- [ ] New order → inventory check returns correct status
- [ ] `POST /api/alerts/trigger-scan` fires without error
- [ ] Alert email lands in `ALERT_EMAIL_TO` inbox
- [ ] `GET /alerts/explain/:id` returns Gemini text

---

## Free tier limits to know

| Service | Limit |
|---|---|
| Render Web (free) | Spins down after 15 min inactivity; first request takes ~30s |
| Render PostgreSQL (free) | Expires after 90 days — export and re-create before deadline |
| Gemini 1.5 Flash (free) | 15 RPM, 1M tokens/day — sufficient for demo scale |
| Vercel (free) | 100GB bandwidth/month, unlimited deployments |

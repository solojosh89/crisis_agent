# Deploying CrisisAgent + Hale AI

Two pieces: **backend → Render** (free) and **frontend → Vercel** (free).

---

## Step 0 — Push to GitHub

From `crisisagent/`:
```bash
git init
git add .
git commit -m "feat: CrisisAgent + Hale AI"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/crisisagent.git
git branch -M main
git push -u origin main
```
✅ `.gitignore` already excludes `.env` and `node_modules` — your secrets stay safe.

---

## Step 1 — Backend on Render

1. Go to https://render.com → **New → Web Service** → connect your GitHub repo.
2. Render auto-detects `render.yaml`. Confirm:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `node server.js`
3. Under **Environment**, add:
   - `GROQ_API_KEY` = your key
   - (optional) `AFRICAS_TALKING_API_KEY` = your key, or leave blank
4. Deploy. Copy the live URL, e.g. `https://crisisagent-backend.onrender.com`.

> Note: Render free tier sleeps after inactivity — the first request after idle takes ~30s. For a live demo, hit the URL once a minute before you present to keep it warm.

---

## Step 2 — Frontend on Vercel

1. Go to https://vercel.com → **Add New → Project** → import the same repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Create React App** (auto-detected).
4. Add Environment Variable:
   - `REACT_APP_API_URL` = your Render backend URL (from Step 1)
5. Deploy. You get a live URL like `https://crisisagent.vercel.app`.

---

## Step 3 — Verify

Open the Vercel URL on your phone:
- Set up a profile (genotype SS, an allergy, a contact)
- Run a Hale AI check → confirm grading + steps
- Trigger an Emergency → confirm hospitals/ambulance/contacts load

If the frontend can't reach the backend, double-check `REACT_APP_API_URL` has **no trailing slash** and matches the Render URL exactly.

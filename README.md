# 🚨 CrisisAgent + 💚 Hale AI

**An AI medical companion built for Nigeria — guidance before the crisis, coordination during it.**

> Built by a sickle cell patient who has lived the problem: knowing what to do, where to go, and who to call when a medical emergency hits in a country where 911 doesn't reliably answer.

---

## The Problem

In Nigeria, a medical emergency is a coordination nightmare:
- No single reliable emergency number; ambulance services differ by state
- Families don't know which hospital handles their condition, or what it costs upfront
- Patients with chronic conditions (sickle cell, diabetes, hypertension) often don't know when "manage at home" becomes "go to hospital now"
- Critical medical info (blood type, genotype, allergies, insurance) is scattered or forgotten in the panic

The result: avoidable deaths from delay and confusion.

## The Solution — Two AIs, One Companion

### 💚 Hale AI — *before* the crisis
A guidance assistant with **pre-built, evidence-based protocols** for 10 common Nigerian conditions:
Sickle Cell · Diabetes · Hypertension · Malaria · Asthma · Typhoid · Chest Pain · Stroke · Seizure · Peptic Ulcer.

You describe your symptoms and self-rate severity. Hale AI:
1. **Grades** the situation — MILD / MODERATE / SEVERE / CRITICAL
2. Gives **step-by-step home management** personalized to your profile (genotype, allergies, medications)
3. **Escalates to CrisisAgent automatically** when it detects danger

### 🚨 CrisisAgent — *during* the crisis
A full emergency coordinator that, in one tap:
- Recommends the **right hospital** for your condition (with NHIS/OHIS coverage + deposit estimate)
- Surfaces the **correct ambulance number** for your city
- Lists nearby **blood banks**
- Alerts your **emergency contacts** (SMS + tap-to-call)
- Tells you **exactly what to say at the hospital door** and what to bring

Covers **Lagos, Abuja, Ibadan, and Osun** with real hospital, blood bank, and ambulance data.

---

## Why It's Different
- **Safety-first AI** — protocols are hardcoded medical knowledge, not free-form generation. The model personalizes; it doesn't improvise the medicine. If the AI output ever fails to parse, the app **fails toward seeking care**, never a dead end.
- **Profile-aware** — your genotype (SS), blood type, allergies and medications flow into every recommendation. Allergic to Penicillin? Hale flags it.
- **Offline-friendly profile** — your medical data lives on your device (localStorage).
- **Honest by design** — clear medical disclaimer; SMS degrades gracefully when carrier setup is pending.

---

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React (Create React App), CSS custom properties, fully responsive |
| Backend | Node.js + Express |
| AI | Groq — `llama-3.3-70b-versatile` (free, fast) |
| SMS | Africa's Talking SDK (graceful fallback when unconfigured) |
| Storage | Browser localStorage (profile + health history) |

---

## Running Locally

### 1. Backend
```bash
cd backend
npm install
# create .env from .env.example and add your GROQ_API_KEY
node server.js          # → http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
# (optional) set REACT_APP_API_URL in .env to your deployed backend
npm start               # → http://localhost:3000
```

---

## Environment Variables

**backend/.env**
```
GROQ_API_KEY=your_groq_key_here
PORT=3001
# Optional — SMS alerts (app works fine without these)
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=your_at_key_here
```

**frontend/.env**
```
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## Roadmap
- Live SMS delivery (registered Africa's Talking sender ID)
- Real-time hospital availability via state health APIs
- Voice input for hands-free emergency use
- Expand to all 36 states + offline AI fallback
- Yoruba / Igbo / Hausa language support (profile field already exists)

---

## A Note from the Builder
This isn't a hypothetical. As a sickle cell patient in Nigeria, I've been the person in pain at 2am not knowing which hospital to go to. CrisisAgent is the tool I wished existed. If it saves one family the confusion I've lived through, it's done its job.

*CrisisAgent & Hale AI provide guidance only and are not a substitute for professional medical advice.*

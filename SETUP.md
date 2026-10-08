# Fihrist — fihrist.ai

AI-native programme management for cohort-based organizations.

## Project structure

```
fihrist/
├── public/
│   └── index.html       ← The entire frontend (one file)
├── data/                ← Auto-created on first run
│   ├── early-access.json
│   └── contacts.json
├── server.js            ← Express backend
├── package.json
├── .env.example         ← Copy to .env and fill in
└── .gitignore
```

## Local setup (5 minutes)

### 1. Install Node.js
Download from https://nodejs.org — choose the LTS version.

### 2. Install dependencies
```bash
cd fihrist
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in your email credentials (see below).

### 4. Run the server
```bash
npm start
```
Visit http://localhost:3000 — the site is live.

---

## Email setup (Gmail recommended)

The server sends two emails per form submission:
- A **notification** to you (founders) with all the details
- A **confirmation** to the person who submitted

### Gmail App Password setup
1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** if not already on
3. Go to **App passwords** (search for it in the security page)
4. Create a new app password — select "Mail" and "Other (custom name)" → type "Fihrist"
5. Copy the 16-character password into your `.env` as `EMAIL_PASS`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hello@fihrist.ai       # your Gmail address
EMAIL_PASS=xxxx xxxx xxxx xxxx    # the 16-char app password
NOTIFY_TO=hello@fihrist.ai        # where YOU want notifications
```

---

## Viewing submissions

All submissions are saved as JSON files in the `data/` folder.
You can also view them via the admin endpoint:

```
GET https://your-domain.com/api/admin/submissions?secret=YOUR_ADMIN_SECRET
```

Set `ADMIN_SECRET` in your `.env` to a long random string.

---

## Deploying to Railway (recommended — free tier available)

Railway is the easiest way to deploy a Node.js app with a real domain.

### Step 1 — Create a Railway account
Go to https://railway.app and sign up with GitHub.

### Step 2 — Push your code to GitHub
```bash
# In the fihrist/ folder:
git init
git add .
git commit -m "Initial commit"
# Create a repo at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/fihrist.git
git push -u origin main
```

### Step 3 — Deploy on Railway
1. Click **New Project** → **Deploy from GitHub repo**
2. Select your `fihrist` repository
3. Railway auto-detects Node.js and runs `npm start`

### Step 4 — Add environment variables
In Railway dashboard → your project → **Variables** tab:
Add each line from your `.env` file as a key-value pair.

### Step 5 — Add your custom domain
Railway dashboard → your project → **Settings** → **Domains**:
- Click **Add Custom Domain**
- Enter `fihrist.ai`
- Copy the CNAME record Railway gives you
- Go to your domain registrar (Namecheap, Porkbun, etc.)
- Add the CNAME record
- SSL is automatic (usually active within 10 minutes)

### Done — your site is live at fihrist.ai

---

## API reference

### POST /api/early-access
```json
{
  "name": "Sare Yilmaz",
  "email": "sare@esi.tuwien.ac.at",
  "organisation": "ESI i²c, TU Wien",
  "role": "Programme Coordinator",
  "programme_type": "university_incubator",
  "applicants_per_cycle": "200_500",
  "interested_tier": "growth",
  "pain_point": "We get 300 applications by email...",
  "source": "linkedin"
}
```
Returns `201` on success, `409` if email already exists, `400` on validation error.

### POST /api/contact
```json
{
  "name": "Alex Mueller",
  "email": "alex@foundation.org",
  "organisation": "Innovation Foundation",
  "subject": "demo",
  "message": "I'd love to see a demo..."
}
```
Returns `201` on success.

### GET /api/admin/submissions?secret=YOUR_ADMIN_SECRET
Returns all early access requests and contact messages as JSON.

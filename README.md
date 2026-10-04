# Woopclap – setup

## Study without an AI backend
The local subject/topic question bank, timed quizzes, saved progress, Mistake Book, dashboard, flashcards, calculator, study materials, analog clock, Study Room, and notes run in the browser using localStorage. The Academic Study Engine also includes a suggested Data Structures, DLD, and DBMS topic roadmap, level selection, local quiz/flashcard/notes paths, and original practice prompts. Roadmap coverage is not verified against a particular university syllabus; only topics with locally authored material or questions show those resources. It does not invent lecture-slide provenance or claim complete mock-exam answer coverage. These local features do not need Node.js, an API key, or an AI service. Open `quiz.html` directly or serve this folder with any static web server. When hosting the page separately, publish `quiz.html`, `app.js`, `question-bank.js`, `study-materials.js`, `academic-curriculum.js`, and `stylesheet.css` together.

## Subscription demo
The Free, Premium, Premium Plus, Premium Pro, and Premium Pro Max cards use local demo entitlements. Free includes up to 10 completed quizzes per day, one notebook, and up to 20 question bookmarks; Premium demo access removes those limits and unlocks additional study tools. Selecting a paid tier only stores demo feature access in this browser; no checkout, payment, or real subscription is performed. Before production, replace this client-only state with a server-created checkout session, verified payment-provider webhooks, and server-side entitlement checks. Never treat the local demo flag as proof of payment.

## Optional AI study tools
AI-generated notes, quizzes, and flashcards are an optional feature in the study space. To enable them locally:
1. Install Node.js 20.12 or newer: https://nodejs.org
2. Get an API key at https://console.anthropic.com (Settings > API keys).
3. Copy `.env.example` to a new file named `.env` and paste your key:
   ANTHROPIC_API_KEY=sk-ant-...
4. In this folder run:  node server.js
5. Open http://localhost:3000/

No `npm install` is needed (there are no dependencies).

## Deploy the optional AI-enabled version (Render.com example)
1. Upload this folder to a GitHub repository (the `.env` file is ignored, so your key stays private).
2. On render.com: New > Web Service > pick the repo.
   Build command: (leave empty)   Start command: node server.js
3. Under Environment, add ANTHROPIC_API_KEY with your key.
4. Deploy. Your site and its AI backend are now live at the Render URL.

Never put the API key in app.js or quiz.html. It must only live on the server.

## Accounts, payments, chat (new)
- `backend.js` adds signup/login (email code verification), optional Google sign-in, Gmail alerts to the owner, payment orders approved from the Admin dashboard, and the user chat (text, images, voice). Data is stored in `data/` (ignored by git); use a persistent disk when hosting.
- Copy `.env.example` to `.env` and fill in `SMTP_PASS` (Gmail App password) so emails are actually sent. Without it, emails are printed in the server console.
- Only verified accounts for `OWNER_EMAIL` and `FULL_ACCESS_EMAILS` get all plans; everyone else is Free until an order is approved. Plans last 30 days.
- Prices (PKR/month): Premium 300, Plus 550, Pro 1250, Pro Max 1500 - edit `PRICES` in `backend.js` and `subscriptionPlans` in `app.js`.

## Deployment (login + chat over the internet)
The login and chat need the Node backend (`server.js` + `backend.js`). GitHub Pages cannot run it.
**Recommended:** host the whole folder as one Render "Web Service" (start command `node server.js`). The site and API then share one URL, so cookies, CORS and `config.js` need no changes.
Set the variables from `.env.example` in Render > Environment, and add a Disk (mount e.g. `/var/data`, set `DATA_DIR=/var/data`) so users and messages survive restarts.
**Split hosting (frontend on GitHub Pages):** set `window.WOOP_API_BASE = "https://your-backend.onrender.com"` in `config.js`, and `FRONTEND_ORIGINS=https://yourname.github.io` on the backend. Note: some browsers (Safari, Brave) block third-party cookies, so login may not persist in split hosting.
Test: `GET /api/health` on your backend URL should return `{"ok":true,...}`.

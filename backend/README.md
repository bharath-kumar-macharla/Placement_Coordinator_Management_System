# PlacementAI — Backend API

Node.js (Express) backend powering deterministic eligibility evaluation, clash-free heuristic scheduling, and Google Gemini 2.5 AI automation.

---

## 1. Environment Configuration

Create `.env` in the `backend/` directory (see `.env.example`):

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port for the HTTP server |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `production`, `test`) |
| `SUPABASE_URL` | **Yes** | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | **Yes** | — | Supabase `service_role` key (bypasses RLS for backend) |
| `JWT_SECRET` | **Yes** | — | Minimum 16-character cryptographic secret |
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key from AI Studio |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `AI_CONFIDENCE_THRESHOLD` | No | `0.7` | Threshold below which items route to human coordinator |
| `CLIENT_URL` | No | `http://localhost:5173` | Comma-separated list of allowed origins for CORS |
| `SMTP_*` | No | — | Optional SMTP settings for Nodemailer email delivery |

---

## 2. Windows Local Development Setup

Run the following commands in PowerShell from the repository root:

```powershell
cd backend
npm install

# Run database migration in Supabase SQL editor: backend/sql/schema.sql

# Run unit tests (Eligibility & Conflict-Aware Scheduler)
npm run test

# Populate demo data (60 students, 6 companies, 4 drives with intentional clashes)
npm run seed

# Start server in dev mode with nodemon
npm run dev
```

API will be accessible at `http://localhost:5000/api` and health checks at `http://localhost:5000/health`.

---

## 3. Core API Endpoints

### Authentication & Users
- `POST /api/auth/register` — Student self-registration
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Current user profile

### Placement Drives
- `GET /api/drives` — List drives (with status and keyword filters)
- `POST /api/drives` — Create a new placement drive
- `POST /api/drives/extract-criteria` — Gemini AI criteria extraction from raw JD
- `PUT /api/drives/:id/criteria` — Save/edit confirmed criteria
- `POST /api/drives/:id/publish` — Publish drive to students
- `POST /api/drives/:id/eligibility/run` — Deterministic eligibility evaluation runner
- `GET /api/drives/:id/rounds` — List rounds for a drive
- `POST /api/drives/:id/rounds` — Add selection round

### Student Actions
- `GET /api/drives/eligible` — Drives eligible for current student
- `POST /api/drives/:id/apply` — Apply to drive
- `DELETE /api/drives/:id/apply` — Withdraw application
- `GET /api/applications/mine` — Student application history
- `GET /api/applications/:id/timeline` — Status event audit timeline

### AI & Assistant
- `POST /api/applications/:id/resume-feedback` — ATS score, bullet critique & missing keywords
- `POST /api/drives/:id/interview-prep` — Likely questions and 7-day study plan
- `POST /api/assistant/query` — Grounded status chatbot ("When is my next round?")

### Shortlisting & Scheduling
- `GET /api/drives/:id/shortlist` — Ranked candidate list by match score
- `POST /api/drives/:id/shortlist/approve` — Bulk approve / reject with coordinator override
- `POST /api/drives/:id/schedule/generate` — Generate conflict-free timetable preview
- `POST /api/drives/:id/schedule/confirm` — Save and publish confirmed schedule

### Reports & Admin
- `GET /api/reports/drive/:id` — Funnel statistics, average match, and AI narrative
- `GET /api/reports/drive/:id.csv` — CSV export
- `GET /api/reports/skill-gap` — Institutional aggregate missing skills
- `GET /api/admin/users` — User management
- `GET /api/admin/audit-logs` — Audit trail diffs

---

## 4. Deployment to Render

1. Create a **New Web Service** connected to your GitHub repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
3. Add Environment Variables in the Render dashboard:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `GEMINI_API_KEY`
   - `CLIENT_URL=https://your-frontend.vercel.app,http://localhost:5173`
4. Click **Create Web Service**.

> **Note on Render Free Tier**: Free web services sleep after 15 minutes of inactivity. Send a `GET /health` request 2-3 minutes before commencing the demo to ensure warm instances.

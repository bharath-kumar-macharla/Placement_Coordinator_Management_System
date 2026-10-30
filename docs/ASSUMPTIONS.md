# Assumptions

This document records design decisions made where the specification was ambiguous.

## Architecture
- No root `package.json` exists. Each folder (`frontend/`, `backend/`) is a fully independent project.
- Both folders can be moved into their own GitHub repositories without any changes.

## Auth
- JWT tokens are stored in `localStorage` on the frontend (noted as acceptable for hackathon scope in the README).
- Token expiry is 8 hours. No refresh-token mechanism is implemented (out of scope).
- `coordinator` and `admin` accounts are created via the seed script only; they cannot self-register.

## AI / Gemini
- `gemini-2.5-flash` is used as the default model (configurable via `GEMINI_MODEL` env var).
- If the Gemini API is unavailable or confidence < threshold, the item is flagged for coordinator review rather than blocking the user flow.
- Only the data needed for each individual student is sent per Gemini call — no bulk student PII batching.
- Retry logic: 2 retries with exponential back-off (1s, 2s). Timeout: 20s.

## Eligibility
- `mandatory_skills` in `drive_criteria` is the only skills field that hard-rejects students. `required_skills` and `preferred_skills` are soft signals that affect match score only.
- Deadline check uses UTC `now()` compared to `registration_deadline` stored as `timestamptz`.

## Scheduling
- Greedy algorithm: students with the most cross-drive conflicts are scheduled first (fewest-alternatives-first heuristic).
- Buffer between slots defaults to 15 minutes if not specified by the coordinator.
- Clash resolution keeps the slot with the higher `match_score`; the lower-priority slot is marked `rescheduled` with a note.

## Notifications
- In-app notifications are always written to the DB.
- Email (Nodemailer/SMTP) is optional: if `SMTP_HOST` is not set, email is silently skipped and logged.
- The deadline reminder cron runs every hour and is idempotent (tracks which reminders were sent in `applications.reminders_sent`).

## Reports
- "Time saved estimate" is calculated heuristically: 2 minutes per eligibility check + 5 minutes per shortlist decision that was AI-assisted.
- CSV export uses `json2csv` for simplicity.

## Database
- All UUID primary keys use `gen_random_uuid()`.
- An exclusive overlap check for `schedule_slots` is enforced in `schedulerService` (application-layer check) since Supabase's managed Postgres may not always support the `btree_gist` extension required for the `EXCLUDE USING GIST` constraint. A comment in `schema.sql` documents this.

## Seed
- Seed is idempotent: it checks for existing records by email/name before inserting.
- Demo password for all seed users: `Demo@1234`.

## Deployment
- Frontend deployed to Vercel; backend deployed to Render (free tier).
- Free-tier Render services sleep after inactivity; the README and demo script include a note to warm up `/health` before the demo.
- `vercel.json` rewrites all routes to `/` to support React Router.

## Frontend
- `recharts` is used for funnel and bar charts in the coordinator analytics page.
- The "Ask the assistant" widget is a simple chat panel; it does NOT maintain multi-turn history beyond the current session page reload.
- Mobile-first responsive layout using Tailwind CSS breakpoints.

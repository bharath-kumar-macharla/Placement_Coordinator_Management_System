# End-to-End Hackathon Demo Walkthrough

This script details the step-by-step verification of the 7 core demo capabilities required in Section 11.

---

## Demo Credentials (from Seed Script)
| Role | Email | Password |
|---|---|---|
| **Placement Coordinator** | `coordinator@demo.com` | `Demo@1234` |
| **Student (High Match)** | `student1@demo.com` | `Demo@1234` |
| **Student (Clash Candidate)** | `student2@demo.com` | `Demo@1234` |
| **Administrator** | `admin@demo.com` | `Demo@1234` |

---

## Step 1: AI Job Description Ingestion & Criteria Extraction
1. Login as `coordinator@demo.com`.
2. Click **"Create Drive with AI"** on the Dashboard or navigate to `/coordinator/drives/create`.
3. Choose a company (e.g. Acme Technologies) and click **"Paste Sample JD"** or paste any messy JD text.
4. Click **"Extract Criteria with AI"**.
5. **Observe**: Gemini extracts criteria with a visible **Confidence Badge** (e.g., `85% Confidence`) and flags ambiguities.
6. Review and edit the minimum CGPA, allowed branches, and skills.
7. Click **"Confirm Criteria & Publish"**.

---

## Step 2: Deterministic Eligibility Engine
1. From the Drive Manage page (`/coordinator/drives/:id/manage`), click **"Run Eligibility Engine"**.
2. **Observe**: The banner confirms evaluation results.
3. Filter by **"Eligible"** or **"Rejected"**.
4. Click **"View Reasons"** next to any student to inspect exact deterministic pass/fail reasons (e.g., `CGPA 6.8 is below the minimum 7.5` or `MECH branch not allowed`).

---

## Step 3: Student Experience, Match Score & Resume Feedback
1. Logout and login as `student1@demo.com`.
2. **Observe**: The Dashboard displays a personalized notification highlighting newly matched drives.
3. Click on the published drive.
4. **Observe**:
   - The interactive **ScoreRing** showing AI match percentage (e.g., `88% Match`).
   - Matched vs. Missing skill tags.
   - Click **"Generate Resume Feedback"** to see personalized ATS suggestions and rewritten bullet points.
   - Click **"Interview Preparation"** to view likely interview questions and a 7-day study plan.

---

## Step 4: Application & Shortlisting (Human-in-the-Loop)
1. As the student, click **"Apply for Drive"**.
2. Logout and log back in as `coordinator@demo.com`.
3. Open `/coordinator/drives/:id/shortlist`.
4. **Observe**: Applicants are ranked by AI match score with concise justifications.
5. Check candidate boxes or select all, then click **"Approve Selected"**.
6. (Optional) Click **"Override"** on any candidate to provide a manual rationale.

---

## Step 5: Conflict-Aware Scheduling & Clash Resolution
1. Navigate to `/coordinator/drives/:id/schedule`.
2. Configure rooms (`Lab 101, Lab 102`), start date, duration (30 mins), and buffer (15 mins).
3. Click **"Generate Conflict-Free Schedule Preview"**.
4. **Observe**:
   - The **"Clashes Caught"** and **"Clashes Resolved"** metric counters.
   - For candidates shortlisted across two overlapping drives, the priority heuristic keeps the higher match score and generates a visible note:
     > *"Candidate had overlapping slot with other drive; kept this drive due to higher match score; displaced slot marked rescheduled."*
5. Click **"Confirm & Publish Timetable"**.

---

## Step 6: Status Timeline & AI Placement Assistant
1. Switch back to `student1@demo.com`.
2. Go to **"Applications"** to view the live milestone timeline (`Applied → Shortlisted → Scheduled`).
3. Open **"Schedule"** to view room assignments and interview times.
4. Click the floating **AI Assistant** icon in the bottom right corner.
5. Type or click the quick prompt: **"When is my next round?"**
6. **Observe**: The assistant responds accurately using only the student's scheduled round data.

---

## Step 7: Reports, Institutional Analytics & CSV Export
1. Login as `coordinator@demo.com` and navigate to `/coordinator/reports`.
2. **Observe**:
   - Executive AI summary narrative for the drive.
   - Recharts-powered **Conversion Funnel** (`Eligible → Applied → Shortlisted → Selected`).
   - **Institutional Skill Gap** bar chart highlighting curriculum improvement opportunities across branches.
   - Time saved estimate (hours).
3. Click **"Export CSV"** to download the drive audit report.

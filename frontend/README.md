# PlacementAI — Frontend

Modern, mobile-responsive web interface for students, placement coordinators, and institutional administrators. Built with React 18, Vite, React Router v6, and Tailwind CSS.

---

## 1. Environment Variables

Create `.env` in the `frontend/` directory (see `.env.example`):

| Variable | Description | Local Example | Production Example |
|---|---|---|---|
| `VITE_API_URL` | Base URL for Backend REST API | `http://localhost:5000/api` | `https://your-backend.onrender.com/api` |

---

## 2. Windows Local Development Setup

Run the following commands in PowerShell from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

The application will launch on `http://localhost:5173`.

### Available Scripts
- `npm run dev`: Starts the local Vite development server with hot module replacement (HMR).
- `npm run build`: Type-checks and creates an optimized production bundle in `dist/`.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint across the codebase.

---

## 3. Deployment to Vercel

1. Push your code to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the Environment Variable:
   - `VITE_API_URL`: Your deployed backend API URL (e.g., `https://placement-coordinator.onrender.com/api`)
5. Click **Deploy**.

> Note: `frontend/vercel.json` contains route rewrites (`"destination": "/"`) to support client-side routing on hard refreshes.

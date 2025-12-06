# CareerCraft AI – Implementation Plan (FastAPI + React + MongoDB)

> Stack note: The Emergent environment is FastAPI (Python) + React (CRA, JS) + MongoDB. We mirror your Node/Express/Supabase design and endpoints, while keeping it fully runnable here.

---

## 1. High-Level Architecture

**Backend (FastAPI + MongoDB)**
- Single FastAPI app in `backend/server.py` (entrypoint used by supervisor).
- MongoDB via Motor (`AsyncIOMotorClient`) using `MONGO_URL` and `DB_NAME` from `.env`.
- Collections mirroring your Supabase tables:
  - `users` (auth + roles)
  - `resumes`
  - `jobs`
  - `matches`
  - `activities`
  - `email_logs`
  - `subscriptions`
- JWT-based auth (access + refresh) with roles: `user`, `employer`, `admin`.
- AI integration via **Google Gemini (latest)** using Emergent LLM key (`EMERGENT_LLM_KEY`) through `google-genai` client.
- SMTP email via environment variables (Gmail / SMTP settings), **never hard-coded**.
- All API routes under `/api` prefix.

**Frontend (React + Tailwind + Shadcn UI)**
- Uses existing CRA + Tailwind + Shadcn components.
- React Router 7; role-based route protection.
- Axios API client with `REACT_APP_BACKEND_URL` (no hardcoded URLs).
- React Query for data fetching/caching of dashboard & jobs.
- Framer Motion for transitions; Recharts for analytics cards.
- Strict `data-testid` on all interactive & key display elements.

---

## 2. Backend Design

### 2.1. Modules (all under `/app/backend`)

- `server.py`
  - Create `app` and `api_router` (prefix `/api`).
  - Configure CORS.
  - Initialize Mongo client and db.
  - Define/attach routers for auth, resume/AI, jobs, billing, emails (implemented directly in this file for simplicity but logically grouped by section comments).
- `ai_service.py`
  - `GeminiService` wrapper around `google.genai.Client`.
  - Methods:
    - `improve_resume(resume_text)` → improvement suggestions JSON.
    - `skill_gap(current_skills, target_role)` → skills gap JSON.
    - `job_insights(profile_text)` → recommended roles, markets.
    - `rewrite_resume(resume_text, tone)` → rewritten text.
    - `ats_score(resume_text, job_description)` → numeric score + explanation.
    - `cover_letter(resume_text, job_description, company_info)` → text.
    - `interview_questions(resume_text, job_description)` → JSON questions.
    - `match_jobs(resume_text, jobs)` → scored matches list.
- `auth_utils.py`
  - Password hashing via `passlib` / `bcrypt`.
  - JWT helpers: `create_access_token`, `create_refresh_token`, `decode_token`.
  - `get_current_user` dependency (reads `Authorization: Bearer` header, fetches user from DB, enforces active status, etc.).
- `email_utils.py`
  - Simple SMTP sender using `smtplib`.
  - Uses env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_TLS`.
  - Utilized for forgot-password and HR email logging.

### 2.2. Data Models (Mongo Collections)

#### users
- `id` (UUID string)
- `email` (unique)
- `password_hash`
- `role` (`user` | `employer` | `admin`)
- `created_at`
- `updated_at`

#### resumes
- `id`
- `user_id`
- `file_url` (local path or object key)
- `parsed_text`
- `rewritten_resume_text` (optional)
- `ats_score` (optional)
- `improvement_suggestions` (JSON)
- `skill_suggestions` (JSON)
- `created_at`

#### jobs
- `id`
- `employer_id`
- `title`
- `description`
- `requirements`
- `location`
- `salary`
- `created_at`

#### matches
- `id`
- `user_id`
- `job_id`
- `compatibility_score`
- `missing_keywords` (JSON)
- `cover_letter` (optional)
- `interview_questions` (JSON, optional)
- `status` (`saved` | `applied` | `interview` | `rejected` | `offer`)
- `created_at`

#### activities
- `id`
- `user_id`
- `type` ("resume_upload", "analysis_run", "job_match", etc.)
- `metadata` (JSON)
- `timestamp`

#### email_logs
- `id`
- `user_id`
- `job_id` (optional)
- `email_subject`
- `email_body`
- `received_at`

#### subscriptions (demo-only for now)
- `id`
- `user_id`
- `plan` (`free`, `pro`, etc.)
- `stripe_customer_id` (optional, placeholder)
- `stripe_subscription_id` (optional, placeholder)
- `status` (`inactive`, `active`, `trialing`)
- `created_at`

### 2.3. Auth & Security

**Endpoints** (all under `/api`):
- `POST /auth/signup`
  - Body: `{ email, password, role }`.
  - Creates user with hashed password.
  - Prevents duplicate email; whitelists roles (`user`, `employer`); `admin` only if a flag is later enabled.
- `POST /auth/login`
  - Body: `{ email, password }`.
  - Verifies password; returns `{ access_token, refresh_token, user }`.
- `POST /auth/refresh`
  - Body: `{ refresh_token }`.
  - Returns new access token.

**JWT**
- `JWT_SECRET` and `JWT_ALG` via env.
- Access token ~15m, refresh ~7d.
- Payload: `{ sub: user_id, role, exp }`.

**RLS-style protections**
- Per-request user via `get_current_user`.
- All collection queries filter by `user_id` (for user data) or `employer_id` (for employer jobs).
- Admin-only endpoints gated by `role == 'admin'`.

### 2.4. Core Feature Endpoints

All paths under `/api` prefix in FastAPI.

**Resume Upload & Parsing**
- `POST /upload`
  - Auth: user.
  - `multipart/form-data` with `file`.
  - Accepts PDF/DOCX/TXT.
  - Stores file to local `/app/backend/uploads/<user_id>/...`.
  - Extracts text (PyPDF2 / python-docx / plain text fallback).
  - Persists to `resumes` with `parsed_text`.
  - Adds `activities` entry.

- `POST /parseResume`
  - Optional if we want explicit parsing; for MVP, may just return parsed_text of latest resume for current user.

**AI Resume Intelligence** (via Gemini)
- `POST /improveResume`
  - Body: `{ resume_text }` or `{ resume_id }`.
  - Returns: strengths, weaknesses, suggestions, keyword recommendations.
  - Saves to `resumes.improvement_suggestions`.

- `POST /skillGap`
  - Body: `{ current_skills, target_role_description }`.
  - Returns skills gap JSON; can log to `activities`.

- `POST /jobInsights`
  - Body: `{ profile_summary or resume_text }`.
  - Returns recommended roles, industries, locations.

- `POST /rewriteResume`
  - Body: `{ resume_text, tone }`.
  - Returns rewritten resume text; optionally saves to `resumes.rewritten_resume_text`.

- `POST /atsScore`
  - Body: `{ resume_text, job_description }`.
  - Returns: numeric `score` + breakdown via AI.

**Job Matcher & Applications**
- `POST /jobs` (employer-only)
  - Creates job in `jobs`.

- `GET /jobs`
  - Lists jobs (optionally filtered by query params).

- `POST /matchJobs`
  - Auth: user.
  - Body: `{ resume_text? job_ids? }` (defaults: latest resume, all jobs).
  - Uses Gemini + simple keyword overlap to compute `compatibility_score`, `missing_keywords`.
  - Stores to `matches` and returns shortlist.

- `POST /coverLetter`
  - Body: `{ resume_text, job_id }` (load job from DB).
  - Calls Gemini; stores resulting text in `matches.cover_letter`.

- `POST /interviewQuestions`
  - Body: `{ resume_text, job_id }`.
  - Returns AI-generated questions & hints; store to `matches.interview_questions`.

- `POST /autoApply`
  - Marks `matches.status = 'applied'`, logs `activities`.
  - Optionally sends HR-style email using SMTP; logs to `email_logs`.

**Emails**
- `GET /emails`
  - Returns `email_logs` for current user.

**Billing (demo Stripe)**
- `POST /stripe/create-checkout-session` (**mocked/demo**)
  - Accepts `{ plan }`.
  - Returns fake `sessionId` & `url`.
  - Creates/updates `subscriptions` record with `status='active'` after simulated success.

- `POST /stripe/webhook` (**mocked/demo**)
  - Accepts JSON payload; logs it; updates `subscriptions` accordingly, but no real Stripe verification.

Logging & rate limiting will be handled centrally via middleware patterns similar to the playbook (but kept within `server.py` or small helpers for now).

---

## 3. Frontend Design

### 3.1. Routing & Layout

**React Router structure**
- `/` – Public Landing
- `/pricing` – Pricing page
- `/login` – Login
- `/signup` – Signup
- `/forgot-password` – Forgot password

**Authenticated (requires JWT)**
- `/app` – Redirects to role-specific dashboard
- `/app/user/*`
  - `/overview`
  - `/resume`
  - `/jobs`
  - `/cover-letters`
  - `/interview-prep`
  - `/emails`
  - `/billing`
- `/app/employer/*`
  - `/jobs`
  - `/matches`
- `/app/admin/*`
  - `/users`
  - `/jobs`
  - `/subscriptions`
  - `/logs`

**Layout components**
- `DashboardShell` (sidebar + topbar + content area)
- `Sidebar` with role-aware navigation (shadcn `NavigationMenu` / `Button`).
- `Topbar` with user avatar, notifications, theme toggle.

All interactive elements have `data-testid` attributes, e.g.:
- `data-testid="login-form-email-input"`
- `data-testid="sidebar-link-overview"`
- `data-testid="resume-upload-dropzone"`

### 3.2. State Management & Data Fetching

- **AuthContext**
  - Stores `user`, `accessToken`, `refreshToken`.
  - Handles login, signup, logout, token refresh.
  - Persists to `localStorage`.

- **React Query** (`@tanstack/react-query`)
  - Query client at root.
  - Used for:
    - Fetching `/jobs`.
    - Loading dashboard metrics (resume score, counts).
    - Listing `email_logs`, `matches`.

- **Axios API client**
  - `axios.create({ baseURL: process.env.REACT_APP_BACKEND_URL + '/api' })`.
  - Request interceptor attaches `Authorization: Bearer <accessToken>`.
  - Response interceptor handles 401/403, tries refresh token, logs out if necessary.

### 3.3. Key Screens & UX

**Landing Page**
- Premium layout (inspired by Vercel/Linear):
  - Hero with big headline + subheading + CTA buttons (Login, Get Started).
  - Feature grid: Resume Advisor, Skills Gap, Job Matcher, Auto Apply, Interview Coach, HR Tracker.
  - Animated gradient background, subtle parallax/Framer Motion.

**Auth Pages (Login / Signup / Forgot)**
- Centered card with shadcn `Card`, `Input`, `Button`.
- Shows validation errors via shadcn `Alert`.
- On success, redirects to appropriate dashboard.

**User Dashboard – Overview**
- KPI cards (Recharts):
  - Resume score
  - Applications count
  - Interviews count
  - Target job compatibility
- Activity timeline (list of `activities`).
- Loading skeletons (shadcn `Skeleton`).

**User Dashboard – Resume**
- Drag & drop upload (styled dropzone) + fallback file input.
- After upload:
  - Show parsed text preview.
  - Buttons to run:
    - "Improve Resume" (`/improveResume`)
    - "Analyze Skills Gap" (`/skillGap`)
    - "Job Availability Insights" (`/jobInsights`)
  - Results displayed in tabs / accordions with smooth animations.

**Job Matcher**
- Job list (from `/jobs`) with match scores.
- Clicking a job shows AI insights and actions:
  - "Generate Tailored Resume Suggestions" (from `/improveResume` / `/atsScore`).
  - "Save Job" (creates entry in `matches`).

**Cover Letter & Interview Prep**
- Simple panels that call `/coverLetter` and `/interviewQuestions`.
- Show generated text/questions in cards with copy-to-clipboard.

**Employer & Admin Dashboards**
- First iteration: functional but lighter UIs.
  - Employer: create jobs; view simple candidate matches (from `matches`).
  - Admin: tables of users, jobs, subscriptions (read-only or minimal edit).

**Billing (Demo)**
- Shows current plan from `/subscriptions`.
- "Upgrade" button triggers mocked `/stripe/create-checkout-session`.

### 3.4. Visual Style

- Use Tailwind + CSS variables already defined in `index.css` for light/dark.
- Avoid basic red/blue/green; use rich neutrals and accent (e.g. slate, zinc, amber/cyan).
- Modern buttons: pill/sharp with hover transitions (on background/border only, no `transition: all`).
- Responsive: sidebar collapses on mobile into a sheet/drawer.

---

## 4. External Integrations & Config

- **AI (Gemini)**: via `google-genai`, using `EMERGENT_LLM_KEY` from env; no user key required in code.
- **SMTP**: uses env vars for the Gmail/SMTP credentials the user configures in backend `.env` (we will not hard-code sensitive values).
- **Stripe**: endpoints exist but are **demo/mocked**; no real API keys needed initially.

---

## 5. Implementation Steps (Iteration 1)

1. **Backend**
   - Add `google-genai`, `PyPDF2`, `python-docx` to backend deps and freeze `requirements.txt`.
   - Implement `ai_service.py`, `auth_utils.py`, `email_utils.py`.
   - Expand `server.py` with:
     - Mongo collections setup.
     - Auth endpoints.
     - Resume upload + AI endpoints.
     - Job endpoints (CRUD minimal).
     - Match, cover letter, interview, autoApply.
     - Emails + subscriptions (demo billing) endpoints.

2. **Frontend**
   - Install `@tanstack/react-query`, `framer-motion`, `recharts` via yarn.
   - Replace `App.js` with full router, providers, and layout.
   - Implement public pages and auth forms.
   - Implement user dashboard core pages (Overview, Resume, Jobs, Cover Letter, Interview Prep, Emails, Billing) with real API calls for the most critical flows (auth, resume upload, improveResume, skillGap, jobInsights, jobs, coverLetter, interviewQuestions).
   - Employer/Admin dashboards as basic but working tables.

3. **Quality**
   - Ensure all interactive/critical elements have `data-testid`.
   - Run ESLint (`mcp_lint_javascript`) and Ruff (`mcp_lint_python`).
   - Quick manual API tests via curl or small Python snippets.
   - Use `esbuild` bundle check to catch JSX/JS errors before UI testing.

4. **Testing & Review**
   - Call `testing_agent_v3` for end-to-end testing of auth + core user flows.
   - Fix all issues returned.

This plan focuses on delivering a **complete, working MVP** with real AI resume intelligence, role-based dashboards, demo billing, and premium SaaS UI, within the constraints of the current environment.

# Data Science Chapter Tracker

A web-based system for tracking attendance, participation, GitHub contributions, and member engagement in the Data Science Chapter at UCU.

## Features

- **Auth** — signup (admin-approved, full profile + GitHub link at registration), login, forgot/reset password (email)
- **Dashboards** — members get personal stats (progress ring, GitHub activity heatmap, leaderboard top 5); admins get a unique oversight dashboard (chapter health, approvals, attendance, tier distribution, activity pulse, shortcuts)
- **Profile** — member details, clickable GitHub profile link, bio, stats refresh
- **Progress** — points + attendance + GitHub score → 6 tiers (Rookie → Diamond); admins see "Chapter Member Progress" with expandable per-member detail
- **GitHub Projects** — unified per-member view merging GitHub repositories (stars, forks, language, last push) with club project assignments; reviewers comment on projects
- **Attendance** — per-meeting records, bulk record, personal stats; admins/leaders see all members' records
- **Leaderboard** — ranked members with tier badges
- **Announcements** — admin-only posts, fan-out email + in-app notifications
- **Articles** — members upload drafts → submit for review → admin/leader approves/rejects with feedback → published feed; admin cannot create articles
- **Resources** — links + file uploads (datasets, tutorials)
- **Events** — workshops, hackathons, socials (separate from meetings)
- **Settings** — profile, password, GitHub link, notification prefs, theme; admins get System Settings (tier thresholds, scoring weights)
- **GitHub integration** — full-year contribution calendar (GraphQL), repos/commits/PRs/issues/stars/streak, nightly auto-refresh at 03:00 (configurable)
- **Notifications** — in-app + email (Gmail SMTP)

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5, MySQL (mysql2 pool), JWT, bcrypt, nodemailer, multer |
| Frontend | React 19, Vite 8, Tailwind CSS v4, react-router-dom, lucide-react |
| Database | MySQL (`ds_chapter_tracker`) |
| Testing | Jest (point service + badge rules) |

## Project Structure

```
Club-System-Platform/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── controllers/          # Route handlers
│   ├── middleware/           # auth, role, error handler
│   ├── models/               # SQL queries
│   ├── routes/               # Express routers
│   ├── services/             # github (GraphQL + REST, nightly scheduler), email, notification, points, badges
│   ├── tests/                # Jest tests with mocked db
│   ├── uploads/              # File uploads (static)
│   └── server.js             # Entry point
├── frontend/
│   └── src/
│       ├── components/       # Sidebar, Topbar, ProtectedRoute, Spinner, GitHubHeatmap
│       ├── context/          # AuthContext, ThemeContext
│       ├── hooks/            # useSidebarCounts
│       ├── layouts/          # AppLayout
│       ├── lib/              # api.js wrapper
│       └── pages/            # All route views
├── database/
│   ├── schema.sql            # All tables + indexes
│   └── seed.sql              # Roles, committees, badges, settings, admin
└── README.md
```

## Setup

### 1. Database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Configure `backend/.env`:

```
DB_HOST=localhost
DB_USER=<your_mysql_user>
DB_PASSWORD=<your_mysql_password>
DB_NAME=ds_chapter_tracker
JWT_SECRET=<your_secret>
GITHUB_TOKEN=<optional_github_pat>
GITHUB_REFRESH_HOUR=3              # optional, nightly refresh hour (default 03:00)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_gmail>
SMTP_PASS=<your_app_password>
SMTP_FROM=<from_email>
FRONTEND_URL=http://localhost:5173
```

> **GitHub token:** optional but recommended. A single server-side token (fine-grained PAT, public-repo read access is enough) unlocks the full-year contribution calendar and 5000 req/hr rate limits for *all* members — no per-member tokens needed. Without it, stats fall back to ~90 days of event history.

Start:

```bash
npm run dev   # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Vite proxies `/api` and `/uploads` to the backend on port 5000.

## Default Admin

- Email: `admin@dschapter.org`
- Password: `Admin@1234` — change after first login.

## API Overview

All endpoints under `/api`:

| Group | Key endpoints |
|---|---|
| `/auth` | register (full profile + GitHub link), login, forgot-password, reset-password |
| `/admin` | pending, approve, reject, members/:id/role (Admin only), DELETE members/:id (remove member + guarded reassignment) |
| `/admin/members-overview` | aggregated per-member stats (Admin) |
| `/members` | list, me, update (validates GitHub link/handle), change-password |
| `/committees` | list (any member), create (Admin); members assigned via `/members/:id` `committee_id` (Admin) |
| `/meetings` | CRUD + upcoming |
| `/attendance` | record, bulk, by-meeting, by-member, stats, all (Admin/Leader) |
| `/participation` | types, record, by-meeting, points |
| `/events` | CRUD + upcoming + register/unregister |
| `/projects` | CRUD + members + comments + overview-by-member |
| `/announcements` | CRUD + recent (Admin write) |
| `/resources` | CRUD (file upload) |
| `/articles` | upload/submit drafts (Member/Leader), review queue (Admin/Leader), like/comment |
| `/github` | stats, activity, repositories, refresh (me + member) |
| `/leaderboard` | all, my-progress, my-dashboard, admin/dashboard, member/:id/progress |
| `/system-settings` | tier thresholds + weights (Admin read/write) |
| `/sidebar-counts` | per-section badge counts |
| `/notifications` | list, unread, mark-read |

## Roles

| Capability | Admin | Leader | Member |
|---|---|---|---|
| Approve/reject signups | ✅ | — | — |
| Promote/demote Leaders | ✅ | — | — |
| System settings (tiers, weights) | ✅ | — | — |
| Chapter analytics + semester reports | ✅ | — | — |
| Meetings / events / attendance / resources | ✅ | ✅ | — |
| Review articles (approve/reject) | ✅ | ✅ | — |
| Comment on member projects | ✅ | ✅ | — |
| Refresh a member's GitHub stats | ✅ | ✅ | — |
| Create projects | — | ✅ | ✅ |
| Create articles | — | ✅ | ✅ |
| Earn points / badges / leaderboard rank | — | ✅ | ✅ |
| GitHub stats tracked | — | ✅ | ✅ |

**Design principle:** every signup registers as **Member** (pending admin approval). The admin promotes trusted members to Leader via Chapter Members → Role dropdown. The **admin account is neutral** — it cannot create projects/articles, earn points or badges, link GitHub, or appear on the leaderboard; it exists to oversee, review (with comments/feedback), and manage.

## Status

- Backend: complete — 5-pillar point system, 10 badges, 6 tiers, GitHub GraphQL integration, role management, project comments, article review
- Frontend: complete — member dashboard + unique admin dashboard, chapter member progress, unified GitHub Projects view, article review queue, analytics, semester reports
- Testing: 21 Jest tests covering point awards (attendance, streaks, projects, GitHub top-up, articles) and badge rules
- Next: end-to-end tests, notification preferences polish

## Testing

Backend tests use Jest with a mocked database layer:

```bash
cd backend
npm install          # dev dependencies include jest + supertest
npm test
```

The test suite covers the point service (attendance, streak, project, GitHub top-up, article awards, admin neutrality) and badge rules.

## Security Notes

- `backend/.env` contains live credentials (DB password, JWT secret, GitHub PAT) — never commit it; it is gitignored
- The GitHub PAT is fine-grained with public-repo read access — regenerate it if it leaks and update `backend/.env`
- All role-restricted endpoints are enforced server-side (`requireRole` middleware), not just hidden in the UI
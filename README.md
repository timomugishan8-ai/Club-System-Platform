# Data Science Chapter Tracker

A web-based system for tracking attendance, participation, GitHub contributions, and member engagement in the Data Science Chapter at UCU.

## Features

- **Auth** — signup (admin-approved), login, forgot/reset password (email)
- **Dashboard** — hero banner, stat cards, progress ring, GitHub activity, leaderboard top 5, upcoming events, announcements, badges
- **Profile** — member details, GitHub handle, bio
- **Progress** — points + attendance + GitHub score → Bronze/Silver/Gold tiers
- **Projects** — CRUD, repo links, project members
- **Attendance** — per-meeting records, bulk record, personal stats
- **Leaderboard** — ranked members with tier badges
- **Announcements** — admin-only posts, fan-out email + in-app notifications
- **Resources** — links + file uploads (datasets, tutorials)
- **Events** — workshops, hackathons, socials (separate from meetings)
- **Settings** — profile, password, GitHub handle, notification prefs, theme, logout
- **GitHub integration** — tracks repos, commits, PRs, issues, stars, streak (any public repo)
- **Notifications** — in-app + email (Gmail SMTP)

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5, MySQL (mysql2 pool), JWT, bcrypt, nodemailer, multer |
| Frontend | React 19, Vite 8, Tailwind CSS v4, react-router-dom, lucide-react |
| Database | MySQL (`ds_chapter_tracker`) |

## Project Structure

```
Club-System-Platform/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── controllers/          # Route handlers
│   ├── middleware/           # auth, role, error handler
│   ├── models/               # SQL queries
│   ├── routes/               # Express routers
│   ├── services/             # github, email, notification
│   ├── uploads/              # File uploads (static)
│   └── server.js             # Entry point
├── frontend/
│   └── src/
│       ├── components/        # Sidebar, Topbar, ProtectedRoute, Spinner
│       ├── context/          # AuthContext
│       ├── layouts/          # AppLayout
│       ├── lib/             # api.js wrapper
│       └── pages/           # All route views
├── database/
│   ├── schema.sql           # All tables + indexes
│   └── seed.sql             # Roles, committees, badges, admin
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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_gmail>
SMTP_PASS=<your_app_password>
SMTP_FROM=<from_email>
FRONTEND_URL=http://localhost:5173
```

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
| `/auth` | register, login, forgot-password, reset-password |
| `/admin` | pending, approve, reject (Admin only) |
| `/members` | list, me, update, change-password |
| `/meetings` | CRUD + upcoming |
| `/attendance` | record, bulk, by-meeting, by-member, stats |
| `/participation` | types, record, by-meeting, points |
| `/events` | CRUD + upcoming + register/unregister |
| `/projects` | CRUD + members |
| `/announcements` | CRUD + recent (Admin write) |
| `/resources` | CRUD (file upload) |
| `/github` | stats, activity, refresh |
| `/leaderboard` | all, my-progress, my-dashboard |
| `/notifications` | list, unread, mark-read |

## Roles

- **Admin** — full access, approves signups, posts announcements
- **Leader** — manages meetings/events/attendance/resources
- **Member** — personal tracking, projects

## Status

- Backend: complete (badges + points + leaderboard engine implemented — 5-pillar point system, 10 flat badges, 6 leaderboard tiers)
- Frontend: scaffold complete with all pages (badge + pillar UI integration pending)
- Next: frontend badge display, pillar breakdown charts, admin pending-members page, testing
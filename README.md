# 🚀 NerdLab Learning Platform

A production-ready web application where students complete hands-on DevOps practical exercises across Git, Docker, Kubernetes, and Terraform — with an admin dashboard, leaderboard, progress tracking, and JWT-secured authentication.

> **Stack**: React + Vite + TailwindCSS · Node.js + Express · PostgreSQL · JWT Auth

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Local Development Setup](#local-development-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Default Credentials](#default-credentials)
8. [Production Deployment (GCP)](#production-deployment-gcp)
9. [Deployment with Docker](#deployment-with-docker)
10. [API Reference](#api-reference)
11. [Admin Guide](#admin-guide)
12. [Security Checklist](#security-checklist)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Ensure the following are installed on the host machine before deployment:

| Tool | Minimum Version | Install Guide |
|------|----------------|--------------|
| Node.js | 20.x LTS | https://nodejs.org |
| npm | 10.x | Bundled with Node.js |
| PostgreSQL | 15.x | https://www.postgresql.org/download |
| Git | 2.40+ | https://git-scm.com |
| (Optional) Docker | 24.x | https://docs.docker.com/get-docker |
| (Optional) gcloud CLI | Latest | https://cloud.google.com/sdk/docs/install |

---

## Project Structure

```
project1/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, TaskCard, etc.)
│   │   ├── context/            # Auth context (AuthProvider, useAuth)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Route pages
│   │   │   ├── admin/          # AdminDashboard, AdminStudents, AdminTaskUpload, AdminActivityLogs
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   └── TaskView.jsx
│   │   ├── services/           # Axios API wrappers (authService, taskService, adminService)
│   │   ├── App.jsx             # Routes + ProtectedRoute
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                     # Express backend
│   ├── config/
│   │   └── db.js               # PostgreSQL pool (pg)
│   ├── controllers/            # Route handlers (authController, taskController, etc.)
│   ├── db/
│   │   ├── schema.sql          # Full DDL — 13 normalized tables
│   │   ├── seed.sql            # SQL seed data
│   │   ├── migrate.js          # Schema runner script
│   │   └── seed.js             # Programmatic seed (bcrypt hashing)
│   ├── middlewares/            # JWT auth, RBAC, rate-limiting, validation
│   ├── models/                 # Data-access layer (userModel, taskModel, progressModel, etc.)
│   ├── routes/                 # Express routers (auth, tasks, progress, admin, logs)
│   ├── services/               # Business logic services
│   ├── tasks/                  # Static HTML task files served by Express
│   │   ├── git/task1.html
│   │   ├── docker/task1.html
│   │   ├── kubernetes/task1.html
│   │   └── terraform/task1.html
│   ├── utils/                  # Helpers (jwt, response formatters)
│   ├── validators/             # express-validator schemas
│   ├── server.js               # App entry point
│   └── package.json
│
├── .env.example                # Environment variable template
├── .gitignore
├── package.json                # Root orchestration scripts
└── README.md
```

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd project1
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Return to root
cd ..
```

### 3. Configure environment variables

```bash
# Copy the example env file
cp .env.example server/.env
```

Then edit `server/.env` with your actual values (see [Environment Variables](#environment-variables) below).

---

## Environment Variables

Create `server/.env` based on `.env.example`:

```env
# ── Server ──────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ── PostgreSQL ───────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=devops_platform
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# ── JWT ──────────────────────────────────────────────────
JWT_SECRET=change_this_to_a_long_random_256bit_secret_in_production
JWT_EXPIRES_IN=7d
JWT_RESET_SECRET=change_this_reset_secret_in_production

# ── Security and CORS ────────────────────────────────────
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

> **Never commit `server/.env` to version control.** The `.gitignore` already excludes it.

---

## Database Setup

### 1. Create the PostgreSQL database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Inside psql shell:
CREATE DATABASE devops_platform;
\q
```

### 2. Run schema migration

```bash
# From project root:
npm run db:migrate

# Or from server/ directory:
cd server && npm run db:migrate
```

This executes `server/db/schema.sql` which creates all 13 tables, indexes, triggers, and constraints.

### 3. Seed initial data

```bash
# From project root:
npm run db:seed

# Or from server/ directory:
cd server && npm run db:seed
```

This inserts:
- Default categories (Git, Docker, Kubernetes, Terraform)
- Sample courses and task metadata
- Admin and student test accounts (with bcrypt-hashed passwords)

### Database Schema Overview

| Table | Purpose |
|-------|---------|
| `users` | Student and admin accounts |
| `categories` | Task categories (Git, Docker, etc.) |
| `courses` | Grouped course offerings |
| `modules` | Course sub-sections |
| `tasks` | Individual practical exercises |
| `student_progress` | Per-user task completion tracking |
| `leaderboard` | Aggregated points per user |
| `activity_logs` | Full audit log (IP, OS, browser, duration) |
| `login_history` | Authentication event history |
| `certificates` | Completion certificates |
| `sessions` | Active JWT session tracking |
| `task_ratings` | User ratings per task |
| `announcements` | Admin broadcast messages |

---

## Running the Application

### Development mode (two terminals)

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Starts Express on http://localhost:5000 with nodemon hot-reload
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# Starts Vite dev server on http://localhost:5173
```

### Production mode

```bash
# Build the React frontend
cd client && npm run build
# Output: client/dist/

# Start the Express server (serves API + points client to built dist)
cd ../server && npm start
```

---

## Default Credentials

> **Change all default passwords immediately after first login.**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@devops.platform` | `Admin@123456` |
| Student (demo) | `student@devops.platform` | `Student@123456` |

---

## Production Deployment (GCP)

This guide covers deployment to **Google Cloud Platform** using:
- **Cloud SQL** — managed PostgreSQL 15
- **Cloud Run** — containerised Express backend
- **Firebase Hosting** — React frontend (CDN)

### Step 1 — Provision Cloud SQL

```bash
gcloud sql instances create devops-platform-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --availability-type=ZONAL

gcloud sql databases create devops_platform \
  --instance=devops-platform-db

gcloud sql users set-password postgres \
  --instance=devops-platform-db \
  --password=YOUR_STRONG_PASSWORD
```

### Step 2 — Store secrets in Secret Manager

```bash
echo -n "YOUR_JWT_SECRET" | \
  gcloud secrets create jwt-secret --data-file=-

echo -n "YOUR_DB_PASSWORD" | \
  gcloud secrets create db-password --data-file=-
```

### Step 3 — Containerise the backend

Create `server/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

Build and push to Artifact Registry:

```bash
gcloud artifacts repositories create devops-platform \
  --repository-format=docker \
  --location=us-central1

gcloud builds submit server/ \
  --tag us-central1-docker.pkg.dev/YOUR_PROJECT/devops-platform/api:latest
```

### Step 4 — Deploy to Cloud Run

```bash
gcloud run deploy devops-platform-api \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT/devops-platform/api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars DB_HOST=/cloudsql/YOUR_PROJECT:us-central1:devops-platform-db \
  --set-env-vars DB_NAME=devops_platform \
  --set-env-vars DB_USER=postgres \
  --set-secrets DB_PASSWORD=db-password:latest \
  --set-secrets JWT_SECRET=jwt-secret:latest \
  --add-cloudsql-instances YOUR_PROJECT:us-central1:devops-platform-db
```

### Step 5 — Deploy frontend to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login

# Set backend URL in the client environment
echo "VITE_API_URL=https://YOUR_CLOUD_RUN_URL" > client/.env.production

# Build React app
cd client && npm run build

# Initialize Firebase and deploy
firebase init hosting
# Public directory: client/dist
# Configure as SPA: Yes
# Overwrite index.html: No

firebase deploy --only hosting
```

### Step 6 — Run database migration on Cloud SQL

```bash
# Connect via Cloud SQL Auth Proxy
./cloud-sql-proxy YOUR_PROJECT:us-central1:devops-platform-db &

DB_HOST=127.0.0.1 \
DB_PORT=5432 \
DB_NAME=devops_platform \
DB_USER=postgres \
DB_PASSWORD=YOUR_PASSWORD \
node server/db/migrate.js

node server/db/seed.js
```

---

## Deployment with Docker

### docker-compose.yml (local full-stack)

Create `docker-compose.yml` at project root:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: devops_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./server/db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql

  api:
    build:
      context: ./server
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: devops_platform
      DB_USER: postgres
      DB_PASSWORD: postgres
      JWT_SECRET: change_me_in_production
      JWT_EXPIRES_IN: 7d
      CLIENT_URL: http://localhost:3000
    depends_on:
      - postgres

  client:
    build:
      context: ./client
      args:
        VITE_API_URL: http://localhost:5000
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  pg_data:
```

```bash
# Build and start all services
docker compose up --build

# Run migrations after containers start
docker compose exec api node db/migrate.js
docker compose exec api node db/seed.js
```

---

## API Reference

Base URL: `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new student |
| POST | `/auth/login` | Public | Login, returns JWT |
| POST | `/auth/logout` | JWT | Invalidate session |
| GET | `/auth/me` | JWT | Get current user profile |
| POST | `/auth/forgot-password` | Public | Request password reset |

### Tasks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tasks/categories` | JWT | List all categories |
| GET | `/tasks` | JWT | List tasks (filter by category) |
| GET | `/tasks/:id` | JWT | Get single task details |
| GET | `/tasks/:id/file` | JWT | Serve raw HTML task file |

### Progress

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/progress/open` | JWT | Record task opened |
| POST | `/progress/complete` | JWT | Mark task completed + award points |
| GET | `/progress/my` | JWT | Get personal progress stats |

### Leaderboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/leaderboard` | JWT | Global leaderboard rankings |

### Admin (role = admin required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/analytics` | Admin | Platform-wide metrics |
| GET | `/admin/students` | Admin | Full student directory |
| PATCH | `/admin/students/:id/status` | Admin | Toggle student active status |
| POST | `/admin/tasks/upload` | Admin | Upload new HTML task file |
| GET | `/logs/activity` | Admin | System-wide audit logs |

---

## Admin Guide

### Uploading a New Task

1. Login as admin at `/login`
2. Navigate to **Admin → Task Upload** (`/admin/tasks/upload`)
3. Fill in the form:
   - **Title**: Descriptive task name
   - **Category**: `git` / `docker` / `kubernetes` / `terraform`
   - **Difficulty**: `beginner` / `intermediate` / `advanced`
   - **Points**: Integer point reward (e.g. `100`)
   - **HTML Content**: Complete standalone HTML for the exercise
4. Click **Upload Task** — the file is saved to `server/tasks/{category}/` and registered in PostgreSQL automatically.

### Task HTML Contract

Every uploaded task HTML file must call `window.parent.postMessage` to signal student completion:

```javascript
// Place this call inside the task's completion handler
window.parent.postMessage(
  { type: 'TASK_COMPLETE', taskId: 'your-task-id' },
  '*'
);
```

The parent React app (TaskView page) listens for this message and POSTs to `/api/progress/complete`.

### Managing Students

Navigate to **Admin → Students** (`/admin/students`) to:
- Search students by name or email
- View each student's total points and completed task count
- Toggle account active / inactive status

---

## Security Checklist

Before going to production, verify each item:

- [ ] `JWT_SECRET` is a cryptographically random 256-bit string — generate with `openssl rand -hex 32`
- [ ] `JWT_RESET_SECRET` is separately randomised
- [ ] `DB_PASSWORD` is strong (16+ characters, mixed case, numbers, symbols)
- [ ] `NODE_ENV=production` is set on the Express server
- [ ] `CLIENT_URL` and `CORS_ORIGIN` are set to your exact frontend domain (no wildcards)
- [ ] Rate limiting is tuned for your traffic (`RATE_LIMIT_MAX_REQUESTS`)
- [ ] Helmet.js security headers are active (enabled by default in `server.js`)
- [ ] HTTPS is enforced — GCP Cloud Run enforces this automatically
- [ ] Admin account default password has been changed
- [ ] PostgreSQL is not publicly exposed — use Cloud SQL private IP or Unix socket
- [ ] `server/.env` is never committed — confirmed in `.gitignore`
- [ ] Unused PostgreSQL roles/users have been removed

---

## Troubleshooting

### `ECONNREFUSED` on database connection
- Verify PostgreSQL is running: check Windows Services or run `pg_lscluster`
- Double-check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `server/.env`
- Verify the database exists: `psql -U postgres -c "\l"`

### `relation does not exist` SQL error
- The migration has not been run. Execute: `npm run db:migrate` from project root

### JWT `invalid signature` error
- `JWT_SECRET` mismatch. Ensure the same `server/.env` value is used for both signing and verifying tokens.

### Vite proxy 404 / CORS errors in development
- Confirm `server/server.js` is running on port `5000`
- Confirm `vite.config.js` proxy target is `http://localhost:5000`

### `MODULE_NOT_FOUND` on server start
- Run `npm install` inside `server/` directory
- Verify Node.js version: `node -v` (must be >= 20)

### Cloud Run cannot connect to Cloud SQL
- Verify `--add-cloudsql-instances` flag is present on the Cloud Run deployment command
- Grant the Cloud Run service account the `Cloud SQL Client` IAM role

### Task HTML file not loading in iframe
- Ensure the file exists at `server/tasks/{category}/{filename}.html`
- Verify the task is registered in the `tasks` PostgreSQL table
- Check Express static file serving is mounted for the `tasks/` directory

---

## License

MIT © Antigravity Engineering 2026

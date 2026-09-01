# Habit & Routine Tracker

A full-stack habit tracking application with secure authentication, email-based OTP verification, automatic streak/consistency analytics, and visual weekly/monthly progress charts.

## Live Demo

- **App:** https://habit-routine-tracker-client.onrender.com
- **API:** https://habit-routine-tracker.onrender.com

> Note: the backend and database run on free-tier hosting (Render + Aiven), so the very first request after a period of inactivity may take up to 30-60 seconds while the service spins back up. Subsequent requests are fast.

## Features

- **Authentication** — JWT-based login/register with bcrypt password hashing
- **Email OTP verification** — new accounts must verify their email via a 6-digit code before logging in
- **Forgot password flow** — OTP-based password reset (doesn't leak whether an email is registered)
- **Habit management** — create, edit, and delete personal habits (daily or weekly)
- **Completion tracking** — mark habits complete/incomplete per day, enforced as one log per habit per day at the database level
- **Streak analytics** — current streak, longest streak, and completion percentage, calculated from raw completion logs
- **Aggregate stats** — weekly and monthly summaries across all habits via SQL aggregation
- **Interactive charts** — visualize completion trends with Recharts
- **Account management** — delete account (cascades to remove all associated data)
- **Security hardening** — rate limiting on auth endpoints, centralized error handling, and request validation

## Tech Stack

**Frontend:** React, React Router, Context API, Axios, Recharts, Vite
**Backend:** Node.js, Express.js, MySQL (mysql2), JWT, bcrypt, express-validator, express-rate-limit
**Email:** Brevo (transactional email API)
**Hosting:** Render (frontend static site + backend web service), Aiven (managed MySQL)

## Architecture Highlights

- **Ownership-scoped queries** — every habit/log operation is filtered by the authenticated user's ID, preventing cross-user data access even with a guessed ID
- **Composite unique constraint** (`habit_id` + `completion_date`) with `INSERT ... ON DUPLICATE KEY UPDATE` for atomic complete/incomplete toggling — avoids race conditions from separate check-then-write logic
- **Custom streak algorithm** — walks completion dates using a `Set` for O(1) lookups, distinguishing "current streak" (unbroken run ending today) from "longest streak" (best run in history)
- **Timezone-safe date handling** — MySQL `DATE` columns returned as plain strings (`dateStrings: true`) to avoid UTC conversion bugs
- **Centralized error handling** — Express middleware pattern (`next(err)`) instead of repeated try/catch boilerplate per route
- **User enumeration prevention** — forgot-password endpoint returns an identical response whether or not the email exists
- **HTTP-based transactional email** — uses Brevo's REST API (over HTTPS) instead of raw SMTP, since most cloud hosts block outbound SMTP ports on free tiers

## Local Setup

### Prerequisites

- Node.js and npm
- MySQL

### Backend

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=habit_tracker
DB_SSL=false
JWT_SECRET=your_random_secret
EMAIL_USER=your_gmail_address@gmail.com
BREVO_API_KEY=your_brevo_api_key
```

Run the SQL schema (see `/server` for table definitions: `users`, `habits`, `completion_logs`, `otp_verifications`).

```bash
npm run dev
```

### Frontend

```bash
cd client
npm install
```

Create a `.env` file in `client/` (optional for local dev — defaults to `http://localhost:5000/api` if omitted):

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

The app will be available at `http://localhost:5173`, with the API running on `http://localhost:5000`.

## Deployment

- **Backend:** deployed to Render as a Web Service (root directory `server`, build `npm install`, start `node server.js`)
- **Frontend:** deployed to Render as a Static Site (root directory `client`, build `npm install && npm run build`, publish directory `dist`), with `VITE_API_URL` set to the live backend URL
- **Database:** hosted on Aiven (managed MySQL), connected via SSL

## Project Structure

```
habit-tracker/
├── client/           # React frontend
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       └── pages/
└── server/           # Express backend
    ├── config/
    ├── middleware/
    ├── routes/
    └── utils/
```
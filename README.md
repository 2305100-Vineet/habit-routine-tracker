# Habit & Routine Tracker

A full-stack habit tracking application with secure authentication, email-based OTP verification, automatic streak/consistency analytics, and visual weekly/monthly progress charts.

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

**Backend:** Node.js, Express.js, MySQL (mysql2), JWT, bcrypt, express-validator, express-rate-limit, Nodemailer

## Architecture Highlights

- **Ownership-scoped queries** — every habit/log operation is filtered by the authenticated user's ID, preventing cross-user data access even with a guessed ID
- **Composite unique constraint** (`habit_id` + `completion_date`) with `INSERT ... ON DUPLICATE KEY UPDATE` for atomic complete/incomplete toggling — avoids race conditions from separate check-then-write logic
- **Custom streak algorithm** — walks completion dates using a `Set` for O(1) lookups, distinguishing "current streak" (unbroken run ending today) from "longest streak" (best run in history)
- **Timezone-safe date handling** — MySQL `DATE` columns returned as plain strings (`dateStrings: true`) to avoid UTC conversion bugs
- **Centralized error handling** — Express middleware pattern (`next(err)`) instead of repeated try/catch boilerplate per route
- **User enumeration prevention** — forgot-password endpoint returns an identical response whether or not the email exists

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
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=habit_tracker
JWT_SECRET=your_random_secret
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password

Run the SQL schema (see `/server` for table definitions: `users`, `habits`, `completion_logs`, `otp_verifications`).

```bash
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`, with the API running on `http://localhost:5000`.

## Project Structure
habit-tracker/
├── client/ # React frontend
│ └── src/
│ ├── api/
│ ├── components/
│ ├── context/
│ └── pages/
└── server/ # Express backend
├── config/
├── middleware/
├── routes/
└── utils/

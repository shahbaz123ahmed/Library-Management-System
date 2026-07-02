# Library Management System

Full-stack LMS built with Next.js, Tailwind CSS, Node.js/Express, MongoDB, and JWT authentication.

## Features

- Admin, librarian, and student roles with RBAC
- JWT auth with bcrypt password hashing
- Dashboard stats and analytics
- Book CRUD, search, filters, pagination, cover upload
- Issue/return flow with due dates and fines
- User management (admin only)
- Due and overdue notifications
- CSV export for books and transactions
- Dark/light mode toggle

## Tech Stack

- Frontend: Next.js (App Router), Tailwind CSS, Recharts
- Backend: Node.js, Express.js, Mongoose
- Database: MongoDB
- Auth: JWT + bcrypt

## Setup

### 1) Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Configure environment variables

Backend environment in backend/.env (already created):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/library
JWT_SECRET=dev_secret_change_me
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:3000
DUE_DAYS=14
FINE_PER_DAY=2
DUE_SOON_DAYS=3
```

Frontend environment in frontend/.env.local:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3) Seed sample data

```bash
cd backend
npm run seed
```

### 4) Run the apps

```bash
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm run dev
```

Frontend runs on http://localhost:3000 and the API on http://localhost:5000.

## API Overview

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/books
- GET /api/books/suggest
- GET /api/books/:id
- POST /api/books
- PUT /api/books/:id
- DELETE /api/books/:id
- POST /api/transactions/issue
- POST /api/transactions/return/:id
- GET /api/transactions
- GET /api/dashboard/stats
- GET /api/dashboard/analytics
- GET /api/notifications
- POST /api/notifications/reminders
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

## Notes

- Cover images are stored in backend/uploads and served at /uploads.
- Update .env files before deploying.









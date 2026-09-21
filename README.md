# Shared To-Do List

A full-stack shared to-do list app: React (Vite + TypeScript) frontend, Express (TypeScript) backend, PostgreSQL database, Firebase Authentication, containerised with Docker Compose.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- A Firebase project with the **Email/Password** sign-in provider enabled, and a service-account key for the Admin SDK

## Setup

```bash
cp .env.example .env
# fill in DB_*, FIREBASE_* (Admin SDK service account), and VITE_FIREBASE_* (Web SDK config)
```

## Run everything with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Postgres: localhost:5434 (mapped from the container's 5432, to avoid clashing with a local Postgres install)

## Run services individually (dev)

```bash
# 1. Postgres only
docker compose up db

# 2. Backend
cd apps/backend
npm install
npm run migrate
npm run dev

# 3. Frontend
cd apps/frontend
npm install
npm run dev
```

## Project layout

```
apps/frontend   Vite + React + TypeScript client
apps/backend    Express + TypeScript API
packages/shared Shared TypeScript types
schema.dbml     Database schema (dbdiagram.io compatible)
```

## API overview

| Method | Route | Description |
| --- | --- | --- |
| POST | /api/auth/signup | Create Firebase user + local profile |
| POST | /api/auth/login | Verify Firebase ID token, return/create local profile |
| GET | /api/tasks?filter=all\|mine\|shared | List tasks |
| POST | /api/tasks | Create a task |
| GET | /api/tasks/:id | Get a task (owner or shared-with) |
| PUT | /api/tasks/:id | Update a task (owner only) |
| DELETE | /api/tasks/:id | Delete a task (owner only) |
| POST | /api/tasks/:id/share | Share a task by email |
| DELETE | /api/tasks/:id/share/:userId | Revoke a share |
| GET | /api/users?search= | Search users (for the share popup) |

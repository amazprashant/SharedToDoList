# Installation & Setup Guide

This guide walks through installing and running the Shared To-Do List project from scratch, either fully containerized with Docker or as separate services for local development.

## 1. What you need before starting

| Requirement | Version | Check with |
| --- | --- | --- |
| Node.js | 20+ (22 also works) | `node -v` |
| npm | comes with Node | `npm -v` |
| Docker & Docker Compose | any recent version | `docker --version` / `docker compose version` |
| Firebase project | Email/Password sign-in enabled | console.firebase.google.com |

You only need Docker if you plan to use the "run everything with Docker" path. For the manual dev setup you need Node/npm and a running Postgres (Docker is still the easiest way to get Postgres, even if you run the frontend/backend outside containers).

## 2. Get a Firebase project ready

The app uses Firebase Authentication (Email/Password) for login, and Firebase Admin SDK on the backend to verify tokens.

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. **Enable sign-in method**: Build → Authentication → Sign-in method → enable **Email/Password**.
3. **Get the Web SDK config** (for the frontend): Project settings → General → "Your apps" → add a Web app → copy the `firebaseConfig` values (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`).
4. **Get a service account key** (for the backend Admin SDK): Project settings → Service accounts → "Generate new private key" → this downloads a JSON file containing `project_id`, `client_email`, and `private_key`.

Keep both sets of values handy for the next step.

## 3. Clone and configure environment variables

```bash
git clone https://github.com/amazprashant/SharedToDoList.git
cd SharedToDoList
cp .env.example .env
```

Open `.env` and fill in every value:

```bash
# --- Postgres ---
DB_USER=todo_user
DB_PASSWORD=change_me        # pick any password
DB_NAME=shared_todo

# --- Backend (used only when running backend outside Docker) ---
DATABASE_URL=postgres://todo_user:change_me@localhost:5434/shared_todo
PORT=4000

# --- Firebase Admin SDK (from the service account JSON in step 2.4) ---
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# --- Firebase Web SDK (from step 2.3, frontend) ---
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_API_BASE_URL=http://localhost:4000
```

**Important:** `FIREBASE_PRIVATE_KEY` must keep its `\n` line breaks and be wrapped in quotes, exactly as it appears in the downloaded JSON's `private_key` field.

Never commit `.env` — it's already covered by `.gitignore`.

## 4. Option A — Run everything with Docker (simplest)

This builds and starts Postgres, the backend API, and the frontend together.

```bash
docker compose up --build
```

Once it's up:

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Postgres: localhost:5434 (mapped from the container's internal 5432)

Database tables are created automatically the first time the backend container starts (via the migration step baked into startup). Stop everything with `Ctrl+C`, or run in the background with `docker compose up --build -d` and stop later with `docker compose down`.

## 5. Option B — Run services individually (for active development)

Use this when you want hot-reload on the frontend/backend instead of rebuilding containers.

**Step 1 — start only Postgres:**

```bash
docker compose up db
```

Leave this running in its own terminal.

**Step 2 — install all workspace dependencies (run once from the repo root):**

```bash
npm install
```

This installs dependencies for the root, `apps/backend`, `apps/frontend`, and `packages/shared` in one pass (npm workspaces).

**Step 3 — run the database migration:**

```bash
npm run migrate
```

**Step 4 — start the backend** (new terminal):

```bash
cd apps/backend
npm run dev
```

Backend runs on http://localhost:4000 with auto-restart on file changes.

**Step 5 — start the frontend** (new terminal):

```bash
cd apps/frontend
npm run dev
```

Frontend runs on http://localhost:5173 with Vite hot-reload.

## 6. Verify it works

1. Open http://localhost:5173 in a browser.
2. Sign up with an email/password — this creates a Firebase user and a matching local profile in Postgres.
3. Create a task, then try sharing it with another user's email to confirm the API and database are wired up correctly.

## 7. Common scripts reference

Run from the repo root (uses npm workspaces):

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies for all workspaces |
| `npm run dev:backend` | Start backend in dev mode |
| `npm run dev:frontend` | Start frontend in dev mode |
| `npm run migrate` | Apply database migrations |
| `npm run build` | Build shared package, backend, and frontend for production |

## 8. Troubleshooting

- **`ECONNREFUSED` connecting to Postgres**: make sure `docker compose up db` is running and that `DATABASE_URL` in `.env` uses port `5434` (the host-mapped port), not `5432`.
- **Firebase auth errors on signup/login**: double-check `FIREBASE_PRIVATE_KEY` retains its `\n` escapes and quotes, and that Email/Password sign-in is enabled in the Firebase console.
- **Port already in use**: something else is using `5173`, `4000`, or `5434` — stop that process or change the port mappings in `docker-compose.yml` / `.env`.
- **Frontend can't reach backend**: confirm `VITE_API_BASE_URL` in `.env` matches where the backend is actually running (`http://localhost:4000` by default).

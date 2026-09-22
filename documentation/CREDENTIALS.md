# Credentials Reference

This document lists every credential and environment variable the project needs, what it's for, and where to get it. It contains **no real secret values** — actual values go in your local `.env` file (already gitignored, never commit it).

Copy `.env.example` to `.env` and fill in the values described below.

## Postgres

| Variable | Purpose | Where to get it |
| --- | --- | --- |
| `DB_USER` | Database username | Pick any value yourself |
| `DB_PASSWORD` | Database password | Pick any value yourself |
| `DB_NAME` | Database name | Pick any value yourself |
| `DATABASE_URL` | Full connection string, used when running the backend outside Docker | Built from the three values above: `postgres://<DB_USER>:<DB_PASSWORD>@localhost:5434/<DB_NAME>` (port 5434 is the host-mapped Docker port) |

## Backend

| Variable | Purpose | Where to get it |
| --- | --- | --- |
| `PORT` | Port the backend listens on | Default `4000`, change only if that port is taken |

## Firebase Admin SDK (backend — verifies user tokens)

1. Go to the [Firebase console](https://console.firebase.google.com/) → your project → **Project settings → Service accounts**.
2. Click **Generate new private key** — this downloads a JSON file.
3. Map its fields to these env vars:

| Variable | JSON field | Notes |
| --- | --- | --- |
| `FIREBASE_PROJECT_ID` | `project_id` | |
| `FIREBASE_CLIENT_EMAIL` | `client_email` | |
| `FIREBASE_PRIVATE_KEY` | `private_key` | Keep the `\n` line breaks and wrap the whole value in quotes when pasting into `.env` |

Keep this JSON file itself out of the repo — delete it or store it outside the project directory once you've copied the values into `.env`.

## Firebase Web SDK (frontend — client-side auth)

1. Firebase console → your project → **Project settings → General → Your apps** → add/select a Web app.
2. Copy the `firebaseConfig` object shown there into these env vars:

| Variable | `firebaseConfig` field |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `measurementId` |

3. In the Firebase console, also enable **Authentication → Sign-in method → Email/Password**, otherwise signup/login will fail even with correct config.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | URL the frontend uses to reach the backend API (default `http://localhost:4000`) |

## Security notes

- `.env` is listed in `.gitignore` — never remove it from there or commit a filled-in `.env`.
- Rotate the Firebase service account key (Project settings → Service accounts → Manage service account permissions) if it's ever exposed.
- Don't share `.env` contents in chat, screenshots, issues, or pull requests.

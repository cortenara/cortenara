# Content Creator Workspace

A secure single-page workspace for content creators. Vanilla HTML + Tailwind +
JavaScript frontend, Node.js + Express backend, Firebase Auth + Firestore.

## Features

- Firebase Email/Password authentication
- Project dashboard backed by Firestore
- Project view with three tabs:
  - **Script + AI** — auto-saving editor and a Gemini-powered "Video Script Assistant"
  - **Media Assets** — files from a configurable Google Drive folder (server-side service account)
  - **YouTube Analytics** — latest videos, views, and likes
- Multi-stage timer (Scripting / Media / Review) with logs saved to Firestore
- Dark mode UI, responsive, with toast notifications and loading spinners

## Security model

- All secret credentials are read from environment variables on the **server**.
- Google Drive uses a **service account** that never ships to the browser.
- Gemini and YouTube Data API keys never reach the browser — the frontend hits
  `/api/...` and the server proxies the call.
- Optionally, the server verifies the user's Firebase ID token on every
  protected `/api/*` request when `FIREBASE_SERVICE_ACCOUNT` is set.

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in real values:

   ```bash
   cp .env.example .env
   ```

   - `GOOGLE_APPLICATION_CREDENTIALS` — path to your Drive service-account JSON
   - `DRIVE_FOLDER_ID` — the Drive folder you want to expose
   - `GEMINI_API_KEY` — from Google AI Studio
   - `YOUTUBE_API_KEY` — from Google Cloud Console
   - `FIREBASE_SERVICE_ACCOUNT` (optional) — path to a Firebase service-account JSON
   - `PORT` — defaults to 8080

3. **Configure the frontend's Firebase project**

   Open `public/script.js` and replace the `firebaseConfig` placeholder with
   your project's web config (Firebase Console → Project Settings → Your apps).
   These web config values are public by design.

4. **Run the server**

   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

   Open the preview at `/`.

## API endpoints

- `GET  /api/health` — sanity check
- `GET  /api/files?folderId=...` — list Drive files (folderId optional, falls back to env)
- `POST /api/ai/chat` — `{ messages: [{ role, content }] }` → `{ text }`
- `GET  /api/youtube/videos?channelId=...` — latest videos with stats

If `FIREBASE_SERVICE_ACCOUNT` is set, every `/api/*` data endpoint requires
`Authorization: Bearer <Firebase ID token>`.

## Project layout

```
artifacts/api-server/
├── server.js                 # Express server + API routes
├── package.json
├── .env.example
└── public/
    ├── index.html            # SPA shell (Tailwind via CDN)
    ├── script.js             # All frontend logic
    └── style.css             # A handful of custom rules
```

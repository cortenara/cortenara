/**
 * Content Creator Workspace - Backend Server
 * ------------------------------------------------------------
 * SECURE Node.js + Express server.
 *
 * All sensitive credentials live in environment variables
 * (see .env.example). NOTHING secret is ever sent to the
 * frontend. The frontend talks to this server, and this
 * server talks to Google Drive, Gemini, and YouTube on its
 * behalf.
 *
 * Required environment variables:
 *   GOOGLE_APPLICATION_CREDENTIALS  - Absolute path to your
 *                                     Google Service Account
 *                                     JSON key file.
 *   DRIVE_FOLDER_ID                 - The Google Drive folder
 *                                     to list files from.
 *   GEMINI_API_KEY                  - Google AI Studio key
 *                                     for Gemini.
 *   YOUTUBE_API_KEY                 - Google Cloud API key
 *                                     enabled for the YouTube
 *                                     Data API v3.
 *
 * Optional:
 *   FIREBASE_SERVICE_ACCOUNT        - Absolute path to a
 *                                     Firebase service-account
 *                                     JSON file. If provided,
 *                                     protected endpoints will
 *                                     verify Firebase ID
 *                                     tokens sent in the
 *                                     `Authorization: Bearer
 *                                     <token>` header.
 *   PORT                            - Port to listen on.
 *                                     Defaults to 8080.
 */

require("dotenv").config();

const path = require("path");
const fs = require("fs");
const { Readable } = require("stream");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { google } = require("googleapis");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Optional: Firebase Admin (used to verify ID tokens on protected routes)
// ---------------------------------------------------------------------------
let firebaseAdmin = null;
try {
  let serviceAccount = null;

  // Option 1 (recommended for Vercel): full JSON content as a single env var.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  // Option 2 (local dev): path to a JSON file on disk.
  else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const credPath = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (fs.existsSync(credPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(credPath, "utf8"));
    } else {
      console.warn(
        `[init] FIREBASE_SERVICE_ACCOUNT path not found: ${credPath}`,
      );
    }
  }

  if (serviceAccount) {
    // eslint-disable-next-line global-require
    const admin = require("firebase-admin");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseAdmin = admin;
    console.log("[init] Firebase Admin initialized.");
  }
} catch (err) {
  console.warn("[init] Firebase Admin init failed:", err.message);
}

/**
 * Optional auth middleware. If Firebase Admin is configured, requires a valid
 * Firebase ID token in `Authorization: Bearer <token>`. If Firebase Admin is
 * NOT configured, the middleware is a no-op so the project still runs in
 * setup/demo mode.
 */
async function requireAuth(req, res, next) {
  if (!firebaseAdmin) return next();
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: "Missing bearer token" });
  }
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(match[1]);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------------------------------------------------------------------
// Google Drive (Service Account) - server-side only
// ---------------------------------------------------------------------------
let driveClient = null;
function getDriveClient() {
  if (driveClient) return driveClient;

  let credentials = null;

  // Option 1 (recommended for Vercel): full JSON content as a single env var.
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  }
  // Option 2 (local dev): path to a JSON file on disk.
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credentials = JSON.parse(
      fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"),
    );
  } else {
    throw new Error(
      "Google credentials are not set. Provide GOOGLE_CREDENTIALS_JSON (Vercel) or GOOGLE_APPLICATION_CREDENTIALS (local file path).",
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  driveClient = google.drive({ version: "v3", auth });
  return driveClient;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    firebase: Boolean(firebaseAdmin),
    drive: Boolean(
      process.env.GOOGLE_CREDENTIALS_JSON ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS,
    ),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    youtube: Boolean(process.env.YOUTUBE_API_KEY),
  });
});

/**
 * GET /api/files?folderId=...
 * Lists files inside a Drive folder. Folder ID is configurable via
 * query string; falls back to DRIVE_FOLDER_ID from env.
 */
app.get("/api/files", requireAuth, async (req, res) => {
  try {
    const folderId = req.query.folderId || process.env.DRIVE_FOLDER_ID;
    if (!folderId) {
      return res.status(400).json({
        error:
          "No folderId provided and DRIVE_FOLDER_ID env var is not set.",
      });
    }

    const drive = getDriveClient();
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "files(id, name, mimeType, iconLink, thumbnailLink, webViewLink, modifiedTime, size)",
      pageSize: 100,
      orderBy: "modifiedTime desc",
    });

    res.json({ files: response.data.files || [] });
  } catch (err) {
    console.error("[/api/files] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files
 * Multipart upload. Field name: "file". Optional query: folderId.
 * Uploads the file into the configured Drive folder.
 */
app.post(
  "/api/files",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided." });
      }
      const folderId = req.query.folderId || process.env.DRIVE_FOLDER_ID;
      if (!folderId) {
        return res.status(400).json({
          error:
            "No folderId provided and DRIVE_FOLDER_ID env var is not set.",
        });
      }

      const drive = getDriveClient();
      const created = await drive.files.create({
        requestBody: {
          name: req.file.originalname,
          parents: [folderId],
          mimeType: req.file.mimetype,
        },
        media: {
          mimeType: req.file.mimetype,
          body: Readable.from(req.file.buffer),
        },
        fields:
          "id, name, mimeType, iconLink, thumbnailLink, webViewLink, modifiedTime, size",
      });

      res.json({ file: created.data });
    } catch (err) {
      console.error("[POST /api/files] error:", err.message);
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * GET /api/files/:id/download
 * Streams the binary contents of a Drive file back to the client.
 */
app.get("/api/files/:id/download", requireAuth, async (req, res) => {
  try {
    const drive = getDriveClient();
    const meta = await drive.files.get({
      fileId: req.params.id,
      fields: "name, mimeType, size",
    });

    res.setHeader(
      "Content-Type",
      meta.data.mimeType || "application/octet-stream",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(meta.data.name || "file")}"`,
    );
    if (meta.data.size) res.setHeader("Content-Length", meta.data.size);

    const stream = await drive.files.get(
      { fileId: req.params.id, alt: "media" },
      { responseType: "stream" },
    );
    stream.data
      .on("error", (err) => {
        console.error("[/api/files/:id/download] stream error:", err.message);
        if (!res.headersSent) res.status(500).json({ error: err.message });
      })
      .pipe(res);
  } catch (err) {
    console.error("[/api/files/:id/download] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/files/:id
 * Deletes a file from Drive.
 */
app.delete("/api/files/:id", requireAuth, async (req, res) => {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/files/:id] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/chat
 * Body: { messages: [{ role: 'user'|'model', content: string }] }
 * Proxies the conversation to Gemini, presented as a Video Script Assistant.
 */
app.post("/api/ai/chat", requireAuth, async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY env var is not set." });
    }
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];

    const systemInstruction = {
      role: "user",
      parts: [
        {
          text:
            "You are 'Video Script Assistant', a friendly expert that helps content " +
            "creators draft, polish, and structure short-form and long-form video " +
            "scripts. Be concise, give actionable suggestions, and offer hooks, " +
            "outlines, and CTAs when useful.",
        },
      ],
    };

    const contents = [
      systemInstruction,
      ...messages.map((m) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: String(m.content || "") }],
      })),
    ];

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(process.env.GEMINI_API_KEY);

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res
        .status(r.status)
        .json({ error: data?.error?.message || "Gemini error" });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "";
    res.json({ text });
  } catch (err) {
    console.error("[/api/ai/chat] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/youtube/videos?channelId=...   (or)
 * GET /api/youtube/videos?username=...
 * Fetches latest videos for a channel and returns view/like counts.
 */
app.get("/api/youtube/videos", requireAuth, async (req, res) => {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      return res
        .status(500)
        .json({ error: "YOUTUBE_API_KEY env var is not set." });
    }

    let channelId = req.query.channelId;
    const username = req.query.username;

    // Resolve handle/username to channelId if needed
    if (!channelId && username) {
      const lookup = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=" +
          encodeURIComponent(username) +
          "&key=" +
          encodeURIComponent(process.env.YOUTUBE_API_KEY),
      );
      const lookupData = await lookup.json();
      channelId = lookupData?.items?.[0]?.id;
    }
    if (!channelId) {
      return res
        .status(400)
        .json({ error: "Provide channelId or username (handle)." });
    }

    // 1) Get latest video IDs from the channel
    const searchUrl =
      "https://www.googleapis.com/youtube/v3/search?part=id,snippet" +
      "&channelId=" +
      encodeURIComponent(channelId) +
      "&maxResults=12&order=date&type=video&key=" +
      encodeURIComponent(process.env.YOUTUBE_API_KEY);
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (!searchRes.ok) {
      return res
        .status(searchRes.status)
        .json({ error: searchData?.error?.message || "YouTube error" });
    }

    const ids = (searchData.items || [])
      .map((i) => i.id?.videoId)
      .filter(Boolean);
    if (ids.length === 0) return res.json({ videos: [] });

    // 2) Get statistics (views, likes) for those videos
    const statsUrl =
      "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics" +
      "&id=" +
      encodeURIComponent(ids.join(",")) +
      "&key=" +
      encodeURIComponent(process.env.YOUTUBE_API_KEY);
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    const videos = (statsData.items || []).map((v) => ({
      id: v.id,
      title: v.snippet?.title,
      description: v.snippet?.description,
      publishedAt: v.snippet?.publishedAt,
      thumbnail:
        v.snippet?.thumbnails?.medium?.url ||
        v.snippet?.thumbnails?.default?.url,
      views: Number(v.statistics?.viewCount || 0),
      likes: Number(v.statistics?.likeCount || 0),
      comments: Number(v.statistics?.commentCount || 0),
    }));

    res.json({ videos });
  } catch (err) {
    console.error("[/api/youtube/videos] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Static frontend
// ---------------------------------------------------------------------------
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// SPA fallback - any non-API GET returns index.html
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// 404 for unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
// On Vercel (serverless), we don't call listen() — we export the app and
// Vercel invokes it as a function. Locally, we start a normal HTTP server.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 8080;
  app.listen(port, () => {
    console.log(`[server] Listening on http://localhost:${port}`);
  });
}

module.exports = app;

/**
 * Content Creator Workspace - Frontend
 * ------------------------------------------------------------
 * Vanilla JS module. No framework. Talks to:
 *   - Firebase (Auth + Firestore) directly from the browser
 *   - Our own Express server at /api/* for anything sensitive
 *
 * NOTE ABOUT KEYS:
 *   The `firebaseConfig` block below contains *web* config values
 *   (apiKey, projectId, etc). Per Firebase docs these are NOT
 *   secrets — they identify your project to Google. Real secrets
 *   (Drive service account, Gemini key, YouTube key) live on the
 *   server in environment variables and never reach this file.
 */

// ---------------------------------------------------------------------------
// Firebase setup (web SDK via CDN modules)
// ---------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

/**
 * 🔧 INSERT YOUR FIREBASE WEB CONFIG HERE
 *    Firebase Console → Project Settings → Your apps → Web app config.
 *    These values are public by design (Firebase identifies the project,
 *    real auth happens via Firebase Security Rules).
 */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcMdPvkE4XxZmuuVlVLBDtvye0RdlURoU",
  authDomain: "cortenara-9d0cf.firebaseapp.com",
  projectId: "cortenara-9d0cf",
  storageBucket: "cortenara-9d0cf.firebasestorage.app",
  messagingSenderId: "722283269564",
  appId: "1:722283269564:web:8ac6c14dbcc33f15fa6fb9",
  measurementId: "G-VLH91K0V63"
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function toast(message, kind = "info") {
  const root = $("toastRoot");
  const el = document.createElement("div");
  const palette = {
    info: "border-ink-600 text-slate-100",
    success: "border-emerald-500/60 text-emerald-100 bg-emerald-500/10",
    error: "border-rose-500/60 text-rose-100 bg-rose-500/10",
  }[kind];
  el.className =
    "toast text-sm rounded-lg border bg-ink-900/95 backdrop-blur px-3.5 py-2.5 shadow-lg " +
    palette;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity 200ms ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 220);
  }, 3000);
}

async function authedFetch(url, opts = {}) {
  const headers = new Headers(opts.headers || {});
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (opts.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...opts, headers });
}

function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  if (s >= 3600) {
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    return `${hh}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${ss}`;
  }
  return `${mm}:${ss}`;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

// ---------------------------------------------------------------------------
// View routing
// ---------------------------------------------------------------------------
const state = {
  user: null,
  authMode: "login", // 'login' | 'signup'
  projects: [],
  unsubProjects: null,
  currentProject: null,
  unsubProject: null,
  saveTimer: null,
  // Timer
  timer: {
    stage: null,
    running: false,
    startedAt: null,
    elapsed: 0,
    interval: null,
  },
  chat: [],
  yt: { channelId: "", username: "" },
};

function showView(name) {
  $("authView").classList.toggle("hidden", name !== "auth");
  $("dashboardView").classList.toggle("hidden", name !== "dashboard");
  $("projectView").classList.toggle("hidden", name !== "project");
  $("topbar").classList.toggle("hidden", name === "auth");
  $("backBtn").classList.toggle("hidden", name !== "project");
  $("contextLabel").textContent =
    name === "project"
      ? state.currentProject?.name || "Project"
      : "Workspace";
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
$$(".auth-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.authMode = btn.dataset.authTab;
    $$(".auth-tab").forEach((b) => {
      const active = b.dataset.authTab === state.authMode;
      b.classList.toggle("bg-brand-600", active);
      b.classList.toggle("text-white", active);
      b.classList.toggle("font-medium", active);
      b.classList.toggle("text-slate-300", !active);
    });
    $("authSubmitLabel").textContent =
      state.authMode === "signup" ? "Create account" : "Sign in";
  });
});

$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;
  $("authSpinner").classList.remove("hidden");
  $("authSubmitBtn").disabled = true;
  try {
    if (state.authMode === "signup") {
      await createUserWithEmailAndPassword(auth, email, password);
      toast("Account created", "success");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      toast("Welcome back", "success");
    }
  } catch (err) {
    toast(err.message || "Authentication failed", "error");
  } finally {
    $("authSpinner").classList.add("hidden");
    $("authSubmitBtn").disabled = false;
  }
});

$("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  toast("Signed out", "info");
});

onAuthStateChanged(auth, (user) => {
  state.user = user;
  if (!user) {
    if (state.unsubProjects) state.unsubProjects();
    if (state.unsubProject) state.unsubProject();
    state.unsubProjects = null;
    state.unsubProject = null;
    showView("auth");
    return;
  }
  $("userEmail").textContent = user.email || "";
  showView("dashboard");
  subscribeToProjects();
});

// ---------------------------------------------------------------------------
// Dashboard - projects
// ---------------------------------------------------------------------------
function subscribeToProjects() {
  if (!state.user) return;
  if (state.unsubProjects) state.unsubProjects();

  $("projectsLoading").classList.remove("hidden");
  $("projectsEmpty").classList.add("hidden");

  const q = query(
    collection(db, "projects"),
    where("ownerId", "==", state.user.uid),
    orderBy("createdAt", "desc"),
  );
  state.unsubProjects = onSnapshot(
    q,
    (snap) => {
      $("projectsLoading").classList.add("hidden");
      state.projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderProjects();
    },
    (err) => {
      $("projectsLoading").classList.add("hidden");
      toast(`Failed to load projects: ${err.message}`, "error");
    },
  );
}

function renderProjects() {
  const grid = $("projectsGrid");
  grid.innerHTML = "";
  if (state.projects.length === 0) {
    $("projectsEmpty").classList.remove("hidden");
    return;
  }
  $("projectsEmpty").classList.add("hidden");

  for (const p of state.projects) {
    const card = document.createElement("button");
    card.className =
      "card-hover text-left rounded-2xl border border-ink-700 bg-ink-900/60 p-4 hover:bg-ink-900";
    const created =
      p.createdAt?.toDate?.() instanceof Date
        ? p.createdAt.toDate()
        : new Date();
    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div class="text-base font-semibold leading-tight">${escapeHtml(p.name || "Untitled")}</div>
        <div class="text-[11px] text-slate-500 whitespace-nowrap">${created.toLocaleDateString()}</div>
      </div>
      <div class="text-sm text-slate-400 mt-1 line-clamp-3 min-h-[40px]">${escapeHtml(p.description || "No description.")}</div>
      <div class="mt-3 text-[11px] text-brand-400">Open project →</div>
    `;
    card.addEventListener("click", () => openProject(p.id));
    grid.appendChild(card);
  }
}

// ---------------------------------------------------------------------------
// New project modal
// ---------------------------------------------------------------------------
$("newProjectBtn").addEventListener("click", () => {
  $("newProjectModal").classList.remove("hidden");
  setTimeout(() => $("newProjectName").focus(), 30);
});
$("newProjectCancel").addEventListener("click", () => {
  $("newProjectModal").classList.add("hidden");
});
$("newProjectModal").addEventListener("click", (e) => {
  if (e.target.id === "newProjectModal") {
    $("newProjectModal").classList.add("hidden");
  }
});
$("newProjectForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("newProjectName").value.trim();
  const description = $("newProjectDesc").value.trim();
  if (!name) return;
  try {
    await addDoc(collection(db, "projects"), {
      name,
      description,
      script: "",
      ownerId: state.user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    $("newProjectModal").classList.add("hidden");
    $("newProjectForm").reset();
    toast("Project created", "success");
  } catch (err) {
    toast(err.message || "Failed to create project", "error");
  }
});

// ---------------------------------------------------------------------------
// Project view
// ---------------------------------------------------------------------------
$("backBtn").addEventListener("click", () => {
  closeProject();
  showView("dashboard");
});

async function openProject(id) {
  if (state.unsubProject) state.unsubProject();
  state.currentProject = null;
  state.chat = [];
  renderChat();

  const ref = doc(db, "projects", id);
  state.unsubProject = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        toast("Project not found", "error");
        showView("dashboard");
        return;
      }
      const data = { id: snap.id, ...snap.data() };
      state.currentProject = data;
      $("projectTitle").textContent = data.name || "Untitled";
      $("projectDescription").textContent = data.description || "";
      $("contextLabel").textContent = data.name || "Project";

      // Only set editor value if user isn't actively editing — avoid clobber
      const editor = $("scriptEditor");
      if (document.activeElement !== editor) {
        editor.value = data.script || "";
      }
    },
    (err) => toast(err.message || "Failed to load project", "error"),
  );

  // Reset tabs to script
  switchTab("script");
  showView("project");
}

function closeProject() {
  if (state.unsubProject) state.unsubProject();
  state.unsubProject = null;
  state.currentProject = null;
  // Reset timer
  stopTimer(false);
  state.timer.stage = null;
  state.timer.elapsed = 0;
  $("timerDisplay").textContent = "00:00";
  $$(".stage-btn").forEach((b) =>
    b.classList.remove("bg-brand-600", "text-white"),
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function switchTab(name) {
  $$(".tab-btn").forEach((b) => {
    const active = b.dataset.tab === name;
    b.classList.toggle("bg-brand-600", active);
    b.classList.toggle("text-white", active);
    b.classList.toggle("text-slate-300", !active);
  });
  $$(".tab-panel").forEach((p) =>
    p.classList.toggle("hidden", p.id !== `tab-${name}`),
  );
  if (name === "media") loadMedia();
}
$$(".tab-btn").forEach((b) =>
  b.addEventListener("click", () => switchTab(b.dataset.tab)),
);

// ---------------------------------------------------------------------------
// Tab 1: Script editor (auto-save)
// ---------------------------------------------------------------------------
$("scriptEditor").addEventListener("input", () => {
  if (!state.currentProject) return;
  $("saveStatus").textContent = "Saving…";
  if (state.saveTimer) clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(async () => {
    try {
      await updateDoc(doc(db, "projects", state.currentProject.id), {
        script: $("scriptEditor").value,
        updatedAt: serverTimestamp(),
      });
      $("saveStatus").textContent = "Saved";
    } catch (err) {
      $("saveStatus").textContent = "Save failed";
      toast(err.message || "Save failed", "error");
    }
  }, 700);
});

// ---------------------------------------------------------------------------
// Tab 1: AI chat (Gemini, server-proxied)
// ---------------------------------------------------------------------------
function renderChat() {
  const thread = $("chatThread");
  thread.innerHTML = "";
  if (state.chat.length === 0) {
    thread.innerHTML = `
      <div class="text-xs text-slate-500 text-center mt-4">
        Ask for a hook, a 30-second outline, an alt CTA, or a punchier opening line.
      </div>`;
    return;
  }
  for (const m of state.chat) {
    const row = document.createElement("div");
    row.className = `chat-row ${m.role === "user" ? "user" : "ai"}`;
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${m.role === "user" ? "chat-user" : "chat-ai"}`;
    bubble.textContent = m.content;
    row.appendChild(bubble);
    thread.appendChild(row);
  }
  thread.scrollTop = thread.scrollHeight;
}

$("chatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = $("chatInput").value.trim();
  if (!text) return;
  $("chatInput").value = "";

  state.chat.push({ role: "user", content: text });
  renderChat();

  const pending = { role: "model", content: "Thinking…" };
  state.chat.push(pending);
  renderChat();
  $("chatSendBtn").disabled = true;

  try {
    const res = await authedFetch("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: state.chat
          .filter((m) => m !== pending)
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gemini request failed");
    pending.content = data.text || "(no response)";
  } catch (err) {
    pending.content = `⚠️ ${err.message}`;
  } finally {
    renderChat();
    $("chatSendBtn").disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Tab 2: Media (Drive via /api/files)
// ---------------------------------------------------------------------------
$("refreshMediaBtn").addEventListener("click", () => loadMedia(true));
$("uploadBtn").addEventListener("click", () => $("uploadInput").click());
$("uploadInput").addEventListener("change", handleUpload);

async function handleUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const progress = $("uploadProgress");
  progress.classList.remove("hidden");
  progress.textContent = `Uploading "${file.name}"…`;

  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await authedFetch("/api/files", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    progress.textContent = `Uploaded "${data.file?.name || file.name}" successfully.`;
    setTimeout(() => progress.classList.add("hidden"), 3000);
    await loadMedia(true);
  } catch (err) {
    progress.textContent = `⚠️ ${err.message}`;
  } finally {
    e.target.value = "";
  }
}

async function downloadFile(id, name) {
  try {
    const res = await authedFetch(`/api/files/${encodeURIComponent(id)}/download`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Download failed");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(err.message);
  }
}

async function deleteFile(id, name) {
  if (!confirm(`Delete "${name}" permanently from Drive?`)) return;
  try {
    const res = await authedFetch(`/api/files/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Delete failed");
    await loadMedia(true);
  } catch (err) {
    alert(err.message);
  }
}

async function loadMedia(force = false) {
  const grid = $("mediaGrid");
  if (!force && grid.dataset.loaded === "1") return;

  $("mediaLoading").classList.remove("hidden");
  $("mediaError").classList.add("hidden");
  grid.innerHTML = "";

  try {
    const res = await authedFetch("/api/files");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load files");

    grid.dataset.loaded = "1";
    if (!data.files || data.files.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-sm text-slate-400 text-center py-8">No files in this folder.</div>`;
      return;
    }

    for (const f of data.files) {
      const card = document.createElement("div");
      card.className =
        "card-hover rounded-xl border border-ink-700 bg-ink-900/60 overflow-hidden flex flex-col";

      const isImage = (f.mimeType || "").startsWith("image/");
      const thumb =
        f.thumbnailLink ||
        (isImage ? f.webContentLink : "") ||
        f.iconLink ||
        "";

      const safeName = escapeHtml(f.name || "Untitled");
      const safeId = escapeHtml(f.id || "");
      const view = f.webViewLink || "#";

      card.innerHTML = `
        <a href="${escapeHtml(view)}" target="_blank" rel="noreferrer noopener" class="block">
          <div class="aspect-video bg-ink-800 grid place-items-center overflow-hidden">
            ${
              thumb
                ? `<img src="${escapeHtml(thumb)}" alt="" class="w-full h-full object-cover" referrerpolicy="no-referrer" />`
                : `<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`
            }
          </div>
        </a>
        <div class="p-2.5 flex-1 flex flex-col gap-2">
          <div>
            <div class="text-xs font-medium truncate">${safeName}</div>
            <div class="text-[10px] text-slate-500 truncate">${escapeHtml((f.mimeType || "").split("/").pop())}</div>
          </div>
          <div class="flex items-center gap-1 mt-auto">
            <button data-action="download" data-id="${safeId}" data-name="${safeName}"
              class="flex-1 text-[11px] px-2 py-1 rounded-md border border-ink-600 hover:border-brand-500 hover:text-brand-400 transition">
              Download
            </button>
            <button data-action="delete" data-id="${safeId}" data-name="${safeName}"
              class="text-[11px] px-2 py-1 rounded-md border border-ink-600 hover:border-rose-500 hover:text-rose-400 transition">
              Delete
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    }

    grid.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const id = btn.getAttribute("data-id");
        const name = btn.getAttribute("data-name");
        if (btn.getAttribute("data-action") === "download") {
          downloadFile(id, name);
        } else {
          deleteFile(id, name);
        }
      });
    });
  } catch (err) {
    $("mediaError").textContent = err.message;
    $("mediaError").classList.remove("hidden");
  } finally {
    $("mediaLoading").classList.add("hidden");
  }
}

// ---------------------------------------------------------------------------
// Tab 3: YouTube analytics
// ---------------------------------------------------------------------------
$("ytForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const channelId = $("ytChannelId").value.trim();
  const handle = $("ytHandle").value.trim();
  state.yt = { channelId, username: handle };

  const grid = $("ytGrid");
  grid.innerHTML = "";
  $("ytError").classList.add("hidden");
  $("ytLoading").classList.remove("hidden");

  try {
    const params = new URLSearchParams();
    if (channelId) params.set("channelId", channelId);
    else if (handle) params.set("username", handle.replace(/^@/, ""));

    const res = await authedFetch(`/api/youtube/videos?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load videos");

    if (!data.videos || data.videos.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-sm text-slate-400 text-center py-8">No videos found.</div>`;
      return;
    }

    for (const v of data.videos) {
      const card = document.createElement("a");
      card.href = `https://www.youtube.com/watch?v=${v.id}`;
      card.target = "_blank";
      card.rel = "noreferrer noopener";
      card.className =
        "card-hover block rounded-xl border border-ink-700 bg-ink-900/60 overflow-hidden";
      card.innerHTML = `
        <div class="aspect-video bg-ink-800">
          ${
            v.thumbnail
              ? `<img src="${escapeHtml(v.thumbnail)}" alt="" class="w-full h-full object-cover" referrerpolicy="no-referrer" />`
              : ""
          }
        </div>
        <div class="p-3">
          <div class="text-sm font-semibold leading-snug line-clamp-2">${escapeHtml(v.title || "Untitled")}</div>
          <div class="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
            <span>👁 ${fmt(v.views)} views</span>
            <span>👍 ${fmt(v.likes)} likes</span>
            <span>💬 ${fmt(v.comments)}</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    }
  } catch (err) {
    $("ytError").textContent = err.message;
    $("ytError").classList.remove("hidden");
  } finally {
    $("ytLoading").classList.add("hidden");
  }
});

// ---------------------------------------------------------------------------
// Multi-stage timer
// ---------------------------------------------------------------------------
$$(".stage-btn").forEach((btn) => {
  btn.addEventListener("click", () => setStage(btn.dataset.stage));
});
$("timerToggle").addEventListener("click", toggleTimer);
$("timerStop").addEventListener("click", () => stopTimer(true));

function setStage(stage) {
  if (state.timer.running) {
    toast("Stop the current stage before switching.", "info");
    return;
  }
  state.timer.stage = stage;
  state.timer.elapsed = 0;
  $("timerDisplay").textContent = "00:00";
  $$(".stage-btn").forEach((b) => {
    const active = b.dataset.stage === stage;
    b.classList.toggle("bg-brand-600", active);
    b.classList.toggle("text-white", active);
    b.classList.toggle("text-slate-300", !active);
  });
}

function toggleTimer() {
  if (!state.timer.stage) {
    toast("Pick a stage first (Scripting / Media / Review).", "info");
    return;
  }
  if (state.timer.running) {
    state.timer.elapsed += (Date.now() - state.timer.startedAt) / 1000;
    state.timer.running = false;
    state.timer.startedAt = null;
    clearInterval(state.timer.interval);
    $("timerToggle").textContent = "Start";
  } else {
    state.timer.running = true;
    state.timer.startedAt = Date.now();
    state.timer.interval = setInterval(() => {
      const live =
        state.timer.elapsed +
        (Date.now() - state.timer.startedAt) / 1000;
      $("timerDisplay").textContent = formatDuration(live);
    }, 250);
    $("timerToggle").textContent = "Pause";
  }
}

async function stopTimer(persist) {
  if (state.timer.running) {
    state.timer.elapsed += (Date.now() - state.timer.startedAt) / 1000;
    state.timer.running = false;
    state.timer.startedAt = null;
    clearInterval(state.timer.interval);
    $("timerToggle").textContent = "Start";
  }
  if (!persist) return;
  if (!state.currentProject) return;
  if (state.timer.elapsed < 1) {
    toast("Nothing to log yet.", "info");
    return;
  }
  if (!state.timer.stage) {
    toast("No stage selected.", "info");
    return;
  }
  try {
    await addDoc(collection(db, "timer_logs"), {
      projectId: state.currentProject.id,
      ownerId: state.user.uid,
      stage: state.timer.stage,
      seconds: Math.floor(state.timer.elapsed),
      createdAt: serverTimestamp(),
    });
    toast(
      `Saved ${formatDuration(state.timer.elapsed)} for ${state.timer.stage}`,
      "success",
    );
    state.timer.elapsed = 0;
    $("timerDisplay").textContent = "00:00";
  } catch (err) {
    toast(err.message || "Failed to save log", "error");
  }
}

// ---------------------------------------------------------------------------
// Initial render of empty chat thread
// ---------------------------------------------------------------------------
renderChat();

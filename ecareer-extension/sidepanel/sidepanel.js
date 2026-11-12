import { api, ApiError, disconnect, exchangeCode, getToken } from "../lib/api.js";
import { API_BASE } from "../lib/config.js";
import { classify } from "../lib/sites.js";

const $ = (id) => document.getElementById(id);
const VIEWS = ["loading", "connect", "upgrade", "noresume", "find", "history", "prepared"];
const SUPPORT_EMAIL = "hello@ecareerdesign.net";

// Small DOM builder. Everything from job boards is inserted as text, never as HTML.
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return n;
}
const send = (type, data) =>
  new Promise((resolve, reject) =>
    chrome.runtime.sendMessage({ type, data }, (res) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!res || !res.ok) return reject(new Error((res && res.error) || "Something went wrong."));
      resolve(res.data);
    })
  );
const openTab = (url) => chrome.tabs.create({ url });

let profile = null;
let usage = {};
let current = null; // { job, prepared, tabId }

// ---- view + status plumbing ------------------------------------------------
function show(name) {
  for (const v of VIEWS) $(`view-${v}`).classList.toggle("hidden", v !== name);
  const inApp = name === "find" || name === "history" || name === "prepared";
  $("tabs").classList.toggle("hidden", !inApp);
  $("tab-find").setAttribute("aria-selected", String(name === "find" || name === "prepared"));
  $("tab-history").setAttribute("aria-selected", String(name === "history"));
  $("disconnect").classList.toggle("hidden", !(inApp || name === "upgrade" || name === "noresume"));
  window.scrollTo(0, 0);
}
function status(msg, kind = "info") {
  const s = $("status");
  s.textContent = msg || "";
  s.className = "status" + (msg ? ` ${kind}` : " hidden");
  s.setAttribute("role", kind === "error" ? "alert" : "status");
}
function busy(btn, on, label) {
  if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || "Working…"; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}
function fail(e) {
  if (e instanceof ApiError) {
    if (e.code === "limit_reached") {
      if (usage.matchesLimit && /search/i.test(e.message)) usage.matches = usage.matchesLimit;
      if (usage.preparesLimit && /prepared/i.test(e.message)) usage.prepares = usage.preparesLimit;
      renderUsage();
    }
    if (e.code === "premium_required") { status(""); return show("upgrade"); }
    if (e.code === "unauthorized") { show("connect"); return status(e.message, "error"); }
    return status(e.message, "error");
  }
  console.error(e);
  status((e && e.message) || "Something went wrong. Please try again.", "error");
}

// ---- startup -----------------------------------------------------------------
async function init() {
  show("loading");
  $("retry").classList.add("hidden");
  status("");
  document.querySelectorAll("#view-loading .skeleton").forEach((s) => s.classList.remove("hidden"));
  if (!(await getToken())) return show("connect");
  try {
    profile = await api("/profile");
  } catch (e) {
    if (e instanceof ApiError && e.code === "network") {
      document.querySelectorAll("#view-loading .skeleton").forEach((s) => s.classList.add("hidden"));
      $("retry").classList.remove("hidden");
      return status(e.message, "error");
    }
    return fail(e);
  }
  if (!profile.premium) return show("upgrade");
  if (!profile.hasResume) return show("noresume");
  usage = profile.usage || {};
  $("who").textContent = profile.fullName || "Your profile";
  renderUsage();
  await restoreCache();
  show("find");
}

function renderUsage() {
  const parts = [];
  if (usage.matchesLimit) parts.push(`${Math.max(0, usage.matchesLimit - (usage.matches || 0))} searches left today`);
  if (usage.preparesLimit) parts.push(`${Math.max(0, usage.preparesLimit - (usage.prepares || 0))} applications left`);
  $("usage").textContent = parts.join(" · ");
}

// ---- connect -------------------------------------------------------------------
const codeInput = $("code");
codeInput.addEventListener("input", () => {
  codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 11);
  $("connect").disabled = codeInput.value.replace(/-/g, "").length < 10;
});
codeInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && !$("connect").disabled) $("connect").click(); });
$("connect").addEventListener("click", async () => {
  busy($("connect"), true, "Connecting…");
  try {
    await exchangeCode(codeInput.value);
    codeInput.value = "";
    status("Connected.", "ok");
    await init();
    status("Connected.", "ok");
  } catch (e) {
    busy($("connect"), false);
    status(e.message, "error");
    return;
  }
  busy($("connect"), false);
});
$("open-site").addEventListener("click", () => openTab(API_BASE));
$("see-plans").addEventListener("click", () => openTab(`${API_BASE}/pricing`));
$("open-builder").addEventListener("click", () => openTab(API_BASE));
$("recheck").addEventListener("click", init);
$("recheck2").addEventListener("click", init);
$("retry-btn").addEventListener("click", init);

let disconnectArmed = false;
$("disconnect").addEventListener("click", async () => {
  if (!disconnectArmed) {
    disconnectArmed = true;
    $("disconnect").textContent = "Click again to confirm";
    setTimeout(() => { disconnectArmed = false; $("disconnect").textContent = "Disconnect"; }, 4000);
    return;
  }
  disconnectArmed = false;
  $("disconnect").textContent = "Disconnect";
  await disconnect();
  try { await chrome.storage.session.clear(); } catch {}
  $("matches").textContent = "";
  status("Disconnected from eCareer Design.", "ok");
  show("connect");
});

// ---- tabs ------------------------------------------------------------------------
$("tab-find").addEventListener("click", () => show(current && !$("view-prepared").classList.contains("hidden") ? "prepared" : "find"));
$("tab-history").addEventListener("click", () => { show("history"); loadHistory(); });

// ---- find roles -----------------------------------------------------------------
$("find").addEventListener("click", async () => {
  busy($("find"), true, "Searching…");
  status("Searching USAJOBS and job boards, then ranking roles against your resume. About 20 seconds.");
  try {
    const res = await api("/matches", { method: "POST", body: {} });
    usage = { ...usage, ...(res.usage || {}) };
    renderUsage();
    renderMatches(res.matches || [], res.report || []);
    status("");
    await saveCache(res.matches || [], res.report || []);
  } catch (e) {
    fail(e);
  } finally {
    busy($("find"), false);
  }
});

function reportLine(report) {
  const parts = report.map((r) => (r.error === "not configured" ? null : r.error ? `${r.source} unavailable` : `${r.source} ${r.count}`)).filter(Boolean);
  return parts.length ? `Searched ${parts.join(" · ")}` : "";
}

function scoreBand(score) {
  return score >= 75 ? ["strong", "Strong"] : score >= 55 ? ["good", "Good"] : ["possible", "Possible"];
}

function renderMatches(matches, report) {
  const box = $("matches");
  box.textContent = "";
  if (!matches.length) {
    box.append(
      el("div", { class: "empty" },
        el("b", { text: "No strong matches right now" }),
        "Try again tomorrow, or open a job posting you found yourself and use Score this page.",
        el("div", { class: "small", style: "margin-top:8px", text: reportLine(report) })
      )
    );
    return;
  }
  const line = reportLine(report);
  if (line) box.append(el("p", { class: "muted small", text: `${matches.length} ranked matches. ${line}.` }));
  for (const m of matches) {
    const [band, word] = scoreBand(m.score);
    const sup = m.support || classify(m.url);
    box.append(
      el("article", { class: "match" },
        el("div", { class: "top-line" },
          el("div", {},
            el("div", { class: "title", text: m.title }),
            el("div", { class: "muted small", text: [m.company, m.location, m.source].filter(Boolean).join(" · ") })
          ),
          el("div", { class: `badge ${band}`, "aria-label": `Match ${m.score} out of 100, ${word}` }, el("b", { text: m.score }), el("span", { text: word }))
        ),
        el("div", { class: "why", text: (m.reasons || []).join(" · ") }),
        el("span", { class: `tag tag-${sup.level}`, text: sup.label }),
        el("div", { class: "row" },
          el("button", { class: "btn primary grow", onclick: () => prepare({ title: m.title, company: m.company, url: m.url, text: m.description || "", support: sup }) }, "Prepare application"),
          el("button", { class: "btn", onclick: () => openTab(m.url) }, "Open posting")
        )
      )
    );
  }
}

async function saveCache(matches, report) {
  try { await chrome.storage.session.set({ cache: { matches, report, at: Date.now() } }); } catch {}
}
async function restoreCache() {
  try {
    const { cache } = await chrome.storage.session.get("cache");
    if (cache && Date.now() - cache.at < 60 * 60 * 1000) renderMatches(cache.matches, cache.report);
  } catch {}
}

// ---- score the page the person is on ------------------------------------------------
$("score-page").addEventListener("click", async () => {
  busy($("score-page"), true, "Reading page…");
  status("Reading this page…");
  try {
    const { tabId, job } = await send("extractFromActiveTab");
    if (!job || !job.text || job.text.length < 200) {
      throw new Error("I couldn't find a job description here. Open the full job posting, not a list of results, then try again.");
    }
    await prepare({ ...job, support: classify(job.url) }, { tabId });
  } catch (e) {
    status(e.message, "error");
  } finally {
    busy($("score-page"), false);
  }
});

// ---- prepare ------------------------------------------------------------------------
async function prepare(job, { tabId } = {}) {
  status("Scoring the match and writing your cover letter. About 10 seconds.");
  document.querySelectorAll("#matches .btn").forEach((b) => (b.disabled = true));
  try {
    const prepared = await api("/prepare", { method: "POST", body: { job: { title: job.title, company: job.company, url: job.url, text: job.text } } });
    usage = { ...usage, ...(prepared.usage || {}) };
    renderUsage();
    current = { job, prepared, tabId };
    renderPrepared();
    show("prepared");
    status("");
  } catch (e) {
    fail(e);
  } finally {
    document.querySelectorAll("#matches .btn").forEach((b) => (b.disabled = false));
  }
}

function listBlock(target, heading, items) {
  target.textContent = "";
  if (!items || !items.length) return;
  target.append(el("h3", { text: heading }), el("ul", {}, items.map((t) => el("li", { text: t }))));
}

function renderPrepared() {
  const { job, prepared } = current;
  const [band, word] = scoreBand(prepared.score);
  $("p-title").textContent = job.title || prepared.title || "Role";
  $("p-company").textContent = job.company || prepared.company || "";
  const sc = $("p-score");
  sc.className = `score ${band}`;
  sc.textContent = prepared.score;
  sc.setAttribute("aria-label", `Match ${prepared.score} out of 100, ${word}`);
  const sup = job.support || classify(job.url);
  const tag = $("p-tag");
  tag.className = `tag tag-${sup.level}`;
  tag.textContent = sup.label;
  listBlock($("p-strengths"), "Where you fit", prepared.strengths);
  listBlock($("p-gaps"), "Gaps to be ready for", prepared.gaps);
  $("p-cover").value = prepared.coverLetter || "";
  const manual = sup.level === "manual";
  $("p-fill").classList.toggle("hidden", manual);
  $("p-open").classList.toggle("hidden", !manual);
  $("p-note").textContent = manual
    ? "This site can't be filled automatically. Download your resume, copy the cover letter, then apply on the site yourself."
    : "Filling never submits. A review banner appears on the page, and nothing is sent until you approve it there.";
}

$("p-back").addEventListener("click", () => { status(""); show("find"); });
$("p-open").addEventListener("click", () => current && current.job.url && openTab(current.job.url));

$("p-fill").addEventListener("click", async () => {
  if (!current) return;
  busy($("p-fill"), true, "Filling…");
  status("Opening the application and filling it in…");
  try {
    const { prepared, job, tabId } = current;
    const result = await send("fillApplication", {
      tabId,
      url: job.url,
      payload: { applicationId: prepared.applicationId, profile: profile.applicant, coverLetter: $("p-cover").value },
    });
    const n = result.needsAnswer ? result.needsAnswer.length : 0;
    status(`Filled ${result.filled} field${result.filled === 1 ? "" : "s"}${n ? `; ${n} need your answer` : ""}. Review the banner on the page and approve there when you're ready.`, "ok");
  } catch (e) {
    status(e.message, "error");
  } finally {
    busy($("p-fill"), false);
  }
});

$("p-download").addEventListener("click", async () => {
  if (!current) return;
  busy($("p-download"), true, "Preparing…");
  try {
    const res = await api(`/applications/${encodeURIComponent(current.prepared.applicationId)}/resume`, { raw: true });
    const url = URL.createObjectURL(await res.blob());
    const a = el("a", { href: url, download: "tailored-resume.pdf" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    status("Resume downloaded.", "ok");
  } catch (e) {
    fail(e);
  } finally {
    busy($("p-download"), false);
  }
});

$("p-copy").addEventListener("click", async () => {
  const text = $("p-cover").value;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    $("p-cover").select();
    document.execCommand("copy");
  }
  status("Cover letter copied.", "ok");
});

// ---- history ------------------------------------------------------------------------
const STATUS_LABEL = { prepared: ["Prepared", "prepared"], dismissed: ["Dismissed", ""], submitted_by_user_approval: ["You approved", "sent"] };

async function loadHistory() {
  const box = $("history");
  box.textContent = "";
  box.append(el("div", { class: "skeleton", style: "height:60px" }));
  try {
    const { applications } = await api("/applications");
    box.textContent = "";
    if (!applications.length) {
      box.append(el("div", { class: "empty" }, el("b", { text: "Nothing here yet" }), "Applications you prepare will show up here."));
      return;
    }
    for (const a of applications) {
      const [label, cls] = STATUS_LABEL[a.status] || [a.status, ""];
      box.append(
        el("div", { class: "hist" },
          el("div", {},
            el("div", { class: "title", text: a.job_title || "Untitled role" }),
            el("div", { class: "muted small", text: [a.company, new Date(a.created_at).toLocaleDateString()].filter(Boolean).join(" · ") }),
            el("span", { class: `chip ${cls}`, text: label })
          ),
          el("div", { class: "row" },
            a.score != null ? el("b", { text: a.score }) : null,
            a.url ? el("button", { class: "link", onclick: () => openTab(a.url) }, "Open") : null
          )
        )
      );
    }
  } catch (e) {
    box.textContent = "";
    fail(e);
  }
}

// ---- footer ---------------------------------------------------------------------------
$("ver").textContent = `v${chrome.runtime.getManifest().version}`;
$("link-privacy").addEventListener("click", (e) => { e.preventDefault(); openTab(`${API_BASE}/privacy`); });
$("link-help").addEventListener("click", (e) => { e.preventDefault(); openTab(`mailto:${SUPPORT_EMAIL}`); });
if (/localhost|127\.0\.0\.1/.test(API_BASE)) $("devbadge").classList.remove("hidden");

init();

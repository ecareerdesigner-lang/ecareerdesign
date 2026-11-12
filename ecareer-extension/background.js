import { api, bufferToBase64, disconnect } from "./lib/api.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

// ---- helpers ---------------------------------------------------------------

function waitForTabComplete(tabId, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Timed out waiting for the job page to load."));
    }, timeoutMs);
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function ensureInjected(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    files: ["content/adapters.js", "content/content.js"],
  });
}

async function hasOriginAccess(url) {
  const origin = new URL(url).origin + "/*";
  return chrome.permissions.contains({ origins: [origin] });
}

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await ensureInjected(tabId);
    return chrome.tabs.sendMessage(tabId, message);
  }
}

async function fetchResumeFile(applicationId) {
  const res = await api(`/applications/${encodeURIComponent(applicationId)}/resume`, { raw: true });
  const buf = await res.arrayBuffer();
  const type = res.headers.get("content-type") || "application/pdf";
  const cd = res.headers.get("content-disposition") || "";
  const m = /filename="?([^";]+)"?/i.exec(cd);
  return { name: m ? m[1] : "resume.pdf", type, base64: bufferToBase64(buf) };
}

// ---- message router --------------------------------------------------------

const handlers = {
  // Side panel asks: extract job text from the active tab
  async extractFromActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:/.test(tab.url || "")) throw new Error("Open a job posting first.");
    if (!(await hasOriginAccess(tab.url))) {
      const ok = await chrome.permissions.request({ origins: [new URL(tab.url).origin + "/*"] });
      if (!ok) throw new Error("Permission to read this site was not granted.");
    }
    const job = await sendToTab(tab.id, { type: "EXTRACT_JOB" });
    return { tabId: tab.id, job };
  },

  // Side panel asks: open the job URL (or use the current tab) and fill it
  async fillApplication({ tabId, url, payload }) {
    let targetId = tabId;
    if (!targetId) {
      const tab = await chrome.tabs.create({ url, active: true });
      targetId = tab.id;
      await waitForTabComplete(targetId);
    }
    const tab = await chrome.tabs.get(targetId);
    if (!(await hasOriginAccess(tab.url))) {
      const ok = await chrome.permissions.request({ origins: [new URL(tab.url).origin + "/*"] });
      if (!ok) throw new Error("Permission to fill this site was not granted.");
    }
    let resumeFile = null;
    if (payload.applicationId) {
      try {
        resumeFile = await fetchResumeFile(payload.applicationId);
      } catch (e) {
        resumeFile = null; // fill the rest; the banner will say the resume needs attaching
      }
    }
    return sendToTab(targetId, { type: "FILL", payload: { ...payload, resumeFile } });
  },

  // Content script reports the outcome after the user approves/submits
  async logOutcome({ applicationId, status, url, unanswered }) {
    if (!applicationId) return { ok: true };
    return api("/applications", {
      method: "POST",
      body: { applicationId, status, url, unanswered },
    });
  },

  async disconnect() {
    await disconnect();
    return { ok: true };
  },
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const fn = handlers[msg && msg.type];
  if (!fn) return false;
  fn(msg.data || {})
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
  return true; // async
});

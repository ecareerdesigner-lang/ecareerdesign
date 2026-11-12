import { API_BASE, API_PREFIX } from "./config.js";

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function getToken() {
  const { token } = await chrome.storage.local.get("token");
  return token || null;
}

export async function setToken(token) {
  if (token) await chrome.storage.local.set({ token });
  else await chrome.storage.local.remove("token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = await getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach eCareer Design. Check your internet connection and try again.", 0, "network");
  }
  if (res.status === 401 && auth) {
    await setToken(null);
    throw new ApiError("Your connection ended. Connect again using a new code from eCareer Design.", 401, "unauthorized");
  }
  if (!res.ok) {
    let message = `Something went wrong (${res.status}). Please try again.`;
    let code;
    try {
      const j = await res.json();
      if (j && j.error) message = j.error;
      code = j && j.code;
    } catch {}
    throw new ApiError(message, res.status, code);
  }
  return res;
}

// api(path) -> parsed JSON; api(path, { raw: true }) -> the Response (used for the resume PDF).
export async function api(path, opts = {}) {
  const res = await request(path, opts);
  return opts.raw ? res : res.json();
}

function browserLabel() {
  const ua = navigator.userAgent;
  const os = /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `Chrome on ${os}` : "Chrome";
}

export async function exchangeCode(code) {
  const res = await request("/pair/exchange", { method: "POST", body: { code, label: browserLabel() }, auth: false });
  const j = await res.json();
  await setToken(j.token);
  return j;
}

// Revokes the connection on the server too, so a copied token is useless afterwards.
export async function disconnect() {
  try {
    await request("/disconnect", { method: "POST" });
  } catch {}
  await setToken(null);
}

export function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

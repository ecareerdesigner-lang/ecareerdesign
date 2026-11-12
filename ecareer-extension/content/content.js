// Runs on job application pages. Two jobs:
//  1. EXTRACT_JOB: return the posting text so the side panel can score it.
//  2. FILL: fill the application, then show a review banner. Nothing is submitted
//     until the person clicks "Approve & submit" in that banner.
(() => {
  if (window.__ecdLoaded) return;
  window.__ecdLoaded = true;

  const adapter = window.__ecdAdapters.pick();

  // ---------- small DOM helpers ----------
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

  function labelFor(el) {
    const parts = [];
    if (el.labels && el.labels.length) parts.push(...[...el.labels].map((l) => l.innerText));
    const aria = el.getAttribute("aria-label");
    if (aria) parts.push(aria);
    const lb = el.getAttribute("aria-labelledby");
    if (lb) lb.split(/\s+/).forEach((id) => { const n = document.getElementById(id); if (n) parts.push(n.innerText); });
    if (el.placeholder) parts.push(el.placeholder);
    parts.push(el.name || "", el.id || "", el.getAttribute("autocomplete") || "");
    // nearest wrapper label text
    const wrap = el.closest("label, .field, .form-group, [class*=field], [class*=question]");
    if (wrap && !parts.length) parts.push(wrap.innerText.slice(0, 200));
    else if (wrap) parts.push(wrap.innerText.slice(0, 120));
    return norm(parts.join(" "));
  }

  // Human-readable name for the "Needs your answer" list: the visible label if there is one,
  // otherwise the placeholder or aria-label. Never the internal id/name tokens used for matching.
  function shownLabel(el) {
    const clean = (t) => (t || "").replace(/\s+/g, " ").replace(/\s*\*\s*$/, "").trim();
    let t = el.labels && el.labels.length ? clean([...el.labels].map((l) => l.innerText).join(" ")) : "";
    if (!t) t = clean(el.getAttribute("aria-label")) || clean(el.placeholder);
    if (!t) {
      const wrap = el.closest("label, .field, .form-group, [class*=field], [class*=question]");
      if (wrap) t = clean(wrap.innerText.split("\n")[0]);
    }
    return t.slice(0, 80);
  }

  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    el.focus();
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  // Questions we never answer for the person: legal, demographic, and attestation
  // fields. They are listed in the banner so the person answers them directly.
  const SENSITIVE = /(gender|race|ethnic|veteran|disabilit|sexual orientation|pronoun|authorized to work|work authorization|legally authorized|sponsorship|visa|criminal|convict|felony|salary|compensation|expected pay|date of birth|birth|social security|ssn|citizenship|consent|certif|agree|acknowledg|terms)/;

  // ---------- field mapping ----------
  function rules(profile, coverLetter) {
    const p = profile || {};
    const [first, ...rest] = (p.fullName || "").split(" ");
    const last = p.lastName || rest.join(" ");
    return [
      { re: /first name|given name|fname/, val: p.firstName || first },
      { re: /last name|family name|surname|lname/, val: last },
      { re: /full name|^name$|your name|legal name/, val: p.fullName },
      { re: /e mail|email/, val: p.email },
      { re: /phone|mobile|tel/, val: p.phone },
      { re: /linkedin/, val: p.linkedin },
      { re: /github/, val: p.github },
      { re: /portfolio|website|personal site|url/, val: p.website },
      { re: /street|address line 1|address 1|mailing address|home address/, val: p.street },
      { re: /city|location|where are you based/, val: p.city || p.location },
      { re: /state|province|region/, val: p.state },
      { re: /zip|postal/, val: p.zip },
      { re: /current company|employer|organization/, val: p.currentCompany },
      { re: /current title|job title|current role/, val: p.currentTitle },
      { re: /cover letter|additional information|why .* (role|position|company)|message to/, val: coverLetter, textarea: true },
    ];
  }

  function fillFields(form, payload) {
    const filled = [];
    const needsAnswer = [];
    const ruleset = rules(payload.profile, payload.coverLetter);
    const fields = [...form.querySelectorAll("input, textarea, select")].filter(
      (el) => visible(el) && !["hidden", "submit", "button", "checkbox", "radio", "file", "password"].includes(el.type)
    );

    for (const el of fields) {
      if (el.value && el.value.trim() && el.type !== "tel") continue; // never overwrite what's there
      const label = labelFor(el);
      if (SENSITIVE.test(label)) {
        if (el.required || el.getAttribute("aria-required") === "true") needsAnswer.push(shownLabel(el) || label.slice(0, 80));
        continue;
      }
      const rule = ruleset.find((r) => r.re.test(label) && r.val && (!r.textarea || el.tagName === "TEXTAREA"));
      if (rule) {
        if (el.tagName === "SELECT") continue; // selects are too site-specific; leave for the person
        setValue(el, rule.val);
        filled.push(label.slice(0, 60));
      } else if (el.required || el.getAttribute("aria-required") === "true") {
        needsAnswer.push(shownLabel(el) || "(unlabeled required field)");
      }
    }
    // required checkboxes/radios are never ticked for the person
    form.querySelectorAll("input[type=checkbox][required], input[type=radio][required]").forEach((el) => {
      needsAnswer.push(shownLabel(el) || "(required choice)");
    });
    return { filled, needsAnswer: [...new Set(needsAnswer)] };
  }

  function attachResume(form, resumeFile) {
    const inputs = [...form.querySelectorAll('input[type="file"]')];
    if (!inputs.length || !resumeFile) return false;
    const target =
      inputs.find((i) => /resume|cv/.test(labelFor(i))) ||
      inputs.find((i) => !/cover/.test(labelFor(i))) ||
      inputs[0];
    const bin = atob(resumeFile.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const file = new File([bytes], resumeFile.name || "resume.pdf", { type: resumeFile.type || "application/pdf" });
    const dt = new DataTransfer();
    dt.items.add(file);
    target.files = dt.files;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function hasCaptcha() {
    return !!document.querySelector(
      'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="turnstile"], .g-recaptcha, .h-captcha, [class*=captcha]'
    );
  }

  // ---------- review banner (shadow DOM, so site CSS can't break it) ----------
  function showBanner({ summary, needsAnswer, captcha, onApprove, onDismiss }) {
    document.getElementById("ecd-banner-host")?.remove();
    const host = document.createElement("div");
    host.id = "ecd-banner-host";
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;right:16px;bottom:16px;";
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        .card{font:14px/1.45 system-ui,sans-serif;width:340px;background:#fff;color:#14213d;border:1px solid #d9dee8;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.22);overflow:hidden}
        .hd{background:#f27a1a;color:#fff;padding:10px 14px;font-weight:700}
        .bd{padding:12px 14px}
        ul{margin:6px 0 0 18px;padding:0;max-height:120px;overflow:auto}
        .warn{background:#fff4e5;border:1px solid #f5c37a;border-radius:8px;padding:8px 10px;margin-top:8px}
        .row{display:flex;gap:8px;padding:0 14px 14px}
        button{flex:1;border:0;border-radius:8px;padding:9px 10px;font:600 14px system-ui;cursor:pointer}
        .go{background:#1e5ac8;color:#fff}.go[disabled]{opacity:.45;cursor:not-allowed}
        .no{background:#eef1f6;color:#14213d}
      </style>
      <div class="card">
        <div class="hd">eCareer Design: review before you send</div>
        <div class="bd">
          <div id="sum"></div>
          <div id="need"></div>
          <div id="cap"></div>
          <div id="msg" class="warn" style="display:none"></div>
          <label style="display:flex;gap:8px;margin-top:10px;align-items:flex-start">
            <input type="checkbox" id="ok"> <span>I reviewed every field and attachment on this page.</span>
          </label>
        </div>
        <div class="row"><button class="no" id="no">Dismiss</button><button class="go" id="go" disabled>Approve &amp; submit</button></div>
      </div>`;
    root.getElementById("sum").textContent = summary;
    if (needsAnswer.length) {
      const d = document.createElement("div");
      d.className = "warn";
      d.innerHTML = "<b>Needs your answer:</b>";
      const ul = document.createElement("ul");
      needsAnswer.forEach((n) => { const li = document.createElement("li"); li.textContent = n; ul.appendChild(li); });
      d.appendChild(ul);
      root.getElementById("need").appendChild(d);
    }
    if (captcha) {
      const d = document.createElement("div");
      d.className = "warn";
      d.textContent = "This page has a CAPTCHA. Complete it yourself; this tool never solves or bypasses it.";
      root.getElementById("cap").appendChild(d);
    }
    const ok = root.getElementById("ok");
    const go = root.getElementById("go");
    ok.addEventListener("change", () => (go.disabled = !ok.checked));
    root.getElementById("no").addEventListener("click", () => { host.remove(); onDismiss(); });
    go.addEventListener("click", () => { go.disabled = true; onApprove(host); });
    document.documentElement.appendChild(host);
    return {
      error(text) {
        const m = root.getElementById("msg");
        m.textContent = text;
        m.style.display = "block";
        go.disabled = false;
      },
    };
  }

  // ---------- message handling ----------
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "EXTRACT_JOB") {
      sendResponse({
        title: adapter.jobTitle(),
        company: adapter.company(),
        text: adapter.jobText(),
        url: location.href,
        site: adapter.id,
      });
      return false;
    }

    if (msg.type === "FILL") {
      const payload = msg.payload;
      const form = adapter.form();
      const { filled, needsAnswer } = fillFields(form, payload);
      const attached = attachResume(form, payload.resumeFile);
      if (!attached && form.querySelector('input[type="file"]')) needsAnswer.unshift("Attach your resume (couldn't attach automatically)");
      const captcha = hasCaptcha();

      const banner = showBanner({
        summary: `Filled ${filled.length} field${filled.length === 1 ? "" : "s"}${attached ? " and attached your tailored resume" : ""}. Nothing has been sent.`,
        needsAnswer,
        captcha,
        onDismiss: () =>
          chrome.runtime.sendMessage({ type: "logOutcome", data: { applicationId: payload.applicationId, status: "dismissed", url: location.href, unanswered: needsAnswer } }),
        onApprove: (host) => {
          const btn = adapter.submitButton(form);
          if (!btn) {
            banner.error("Couldn't find the Submit button. Please submit the form yourself.");
            return;
          }
          chrome.runtime.sendMessage({ type: "logOutcome", data: { applicationId: payload.applicationId, status: "submitted_by_user_approval", url: location.href, unanswered: needsAnswer } });
          host.remove();
          btn.click();
        },
      });
      sendResponse({ filled: filled.length, needsAnswer, attached, captcha });
      return false;
    }
    return false;
  });
})();

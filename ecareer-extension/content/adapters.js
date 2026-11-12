// Site adapters: how to find the job text, the form, the submit button, and any
// site-specific selectors. Everything falls back to the generic adapter, which
// works from labels, names, and autocomplete attributes.
(() => {
  if (window.__ecdAdapters) return;

  const text = (el) => (el ? (el.innerText || el.textContent || "").trim() : "");

  const generic = {
    id: "generic",
    matches: () => true,
    jobTitle: () =>
      text(document.querySelector("h1")) || document.title.split(/[|\-–]/)[0].trim(),
    company: () => {
      const og = document.querySelector('meta[property="og:site_name"]');
      return og ? og.content : location.hostname.replace(/^www\./, "");
    },
    jobText: () => {
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((s) => {
          try { return JSON.parse(s.textContent); } catch { return null; }
        })
        .flat()
        .filter(Boolean)
        .find((o) => o && (o["@type"] === "JobPosting" || (o["@graph"] || []).some((g) => g["@type"] === "JobPosting")));
      if (ld) {
        const jp = ld["@type"] === "JobPosting" ? ld : ld["@graph"].find((g) => g["@type"] === "JobPosting");
        const d = document.createElement("div");
        d.innerHTML = jp.description || "";
        return `${jp.title || ""}\n${text(d)}`.trim();
      }
      const main = document.querySelector("main, [role=main], #content, .content, article") || document.body;
      return text(main).slice(0, 15000);
    },
    form: () => {
      const forms = [...document.querySelectorAll("form")].filter((f) => f.querySelector("input,textarea,select"));
      // the form with the most fields is almost always the application
      return forms.sort((a, b) => b.querySelectorAll("input,textarea,select").length - a.querySelectorAll("input,textarea,select").length)[0] || document.body;
    },
    submitButton: (form) => {
      const candidates = [...form.querySelectorAll('button, input[type="submit"]')];
      return (
        candidates.find((b) => b.type === "submit" && /submit|apply|send/i.test(text(b) || b.value)) ||
        candidates.find((b) => /submit application|submit|apply/i.test(text(b) || b.value)) ||
        candidates.find((b) => b.type === "submit") ||
        null
      );
    },
  };

  const greenhouse = {
    ...generic,
    id: "greenhouse",
    matches: () => /greenhouse\.io$/.test(location.hostname),
    jobTitle: () => text(document.querySelector(".app-title, h1.section-header, h1")),
    company: () => text(document.querySelector(".company-name")) || generic.company(),
    form: () => document.querySelector("#application_form, form#application-form, form") || generic.form(),
    submitButton: (form) => form.querySelector('button[type="submit"], input[type="submit"]') || generic.submitButton(form),
  };

  const lever = {
    ...generic,
    id: "lever",
    matches: () => /lever\.co$/.test(location.hostname),
    jobTitle: () => text(document.querySelector(".posting-headline h2, h2")),
    form: () => document.querySelector("form#application-form, .application-form form, form") || generic.form(),
    submitButton: (form) => form.querySelector("#btn-submit, button[type=submit]") || generic.submitButton(form),
  };

  const ashby = {
    ...generic,
    id: "ashby",
    matches: () => /ashbyhq\.com$/.test(location.hostname),
    form: () => document.querySelector("form") || generic.form(),
    submitButton: (form) =>
      [...form.querySelectorAll("button")].find((b) => /submit/i.test(text(b))) || generic.submitButton(form),
  };

  const workday = {
    ...generic,
    id: "workday",
    matches: () => /myworkdayjobs\.com$/.test(location.hostname),
    // Workday is a multi-step wizard that usually needs an account. We fill the
    // visible step only and never create accounts or enter passwords.
    form: () => document.querySelector('[data-automation-id="applyFlowPage"], main') || generic.form(),
    submitButton: (form) =>
      form.querySelector('[data-automation-id="bottom-navigation-next-button"], [data-automation-id="pageFooterNextButton"]') ||
      generic.submitButton(form),
  };

  const all = [greenhouse, lever, ashby, workday, generic];
  window.__ecdAdapters = { pick: () => all.find((a) => a.matches()) || generic };
})();

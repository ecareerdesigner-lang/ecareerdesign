"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, FileText, Lock, Check, RefreshCw, Copy, Download,
  ChevronRight, ChevronDown, Sparkles, AlertCircle, Save,
  ClipboardList, Package, CheckCircle2, Loader2
} from "lucide-react";

const TOKENS = {
  ink: "#16283D",
  inkSoft: "#3C5069",
  paper: "#EEF0EC",
  surface: "#FFFFFF",
  line: "#D7DBD6",
  accent: "#C1440E",
  accentSoft: "#F5DFCF",
  gold: "#B98A2E",
  goldSoft: "#F3E7D1",
  green: "#2F6F4E",
  greenSoft: "#DFEBE3",
  red: "#B23A2E",
  redSoft: "#F6DEDA",
};

const FONTS_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;

const LIBRARY = [
  {
    title: "Manager, Post Office Operations",
    requirements: [
      "Ability to plan, organize, and direct the work of subordinate supervisors and employees engaged in retail, delivery, and customer service operations.",
      "Knowledge of postal policies, procedures, and labor agreements sufficient to resolve operational and staffing issues.",
      "Ability to analyze operational and financial data to identify variances and implement corrective action.",
      "Skill in written and oral communication sufficient to represent the organization with employees, customers, and other stakeholders.",
    ],
  },
  {
    title: "Manager, Operations Program Support",
    requirements: [
      "Ability to develop, coordinate, and evaluate program initiatives that support district or area operational goals.",
      "Knowledge of performance measurement systems and the ability to translate data into actionable recommendations.",
      "Ability to lead cross-functional teams and manage multiple concurrent projects to completion.",
      "Skill in preparing and delivering presentations and written reports to management and stakeholders.",
    ],
  },
  {
    title: "Manager, Address Technology and Innovation",
    requirements: [
      "Knowledge of address management systems and related technologies sufficient to guide product and process improvements.",
      "Ability to manage technical projects from concept through implementation, including coordination with IT and field stakeholders.",
      "Ability to evaluate emerging technologies and assess their applicability to operational needs.",
      "Skill in communicating complex technical concepts to non-technical audiences.",
    ],
  },
];

const INTAKE_FIELDS = [
  { key: "position", label: "Current position, grade/level, years in role", placeholder: "e.g., Manager, Operations Programs Support, EAS-20, 4 years" },
  { key: "projects", label: "3–5 significant projects or initiatives", placeholder: "Name each project and describe it in 1-2 sentences" },
  { key: "tools", label: "Programs, tools, and systems used", placeholder: "e.g., AMS, FDB, DSALS, RADAR/PDAT, Kanban Board reviews, Gemba walks" },
  { key: "outcomes", label: "Notable measurable outcomes", placeholder: "Cost savings, volume handled, efficiency gains, awards" },
  { key: "leadership", label: "Leadership / supervisory scope", placeholder: "Team size, budget authority" },
  { key: "training", label: "Training, certifications, cross-functional or detail assignments", placeholder: "List relevant training and assignments" },
];

const TOTAL_BUDGET = 6000;
const SKILLS_BUDGET = 500;
const STEPS = ["Job & requirements", "Payment", "Background", "Generate", "Export"];

async function callClaude(prompt, maxTokens = 1000) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Generation failed");
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text;
}

function extractionPrompt(rawText) {
  return `You will be given raw text copied from a USPS eCareer job posting. Extract only the distinct Qualifications/Requirements/KSAs as a numbered list. Do not include unrelated posting content (pay grade, location, application instructions). Output strictly as a JSON array of strings, one requirement per item, in the order they appear. Return ONLY the JSON array, no other text, no markdown fences.

Posting text:
${rawText}`;
}

function starPrompt(requirementText, profile, budget) {
  const target = Math.max(150, Math.floor(budget * 0.85));
  return `You are helping a USPS employee draft a response to one job qualification requirement for an internal eCareer application. Using the requirement below and the candidate's background information, write a STAR-format response (Situation, Task, Action, Result) as flowing narrative paragraphs — do NOT include visible "Situation:"/"Task:"/"Action:"/"Result:" subheadings.

Draw only on details actually present in the candidate's background information below. Do not invent specifics (names, numbers, dates) that weren't provided. Use accurate USPS terminology where the candidate has supplied it.

Requirement: ${requirementText}
Candidate background: ${JSON.stringify(profile)}
Target length: aim for about ${target} characters. Do not exceed ${budget} characters under any circumstances — this is a hard limit, not a suggestion. Return only the response text, no preamble.`;
}

function trimToBudget(text, budget) {
  if (!text || text.length <= budget) return { text, trimmed: false };
  let cut = text.slice(0, budget);
  const lastEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (lastEnd > budget * 0.5) {
    cut = cut.slice(0, lastEnd + 1);
  } else {
    const lastSpace = cut.lastIndexOf(" ");
    cut = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
  }
  return { text: cut, trimmed: true };
}

function skillsPrompt(jobTitle, profile, budget) {
  return `Based on the job title "${jobTitle}" and the candidate's background below, write a brief summary (3-5 sentences) of special skills, professional associations, certifications, or affiliations relevant to this role. Only include items grounded in the candidate's actual background — do not fabricate credentials or memberships.

Candidate background: ${JSON.stringify(profile)}
Keep it under ${budget} characters — this is a hard limit. Return only the summary text, no preamble.`;
}

function parseJsonArray(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("no array found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function Stepper({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "4px" }}>
      {STEPS.map((label, i) => {
        const isDone = i < step;
        const isActive = i === step;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  fontWeight: 500,
                  flexShrink: 0,
                  background: isActive ? TOKENS.accent : isDone ? TOKENS.ink : TOKENS.surface,
                  color: isActive || isDone ? "#fff" : TOKENS.inkSoft,
                  border: `1px solid ${isActive ? TOKENS.accent : isDone ? TOKENS.ink : TOKENS.line}`,
                }}
              >
                {isDone ? <Check size={13} /> : i + 1}
              </div>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: isActive ? TOKENS.ink : TOKENS.inkSoft,
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 20, height: 1, background: TOKENS.line, margin: "0 4px" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: TOKENS.surface,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: 4,
        padding: "1.5rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "secondary", disabled, icon, style }) {
  const base = {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    padding: "10px 18px",
    borderRadius: 3,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
    border: "1px solid transparent",
    transition: "background 0.15s, border-color 0.15s",
  };
  const variants = {
    primary: { background: TOKENS.accent, color: "#fff", borderColor: TOKENS.accent },
    secondary: { background: TOKENS.surface, color: TOKENS.ink, borderColor: TOKENS.line },
    ink: { background: TOKENS.ink, color: "#fff", borderColor: TOKENS.ink },
    ghost: { background: "transparent", color: TOKENS.inkSoft, borderColor: "transparent" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {icon}
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: TOKENS.ink, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  color: TOKENS.ink,
  padding: "10px 12px",
  border: `1px solid ${TOKENS.line}`,
  borderRadius: 3,
  background: TOKENS.paper,
  outline: "none",
};

export default function ECareerDesign() {
  const [step, setStep] = useState(0);
  const [jobTitle, setJobTitle] = useState("");
  const [sourceMode, setSourceMode] = useState("library");
  const [rawPosting, setRawPosting] = useState("");
  const [selectedLib, setSelectedLib] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [profile, setProfile] = useState({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [budgets, setBudgets] = useState({});
  const [responses, setResponses] = useState({});
  const [skills, setSkills] = useState({ text: "", generating: false });
  const [genAll, setGenAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ecareerdesign-profile");
      if (raw) setProfile(JSON.parse(raw));
    } catch (e) {
      // no saved profile yet
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  // Restore the in-progress application (job title, requirements) and verify
  // payment if we're being redirected back from Stripe Checkout. A full
  // Checkout redirect reloads the page, so React state has to be rebuilt
  // from localStorage plus the returned session_id.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ecareerdesign-inprogress");
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.jobTitle) setJobTitle(saved.jobTitle);
        if (saved.selectedLib) setSelectedLib(saved.selectedLib);
        if (saved.requirements?.length) {
          setRequirements(saved.requirements);
          setBudgets(evenBudgets(saved.requirements));
        }
      }
    } catch (e) {
      // nothing to restore
    }

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const paidParam = params.get("paid");

    if (paidParam === "1" && sessionId) {
      setVerifyingPayment(true);
      (async () => {
        try {
          const res = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json();
          if (data.paid) {
            setPaid(true);
            setStep(2);
          } else {
            setPaymentError("Payment could not be confirmed. If you were charged, contact support before retrying.");
          }
        } catch (e) {
          setPaymentError("Could not verify payment status.");
        } finally {
          setVerifyingPayment(false);
          window.history.replaceState({}, "", window.location.pathname);
        }
      })();
    } else if (paidParam === "0") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const saveProfile = useCallback((p) => {
    try {
      localStorage.setItem("ecareerdesign-profile", JSON.stringify(p));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1800);
    } catch (e) {
      console.error("Storage error", e);
    }
  }, []);

  const filteredLibrary = LIBRARY.filter((l) =>
    jobTitle.trim() === "" ? true : l.title.toLowerCase().includes(jobTitle.toLowerCase())
  );

  function chooseLibraryEntry(entry) {
    setSelectedLib(entry);
    setRequirements(entry.requirements.map((text, i) => ({ id: `r${i}`, text })));
    setExtractError("");
  }

  async function extractFromPosting() {
    if (!rawPosting.trim()) return;
    setExtracting(true);
    setExtractError("");
    try {
      const text = await callClaude(extractionPrompt(rawPosting), 1000);
      const arr = parseJsonArray(text);
      setRequirements(arr.map((t, i) => ({ id: `r${i}`, text: t })));
    } catch (e) {
      setExtractError("Could not parse requirements from that text. Try pasting just the qualifications section.");
    } finally {
      setExtracting(false);
    }
  }

  function evenBudgets(reqs) {
    const n = reqs.length || 1;
    const per = Math.floor((TOTAL_BUDGET - SKILLS_BUDGET) / n);
    const b = {};
    reqs.forEach((r) => (b[r.id] = per));
    return b;
  }

  function goToPayment() {
    if (requirements.length === 0) return;
    setBudgets(evenBudgets(requirements));
    try {
      localStorage.setItem(
        "ecareerdesign-inprogress",
        JSON.stringify({ jobTitle, selectedLib, requirements })
      );
    } catch (e) {
      // non-fatal, worst case the user re-enters their title after payment
    }
    setStep(1);
  }

  async function startCheckout() {
    setPaying(true);
    setPaymentError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobTitle || selectedLib?.title,
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPaying(false);
        setPaymentError(data.error || "Could not start checkout.");
      }
    } catch (e) {
      setPaying(false);
      setPaymentError("Could not reach the payment server.");
    }
  }

  function goToGenerate() {
    saveProfile(profile);
    setStep(3);
  }

  const totalUsed = Object.values(budgets).reduce((a, b) => a + (Number(b) || 0), 0) + SKILLS_BUDGET;
  const overBudget = totalUsed > TOTAL_BUDGET;

  async function generateOne(req) {
    setResponses((r) => ({ ...r, [req.id]: { ...(r[req.id] || {}), generating: true } }));
    try {
      const budget = budgets[req.id] || 500;
      const text = await callClaude(starPrompt(req.text, profile, budget), 1000);
      const { text: fitted, trimmed } = trimToBudget(text.trim(), budget);
      setResponses((r) => ({
        ...r,
        [req.id]: { text: fitted, generating: false, trimmed },
      }));
    } catch (e) {
      setResponses((r) => ({
        ...r,
        [req.id]: { text: "", generating: false, error: true },
      }));
    }
  }

  async function generateSkills() {
    setSkills({ text: "", generating: true });
    try {
      const text = await callClaude(skillsPrompt(jobTitle || selectedLib?.title || "this position", profile, SKILLS_BUDGET), 600);
      const { text: fitted, trimmed } = trimToBudget(text.trim(), SKILLS_BUDGET);
      setSkills({ text: fitted, generating: false, trimmed });
    } catch (e) {
      setSkills({ text: "", generating: false, error: true });
    }
  }

  async function generateEverything() {
    setGenAll(true);
    for (const req of requirements) {
      await generateOne(req);
    }
    await generateSkills();
    setGenAll(false);
  }

  function updateResponseText(id, text) {
    setResponses((r) => ({ ...r, [id]: { ...r[id], text } }));
  }

  function charCount(id) {
    return (responses[id]?.text || "").length;
  }

  const totalChars = requirements.reduce((sum, r) => sum + charCount(r.id), 0) + (skills.text?.length || 0);

  function copyText(key, text) {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 1500);
  }

  function copyAll() {
    const parts = requirements.map(
      (r, i) => `Requirement ${i + 1}: ${r.text}\n\n${responses[r.id]?.text || ""}`
    );
    parts.push(`Special Skills & Associations:\n\n${skills.text || ""}`);
    copyText("all", parts.join("\n\n---\n\n"));
  }

  function downloadText() {
    const parts = requirements.map(
      (r, i) => `Requirement ${i + 1}: ${r.text}\n\n${responses[r.id]?.text || ""}`
    );
    parts.push(`Special Skills & Associations\n\n${skills.text || ""}`);
    const blob = new Blob([parts.join("\n\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(jobTitle || selectedLib?.title || "eCareerDesign-responses").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allGenerated = requirements.length > 0 && requirements.every((r) => responses[r.id]?.text);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: TOKENS.ink, maxWidth: 880, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <style>{`
        ${FONTS_IMPORT}
        input:focus, textarea:focus { border-color: ${TOKENS.accent} !important; }
        ::placeholder { color: #9AA39B; }
        textarea { font-family: 'Inter', sans-serif; }
      `}</style>

      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 34, margin: 0, letterSpacing: "-0.01em" }}>
            eCareerDesign
          </h1>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, border: `1px solid ${TOKENS.line}`, padding: "2px 8px", borderRadius: 2 }}>
            v1.0 demo
          </span>
        </div>
        <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: "6px 0 0", maxWidth: 620 }}>
          STAR-format response builder for internal USPS eCareer applications.
        </p>
      </div>

      <div style={{ background: TOKENS.goldSoft, border: `1px solid ${TOKENS.gold}`, borderRadius: 4, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <AlertCircle size={16} color={TOKENS.gold} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13, margin: 0, color: "#5C4210", lineHeight: 1.5 }}>
          eCareerDesign is an independent drafting tool, not an official USPS or eCareer product. Review every generated response for accuracy before submitting — you attest to what you enter into eCareer.
        </p>
      </div>

      <Stepper step={step} />

      {step === 0 && (
        <Card>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 4px" }}>Job title and requirements</h2>
          <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
            Search the sample requirement library first. If your title isn't listed, paste the qualifications straight from the posting.
          </p>

          <Field label="Job title">
            <input
              style={inputStyle}
              value={jobTitle}
              onChange={(e) => { setJobTitle(e.target.value); setSelectedLib(null); setRequirements([]); }}
              placeholder="e.g., Manager, Post Office Operations"
            />
          </Field>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Button variant={sourceMode === "library" ? "ink" : "secondary"} icon={<Search size={14} />} onClick={() => setSourceMode("library")}>
              Search library
            </Button>
            <Button variant={sourceMode === "paste" ? "ink" : "secondary"} icon={<FileText size={14} />} onClick={() => setSourceMode("paste")}>
              Paste posting
            </Button>
          </div>

          {sourceMode === "library" && (
            <div>
              {filteredLibrary.length === 0 && (
                <p style={{ fontSize: 13, color: TOKENS.inkSoft }}>No library match. Try "Paste posting" instead.</p>
              )}
              {filteredLibrary.map((entry) => (
                <div
                  key={entry.title}
                  onClick={() => chooseLibraryEntry(entry)}
                  style={{
                    padding: "12px 14px",
                    border: `1px solid ${selectedLib?.title === entry.title ? TOKENS.accent : TOKENS.line}`,
                    background: selectedLib?.title === entry.title ? TOKENS.accentSoft : TOKENS.paper,
                    borderRadius: 3,
                    marginBottom: 8,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{entry.title}</p>
                    <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "2px 0 0" }}>{entry.requirements.length} qualifications on file</p>
                  </div>
                  <ChevronRight size={16} color={TOKENS.inkSoft} />
                </div>
              ))}
              <p style={{ fontSize: 12, color: TOKENS.inkSoft, marginTop: 10 }}>
                Sample entries for this demo. In production, Option B's library is populated and kept current by an admin.
              </p>
            </div>
          )}

          {sourceMode === "paste" && (
            <div>
              <Field label="Paste the Qualifications / Requirements section from the eCareer posting">
                <textarea
                  style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
                  value={rawPosting}
                  onChange={(e) => setRawPosting(e.target.value)}
                  placeholder="Paste the qualifications text here..."
                />
              </Field>
              <Button variant="ink" icon={extracting ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} onClick={extractFromPosting} disabled={extracting || !rawPosting.trim()}>
                {extracting ? "Extracting..." : "Extract requirements"}
              </Button>
              {extractError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>{extractError}</p>}
            </div>
          )}

          {requirements.length > 0 && (
            <div style={{ marginTop: 24, borderTop: `1px solid ${TOKENS.line}`, paddingTop: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 10px" }}>{requirements.length} requirements found</p>
              {requirements.map((r, i) => (
                <div key={r.id} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: TOKENS.inkSoft }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{r.text}</span>
                </div>
              ))}
              <Button variant="primary" style={{ marginTop: 12 }} onClick={goToPayment} icon={<ChevronRight size={14} />}>
                Continue to payment
              </Button>
            </div>
          )}
        </Card>
      )}

      {step === 1 && (
        <Card style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <Package size={32} color={TOKENS.accent} style={{ marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, margin: "0 0 6px" }}>Unlock this application</h2>
          <p style={{ fontSize: 14, color: TOKENS.inkSoft, maxWidth: 420, margin: "0 auto 24px" }}>
            A flat $25 fee unlocks unlimited generation, editing, and regeneration for
            {" "}{jobTitle || selectedLib?.title || "this job title"} — this application only.
          </p>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 600, marginBottom: 24 }}>$25</div>
          {verifyingPayment ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: TOKENS.inkSoft }}>
              <Loader2 size={16} className="spin" /> Confirming your payment...
            </div>
          ) : !paid ? (
            <Button variant="primary" onClick={startCheckout} disabled={paying} icon={paying ? <Loader2 size={14} className="spin" /> : <Lock size={14} />}>
              {paying ? "Redirecting to checkout..." : "Pay $25 to continue"}
            </Button>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: TOKENS.green, fontWeight: 500 }}>
              <CheckCircle2 size={18} /> Payment confirmed
            </div>
          )}
          {paymentError && (
            <p style={{ fontSize: 13, color: TOKENS.red, marginTop: 14 }}>{paymentError}</p>
          )}
          <p style={{ fontSize: 12, color: TOKENS.inkSoft, marginTop: 18 }}>
            Payment is processed securely by Stripe. You'll be redirected to Stripe's checkout page and back here once it's complete.
          </p>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 4px" }}>Background profile</h2>
              <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
                This is saved to your profile and reused for future job title applications.
              </p>
            </div>
            {profileSaved && <span style={{ fontSize: 12, color: TOKENS.green, display: "flex", alignItems: "center", gap: 4 }}><Check size={13} /> Saved</span>}
          </div>

          {INTAKE_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <textarea
                style={{ ...inputStyle, minHeight: 64, resize: "vertical" }}
                value={profile[f.key] || ""}
                onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            </Field>
          ))}

          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" icon={<Save size={14} />} onClick={() => saveProfile(profile)}>
              Save profile
            </Button>
            <Button variant="primary" icon={<ChevronRight size={14} />} onClick={goToGenerate}>
              Continue to generation
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 4px" }}>Character budget</h2>
                <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
                  Adjust per-requirement targets. Total cap is 6,000 characters, including a {SKILLS_BUDGET.toLocaleString()}-character reserve for the skills summary below.
                </p>
              </div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 20,
                fontVariantNumeric: "tabular-nums",
                border: `1px solid ${overBudget ? TOKENS.red : TOKENS.ink}`,
                background: overBudget ? TOKENS.redSoft : TOKENS.ink,
                color: overBudget ? TOKENS.red : "#fff",
                padding: "8px 14px",
                borderRadius: 3,
                letterSpacing: "0.02em",
              }}>
                {totalChars.toLocaleString()} / {TOTAL_BUDGET.toLocaleString()}
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {requirements.map((r, i) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontSize: 13, flex: 1, color: TOKENS.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.text}</span>
                  <input
                    type="number"
                    value={budgets[r.id] || 0}
                    onChange={(e) => setBudgets((b) => ({ ...b, [r.id]: Number(e.target.value) }))}
                    style={{ ...inputStyle, width: 90, textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}
                  />
                </div>
              ))}
            </div>
            {overBudget && (
              <p style={{ color: TOKENS.red, fontSize: 12, marginTop: 10 }}>Allocated budget exceeds the 6,000 character cap. Reduce one or more targets.</p>
            )}
            <div style={{ marginTop: 16 }}>
              <Button variant="primary" icon={genAll ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} onClick={generateEverything} disabled={genAll}>
                {genAll ? "Generating..." : "Generate all responses"}
              </Button>
            </div>
          </Card>

          {requirements.map((r, i) => {
            const resp = responses[r.id];
            return (
              <Card key={r.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.accent, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: TOKENS.ink }}>{r.text}</p>
                  </div>
                </div>

                {resp?.generating ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                    <Loader2 size={14} className="spin" /> Drafting response...
                  </div>
                ) : resp?.text ? (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      style={{ ...inputStyle, minHeight: 120, resize: "vertical", background: "#fff" }}
                      value={resp.text}
                      onChange={(e) => updateResponseText(r.id, e.target.value)}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                        color: charCount(r.id) > (budgets[r.id] || TOTAL_BUDGET) ? TOKENS.red : TOKENS.inkSoft,
                      }}>
                        {charCount(r.id).toLocaleString()} / {(budgets[r.id] || 0).toLocaleString()} chars
                        {resp.trimmed && <span style={{ color: TOKENS.gold, marginLeft: 8 }}>· trimmed to fit budget</span>}
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="ghost" icon={<RefreshCw size={13} />} onClick={() => generateOne(r)}>Regenerate</Button>
                        <Button variant="ghost" icon={copiedKey === r.id ? <Check size={13} /> : <Copy size={13} />} onClick={() => copyText(r.id, resp.text)}>
                          {copiedKey === r.id ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <Button variant="secondary" icon={<Sparkles size={13} />} onClick={() => generateOne(r)}>Generate response</Button>
                  </div>
                )}
              </Card>
            );
          })}

          <Card style={{ marginBottom: 16, borderColor: TOKENS.gold }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, margin: 0 }}>Special skills and associations</h3>
              {!skills.text && !skills.generating && (
                <Button variant="secondary" icon={<Sparkles size={13} />} onClick={generateSkills}>Generate</Button>
              )}
            </div>
            {skills.generating ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                <Loader2 size={14} className="spin" /> Writing summary...
              </div>
            ) : skills.text ? (
              <div style={{ marginTop: 12 }}>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical", background: "#fff" }}
                  value={skills.text}
                  onChange={(e) => setSkills((s) => ({ ...s, text: e.target.value }))}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    color: skills.text.length > SKILLS_BUDGET ? TOKENS.red : TOKENS.inkSoft,
                  }}>
                    {skills.text.length.toLocaleString()} / {SKILLS_BUDGET.toLocaleString()} chars
                    {skills.trimmed && <span style={{ color: TOKENS.gold, marginLeft: 8 }}>· trimmed to fit budget</span>}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="ghost" icon={<RefreshCw size={13} />} onClick={generateSkills}>Regenerate</Button>
                    <Button variant="ghost" icon={copiedKey === "skills" ? <Check size={13} /> : <Copy size={13} />} onClick={() => copyText("skills", skills.text)}>
                      {copiedKey === "skills" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          <div style={{ textAlign: "right" }}>
            <Button variant="primary" icon={<ChevronRight size={14} />} onClick={() => setStep(4)} disabled={!allGenerated}>
              Continue to export
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <Card>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 4px" }}>Export</h2>
          <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
            Copy responses directly into eCareer's web form, or download everything as text to paste into Word.
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <Button variant="primary" icon={copiedKey === "all" ? <Check size={14} /> : <Copy size={14} />} onClick={copyAll}>
              {copiedKey === "all" ? "Copied all" : "Copy all"}
            </Button>
            <Button variant="secondary" icon={<Download size={14} />} onClick={downloadText}>
              Download as text
            </Button>
          </div>

          <div style={{ borderTop: `1px solid ${TOKENS.line}`, paddingTop: 16 }}>
            {requirements.map((r, i) => (
              <div key={r.id} style={{ marginBottom: 18 }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.accent, margin: "0 0 4px" }}>
                  Requirement {i + 1} — {charCount(r.id).toLocaleString()} chars
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: TOKENS.ink }}>{responses[r.id]?.text}</p>
              </div>
            ))}
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.gold, margin: "0 0 4px" }}>
                Special skills and associations
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: TOKENS.ink }}>{skills.text}</p>
            </div>
          </div>

          <p style={{ fontSize: 12, color: TOKENS.inkSoft, marginTop: 20, borderTop: `1px solid ${TOKENS.line}`, paddingTop: 16 }}>
            This demo exports plain text. The production build generates a formatted .docx with flowing narrative paragraphs (no visible STAR subheadings), matching the build spec's export requirement — that step runs server-side using the docx library.
          </p>
        </Card>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

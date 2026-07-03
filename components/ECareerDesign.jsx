"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search, FileText, Check, RefreshCw, Copy, Download,
  ChevronRight, Sparkles, AlertCircle, Save, Plus, Trash2,
  Loader2, Briefcase, GraduationCap, Award
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
  red: "#B23A2E",
  redSoft: "#F6DEDA",
};

const FONTS_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;

const LIBRARY = [
  {
    title: "Management and Program Analyst",
    requirements: [
      "Ability to analyze and evaluate program operations, identify deficiencies, and recommend improvements to meet organizational goals.",
      "Knowledge of federal budget formulation, execution, and performance measurement sufficient to support program planning.",
      "Ability to communicate findings and recommendations clearly in written reports and oral briefings to senior leadership.",
      "Skill in coordinating with multiple stakeholders to implement process improvements across a large organization.",
    ],
  },
  {
    title: "IT Specialist (INFOSEC)",
    requirements: [
      "Knowledge of information security principles and practices sufficient to assess and mitigate risks to information systems.",
      "Ability to develop, implement, and enforce security policies and procedures in accordance with federal guidelines.",
      "Skill in incident response, including identifying, containing, and reporting security incidents.",
      "Ability to communicate technical security concepts to non-technical stakeholders and leadership.",
    ],
  },
  {
    title: "Human Resources Specialist (Recruitment and Placement)",
    requirements: [
      "Knowledge of federal hiring authorities, classification standards, and recruitment strategies.",
      "Ability to advise management on staffing plans and workforce needs.",
      "Skill in evaluating applicant qualifications against position requirements.",
      "Ability to communicate effectively with applicants, hiring managers, and HR staff throughout the hiring process.",
    ],
  },
];

const TOTAL_BUDGET = 6000;   // Summary of Accomplishments (requirement responses), combined
const SKILLS_BUDGET = 2000;  // Special Skills & Associations, independent cap
const WORK_EXP_BUDGET = 1500; // Each work experience description, independent cap per entry
const STEPS = ["Job & requirements", "Background", "Generate", "Export"];

let idCounter = 0;
function newId(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

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

function extractionPrompt(rawText) {
  return `You will be given raw text copied from a federal government job posting. Extract only the distinct Qualifications/Requirements/KSAs as a numbered list. Do not include unrelated posting content (pay grade, location, application instructions). Output strictly as a JSON array of strings, one requirement per item, in the order they appear. Return ONLY the JSON array, no other text, no markdown fences.

Posting text:
${rawText}`;
}

function starPrompt(requirementText, background, budget) {
  const target = Math.max(150, Math.floor(budget * 0.85));
  return `You are helping a federal government job applicant draft one entry of a "Summary of Accomplishments" response for a federal job application, addressing a single qualification requirement. Write a STAR-format response (Situation, Task, Action, Result) as flowing narrative paragraphs — do NOT include visible "Situation:"/"Task:"/"Action:"/"Result:" subheadings.

Draw only on details actually present in the candidate's background information below (work experience, education, training). Do not invent specifics (names, numbers, dates) that weren't provided. Use accurate terminology from the candidate's field where the candidate has supplied it.

Requirement: ${requirementText}
Candidate background: ${JSON.stringify(background)}
Target length: aim for about ${target} characters. Do not exceed ${budget} characters under any circumstances — this is a hard limit. Return only the response text, no preamble.`;
}

function skillsPrompt(jobTitle, background, budget) {
  const target = Math.max(150, Math.floor(budget * 0.85));
  return `Based on the job title "${jobTitle}" and the candidate's background below, write a "Special Skills & Associations" summary for a federal job application — special skills, professional associations, certifications, or affiliations relevant to this role. Only include items grounded in the candidate's actual background — do not fabricate credentials or memberships.

Candidate background: ${JSON.stringify(background)}
Target length: aim for about ${target} characters. Do not exceed ${budget} characters under any circumstances — this is a hard limit. Return only the summary text, no preamble.`;
}

function workExpandPrompt(entry, jobTitle, requirements) {
  const dates = `${entry.startDate || "unspecified"} to ${entry.current ? "Present" : (entry.endDate || "unspecified")}`;
  const reqList = (requirements || []).map((r) => r.text).join(" | ");
  return `Expand the candidate's basic notes below into a polished, professional "Work Experience" description for a federal job application. Draw only on the facts the candidate provided — do not invent employers, numbers, programs, or specifics that aren't present. Where genuinely relevant, you may emphasize aspects that connect to the target position's requirements listed below, without fabricating experience the candidate didn't describe.

Position title: ${entry.positionTitle || "unspecified"}
Position type: ${entry.postalType}
Dates: ${dates}
Candidate's basic notes: ${entry.basicDescription}

Target position being applied for: ${jobTitle || "unspecified"}
Target position requirements (context only, do not copy verbatim): ${reqList || "none provided"}

Do not exceed ${WORK_EXP_BUDGET} characters under any circumstances — this is a hard limit. Return only the description text, no preamble.`;
}

function trainingExtractionPrompt(rawText) {
  return `You will be given a raw pasted training record for a federal government employee. Identify training completed within roughly the last 15 years that would be worth including on a job application. For each relevant item extract: start date, end date (same as start date if it was a single day), facility or provider name, and the course/training title. Output strictly as a JSON array of objects with keys "startDate", "endDate", "facility", "course", ordered by start date descending (most recent first). Return ONLY the JSON array, no other text, no markdown fences.

Training record text:
${rawText}`;
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
                  width: 26, height: 26, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 500, flexShrink: 0,
                  background: isActive ? TOKENS.accent : isDone ? TOKENS.ink : TOKENS.surface,
                  color: isActive || isDone ? "#fff" : TOKENS.inkSoft,
                  border: `1px solid ${isActive ? TOKENS.accent : isDone ? TOKENS.ink : TOKENS.line}`,
                }}
              >
                {isDone ? <Check size={13} /> : i + 1}
              </div>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13,
                color: isActive ? TOKENS.ink : TOKENS.inkSoft,
                fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap",
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: TOKENS.line, margin: "0 4px" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 4, padding: "1.5rem", ...style }}>
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "secondary", disabled, icon, style }) {
  const base = {
    fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, padding: "10px 18px",
    borderRadius: 3, display: "inline-flex", alignItems: "center", gap: 8,
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
    border: "1px solid transparent", transition: "background 0.15s, border-color 0.15s",
  };
  const variants = {
    primary: { background: TOKENS.accent, color: "#fff", borderColor: TOKENS.accent },
    secondary: { background: TOKENS.surface, color: TOKENS.ink, borderColor: TOKENS.line },
    ink: { background: TOKENS.ink, color: "#fff", borderColor: TOKENS.ink },
    ghost: { background: "transparent", color: TOKENS.inkSoft, borderColor: "transparent" },
    dangerGhost: { background: "transparent", color: TOKENS.red, borderColor: "transparent" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {icon}{children}
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
  width: "100%", boxSizing: "border-box", fontFamily: "'Inter', sans-serif", fontSize: 14,
  color: TOKENS.ink, padding: "10px 12px", border: `1px solid ${TOKENS.line}`, borderRadius: 3,
  background: TOKENS.paper, outline: "none",
};
const smallInputStyle = { ...inputStyle, fontSize: 13, padding: "8px 10px" };

function SectionHeading({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      {icon}
      <div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 17, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function CharCounter({ count, budget, trimmed }) {
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: count > budget ? TOKENS.red : TOKENS.inkSoft }}>
      {count.toLocaleString()} / {budget.toLocaleString()} chars
      {trimmed && <span style={{ color: TOKENS.gold, marginLeft: 8 }}>· trimmed to fit budget</span>}
    </span>
  );
}

export default function ECareerDesign() {
  const [step, setStep] = useState(0);
  const [jobTitle, setJobTitle] = useState("");
  const [sourceMode, setSourceMode] = useState("library");
  const [rawPosting, setRawPosting] = useState("");
  const [selectedLib, setSelectedLib] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  const [workExperience, setWorkExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [trainingPasteText, setTrainingPasteText] = useState("");
  const [trainingEntries, setTrainingEntries] = useState([]);
  const [trainingExtracting, setTrainingExtracting] = useState(false);
  const [trainingError, setTrainingError] = useState("");

  const [additionalContext, setAdditionalContext] = useState({
    projects: "", toolsSystems: "", outcomes: "", certifications: "",
  });

  const [profileSaved, setProfileSaved] = useState(false);

  const [budgets, setBudgets] = useState({});
  const [responses, setResponses] = useState({});
  const [skills, setSkills] = useState({ text: "", generating: false });
  const [genAll, setGenAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ecareerdesign-profile");
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.workExperience) setWorkExperience(saved.workExperience);
        if (saved.education) setEducation(saved.education);
        if (saved.trainingEntries) setTrainingEntries(saved.trainingEntries);
        if (saved.trainingPasteText) setTrainingPasteText(saved.trainingPasteText);
        if (saved.additionalContext) setAdditionalContext(saved.additionalContext);
      }
    } catch (e) {
      // no saved profile yet
    }
  }, []);

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
  }, []);

  const saveProfile = useCallback(() => {
    try {
      localStorage.setItem("ecareerdesign-profile", JSON.stringify({
        workExperience, education, trainingEntries, trainingPasteText, additionalContext,
      }));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1800);
    } catch (e) {
      console.error("Storage error", e);
    }
  }, [workExperience, education, trainingEntries, trainingPasteText, additionalContext]);

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
    const per = Math.floor(TOTAL_BUDGET / n);
    const b = {};
    reqs.forEach((r) => (b[r.id] = per));
    return b;
  }

  function goToBackground() {
    if (requirements.length === 0) return;
    setBudgets(evenBudgets(requirements));
    try {
      localStorage.setItem("ecareerdesign-inprogress", JSON.stringify({ jobTitle, selectedLib, requirements }));
    } catch (e) {
      // non-fatal
    }
    setStep(1);
  }

  function goToGenerate() {
    saveProfile();
    setStep(2);
  }

  // ---------- Work Experience ----------
  function addWorkExperience() {
    setWorkExperience((w) => [...w, {
      id: newId("we"), positionTitle: "", postalType: "Federal",
      startDate: "", endDate: "", current: false,
      basicDescription: "", expandedDescription: "", generating: false, trimmed: false,
    }]);
  }
  function updateWorkExperience(id, patch) {
    setWorkExperience((w) => w.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeWorkExperience(id) {
    setWorkExperience((w) => w.filter((e) => e.id !== id));
  }
  async function expandWorkExperience(id) {
    const entry = workExperience.find((e) => e.id === id);
    if (!entry || !entry.basicDescription?.trim()) return;
    updateWorkExperience(id, { generating: true });
    try {
      const text = await callClaude(workExpandPrompt(entry, jobTitle || selectedLib?.title, requirements), 1000);
      const { text: fitted, trimmed } = trimToBudget(text.trim(), WORK_EXP_BUDGET);
      updateWorkExperience(id, { expandedDescription: fitted, generating: false, trimmed });
    } catch (e) {
      updateWorkExperience(id, { generating: false });
    }
  }

  // ---------- Education ----------
  function addEducation() {
    setEducation((ed) => [...ed, {
      id: newId("ed"), institution: "", startDate: "", endDate: "", subject: "", credential: "",
    }]);
  }
  function updateEducation(id, patch) {
    setEducation((ed) => ed.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeEducation(id) {
    setEducation((ed) => ed.filter((e) => e.id !== id));
  }

  // ---------- Training ----------
  async function extractTraining() {
    if (!trainingPasteText.trim()) return;
    setTrainingExtracting(true);
    setTrainingError("");
    try {
      const text = await callClaude(trainingExtractionPrompt(trainingPasteText), 1000);
      const arr = parseJsonArray(text);
      setTrainingEntries(arr.map((t) => ({
        id: newId("tr"),
        startDate: t.startDate || "", endDate: t.endDate || "",
        facility: t.facility || "", course: t.course || "",
      })));
    } catch (e) {
      setTrainingError("Could not parse a training list from that text. You can also add entries manually below.");
    } finally {
      setTrainingExtracting(false);
    }
  }
  function addTrainingRow() {
    setTrainingEntries((t) => [...t, { id: newId("tr"), startDate: "", endDate: "", facility: "", course: "" }]);
  }
  function updateTrainingRow(id, patch) {
    setTrainingEntries((t) => t.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeTrainingRow(id) {
    setTrainingEntries((t) => t.filter((r) => r.id !== id));
  }

  // ---------- Background context for AI prompts ----------
  function buildBackground() {
    return {
      workExperience: workExperience.map((w) => ({
        positionTitle: w.positionTitle,
        type: w.postalType,
        dates: `${w.startDate || "?"} - ${w.current ? "Present" : (w.endDate || "?")}`,
        description: w.expandedDescription || w.basicDescription || "",
      })),
      education: education.map((e) => ({
        institution: e.institution,
        dates: `${e.startDate || "?"} - ${e.endDate || "?"}`,
        subject: e.subject,
        credential: e.credential,
      })),
      training: trainingEntries.map((t) => ({ dates: `${t.startDate} - ${t.endDate}`, facility: t.facility, course: t.course })),
      significantProjectsOrInitiatives: additionalContext.projects,
      programsToolsAndSystemsUsed: additionalContext.toolsSystems,
      notableMeasuredOutcomes: additionalContext.outcomes,
      certificationsCrossFunctionalOrDetailAssignments: additionalContext.certifications,
    };
  }

  // ---------- Requirements / Summary of Accomplishments ----------
  const totalUsed = Object.values(budgets).reduce((a, b) => a + (Number(b) || 0), 0);
  const overBudget = totalUsed > TOTAL_BUDGET;

  async function generateOne(req) {
    setResponses((r) => ({ ...r, [req.id]: { ...(r[req.id] || {}), generating: true } }));
    try {
      const budget = budgets[req.id] || 500;
      const text = await callClaude(starPrompt(req.text, buildBackground(), budget), 1000);
      const { text: fitted, trimmed } = trimToBudget(text.trim(), budget);
      setResponses((r) => ({ ...r, [req.id]: { text: fitted, generating: false, trimmed } }));
    } catch (e) {
      setResponses((r) => ({ ...r, [req.id]: { text: "", generating: false, error: true } }));
    }
  }

  async function generateSkills() {
    setSkills({ text: "", generating: true });
    try {
      const text = await callClaude(skillsPrompt(jobTitle || selectedLib?.title || "this position", buildBackground(), SKILLS_BUDGET), 800);
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
  const totalChars = requirements.reduce((sum, r) => sum + charCount(r.id), 0);

  function copyText(key, text) {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 1500);
  }

  function assembleExportText() {
    const parts = [];
    if (workExperience.length) {
      parts.push("WORK EXPERIENCE\n" + "=".repeat(16));
      workExperience.forEach((w) => {
        const desc = w.expandedDescription || w.basicDescription || "";
        parts.push(
          `${w.positionTitle || "(untitled position)"}\n` +
          `${w.postalType} | ${w.startDate || "?"} - ${w.current ? "Present" : (w.endDate || "?")}\n\n` +
          desc
        );
      });
    }
    if (education.length) {
      parts.push("EDUCATION\n" + "=".repeat(9));
      education.forEach((e) => {
        parts.push(
          `${e.institution || "(institution)"}\n` +
          `${e.startDate || "?"} - ${e.endDate || "?"} | ${e.subject || ""}\n` +
          `${e.credential || ""}`
        );
      });
    }
    if (skills.text) {
      parts.push("SPECIAL SKILLS & ASSOCIATIONS\n" + "=".repeat(29) + "\n\n" + skills.text);
    }
    if (trainingEntries.length) {
      parts.push("TRAINING\n" + "=".repeat(8));
      trainingEntries.forEach((t) => {
        parts.push(`${t.startDate} - ${t.endDate} | ${t.facility} | ${t.course}`);
      });
    }
    if (requirements.length) {
      parts.push("SUMMARY OF ACCOMPLISHMENTS\n" + "=".repeat(26));
      requirements.forEach((r, i) => {
        parts.push(`Requirement ${i + 1}: ${r.text}\n\n${responses[r.id]?.text || ""}`);
      });
    }
    return parts.join("\n\n\n");
  }

  function copyAll() {
    copyText("all", assembleExportText());
  }
  function downloadText() {
    const blob = new Blob([assembleExportText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(jobTitle || selectedLib?.title || "KSA-Assist-export").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allGenerated = requirements.length > 0 && requirements.every((r) => responses[r.id]?.text);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: TOKENS.ink, maxWidth: 880, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <style>{`
        ${FONTS_IMPORT}
        input:focus, textarea:focus, select:focus { border-color: ${TOKENS.accent} !important; }
        ::placeholder { color: #9AA39B; }
        textarea, select { font-family: 'Inter', sans-serif; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 34, margin: 0, letterSpacing: "-0.01em" }}>
            KSA Assist
          </h1>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft, border: `1px solid ${TOKENS.line}`, padding: "2px 8px", borderRadius: 2 }}>
            v1.2
          </span>
        </div>
        <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: "6px 0 0", maxWidth: 620 }}>
          STAR-format response builder for Federal Government Career applications.
        </p>
      </div>

      <div style={{ background: TOKENS.goldSoft, border: `1px solid ${TOKENS.gold}`, borderRadius: 4, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <AlertCircle size={16} color={TOKENS.gold} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13, margin: 0, color: "#5C4210", lineHeight: 1.5 }}>
          KSA Assist is an independent drafting tool, not an official Federal Government or USPS product. Review every generated response for accuracy before submitting — you attest to what you enter into your application profile.
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
                    borderRadius: 3, marginBottom: 8, cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
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
                Sample entries for this demo. In production, this library is populated and kept current by an admin.
              </p>
            </div>
          )}

          {sourceMode === "paste" && (
            <div>
              <Field label="Paste the Qualifications / Requirements section from the job posting">
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
              <Button variant="primary" style={{ marginTop: 12 }} onClick={goToBackground} icon={<ChevronRight size={14} />}>
                Continue to background
              </Button>
            </div>
          )}
        </Card>
      )}

      {step === 1 && (
        <div>
          {/* Work Experience */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeading icon={<Briefcase size={18} color={TOKENS.accent} />} title="Work experience" subtitle="Add each relevant position. Enter basic notes, then let the AI expand them — capped at 1,500 characters each." />
            {workExperience.map((w, i) => (
              <div key={w.id} style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 3, padding: 14, marginBottom: 12, background: TOKENS.paper }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft }}>Position {i + 1}</span>
                  <Button variant="dangerGhost" icon={<Trash2 size={13} />} onClick={() => removeWorkExperience(w.id)}>Remove</Button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
                  <input style={smallInputStyle} placeholder="Position title" value={w.positionTitle} onChange={(e) => updateWorkExperience(w.id, { positionTitle: e.target.value })} />
                  <select style={smallInputStyle} value={w.postalType} onChange={(e) => updateWorkExperience(w.id, { postalType: e.target.value })}>
                    <option>Federal</option>
                    <option>Postal</option>
                    <option>Non-Postal</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <input style={smallInputStyle} placeholder="Start date (MM/DD/YYYY)" value={w.startDate} onChange={(e) => updateWorkExperience(w.id, { startDate: e.target.value })} />
                  <input style={smallInputStyle} placeholder="End date (MM/DD/YYYY)" value={w.endDate} disabled={w.current} onChange={(e) => updateWorkExperience(w.id, { endDate: e.target.value })} />
                  <label style={{ fontSize: 12, color: TOKENS.inkSoft, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={w.current} onChange={(e) => updateWorkExperience(w.id, { current: e.target.checked, endDate: e.target.checked ? "" : w.endDate })} />
                    Currently here
                  </label>
                </div>
                <textarea
                  style={{ ...smallInputStyle, minHeight: 60, resize: "vertical", marginBottom: 8 }}
                  placeholder="Basic notes: what did this role involve? Key duties, tools, outcomes..."
                  value={w.basicDescription}
                  onChange={(e) => updateWorkExperience(w.id, { basicDescription: e.target.value })}
                />
                {w.generating ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: TOKENS.inkSoft, fontSize: 13 }}>
                    <Loader2 size={14} className="spin" /> Expanding...
                  </div>
                ) : w.expandedDescription ? (
                  <div>
                    <textarea
                      style={{ ...smallInputStyle, minHeight: 90, resize: "vertical", background: "#fff" }}
                      value={w.expandedDescription}
                      onChange={(e) => updateWorkExperience(w.id, { expandedDescription: e.target.value })}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <CharCounter count={w.expandedDescription.length} budget={WORK_EXP_BUDGET} trimmed={w.trimmed} />
                      <Button variant="ghost" icon={<RefreshCw size={13} />} onClick={() => expandWorkExperience(w.id)}>Regenerate</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="secondary" icon={<Sparkles size={13} />} onClick={() => expandWorkExperience(w.id)} disabled={!w.basicDescription?.trim()}>
                    Expand with AI
                  </Button>
                )}
              </div>
            ))}
            <Button variant="secondary" icon={<Plus size={14} />} onClick={addWorkExperience}>Add work experience</Button>
          </Card>

          {/* Education */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeading icon={<GraduationCap size={18} color={TOKENS.accent} />} title="Education" subtitle="Secondary and post-secondary education, with dates attended." />
            {education.map((e, i) => (
              <div key={e.id} style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 3, padding: 14, marginBottom: 12, background: TOKENS.paper }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft }}>Education {i + 1}</span>
                  <Button variant="dangerGhost" icon={<Trash2 size={13} />} onClick={() => removeEducation(e.id)}>Remove</Button>
                </div>
                <input style={{ ...smallInputStyle, marginBottom: 10 }} placeholder="School / institution" value={e.institution} onChange={(ev) => updateEducation(e.id, { institution: ev.target.value })} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <input style={smallInputStyle} placeholder="Start date" value={e.startDate} onChange={(ev) => updateEducation(e.id, { startDate: ev.target.value })} />
                  <input style={smallInputStyle} placeholder="End date" value={e.endDate} onChange={(ev) => updateEducation(e.id, { endDate: ev.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input style={smallInputStyle} placeholder="Subject studied" value={e.subject} onChange={(ev) => updateEducation(e.id, { subject: ev.target.value })} />
                  <input style={smallInputStyle} placeholder="Degree / certificate / status" value={e.credential} onChange={(ev) => updateEducation(e.id, { credential: ev.target.value })} />
                </div>
              </div>
            ))}
            <Button variant="secondary" icon={<Plus size={14} />} onClick={addEducation}>Add education</Button>
          </Card>

          {/* Training */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeading icon={<Award size={18} color={TOKENS.accent} />} title="Training" subtitle="Paste a training record and the app will pull out anything relevant from the last ~15 years — or add rows manually." />
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: "vertical", marginBottom: 10 }}
              placeholder="Paste your training record here..."
              value={trainingPasteText}
              onChange={(e) => setTrainingPasteText(e.target.value)}
            />
            <Button variant="ink" icon={trainingExtracting ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />} onClick={extractTraining} disabled={trainingExtracting || !trainingPasteText.trim()}>
              {trainingExtracting ? "Extracting..." : "Extract training from record"}
            </Button>
            {trainingError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>{trainingError}</p>}

            {trainingEntries.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {trainingEntries.map((t) => (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1.6fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <input style={smallInputStyle} placeholder="Start date" value={t.startDate} onChange={(e) => updateTrainingRow(t.id, { startDate: e.target.value })} />
                    <input style={smallInputStyle} placeholder="End date" value={t.endDate} onChange={(e) => updateTrainingRow(t.id, { endDate: e.target.value })} />
                    <input style={smallInputStyle} placeholder="Facility / provider" value={t.facility} onChange={(e) => updateTrainingRow(t.id, { facility: e.target.value })} />
                    <input style={smallInputStyle} placeholder="Course" value={t.course} onChange={(e) => updateTrainingRow(t.id, { course: e.target.value })} />
                    <Button variant="dangerGhost" icon={<Trash2 size={13} />} onClick={() => removeTrainingRow(t.id)} />
                  </div>
                ))}
              </div>
            )}
            <Button variant="secondary" icon={<Plus size={14} />} style={{ marginTop: 8 }} onClick={addTrainingRow}>Add row manually</Button>
          </Card>

          {/* Additional Context */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeading
              icon={<Sparkles size={18} color={TOKENS.accent} />}
              title="Additional context"
              subtitle="Optional, but helps tailor the Summary of Accomplishments and Special Skills responses in the next step."
            />
            <Field label="3–5 significant projects or initiatives">
              <textarea
                style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                placeholder="Name each project and describe it in 1-2 sentences"
                value={additionalContext.projects}
                onChange={(e) => setAdditionalContext((a) => ({ ...a, projects: e.target.value }))}
              />
            </Field>
            <Field label="Programs, tools, and systems used">
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                placeholder="e.g., AMS, FDB, DSALS, RADAR/PDAT, Kanban Board reviews, Gemba walks"
                value={additionalContext.toolsSystems}
                onChange={(e) => setAdditionalContext((a) => ({ ...a, toolsSystems: e.target.value }))}
              />
            </Field>
            <Field label="Notable measured outcomes">
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                placeholder="Cost savings, volume handled, efficiency gains, awards"
                value={additionalContext.outcomes}
                onChange={(e) => setAdditionalContext((a) => ({ ...a, outcomes: e.target.value }))}
              />
            </Field>
            <Field label="Certifications, cross-functional, or detail assignments">
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                placeholder="List relevant certifications and detail/cross-functional assignments"
                value={additionalContext.certifications}
                onChange={(e) => setAdditionalContext((a) => ({ ...a, certifications: e.target.value }))}
              />
            </Field>
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {profileSaved ? (
              <span style={{ fontSize: 12, color: TOKENS.green, display: "flex", alignItems: "center", gap: 4 }}><Check size={13} /> Saved</span>
            ) : <span />}
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" icon={<Save size={14} />} onClick={saveProfile}>Save profile</Button>
              <Button variant="primary" icon={<ChevronRight size={14} />} onClick={goToGenerate}>Continue to generation</Button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 4px" }}>Summary of Accomplishments</h2>
                <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
                  Adjust per-requirement targets. Combined hard cap is 6,000 characters.
                </p>
              </div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontVariantNumeric: "tabular-nums",
                border: `1px solid ${overBudget ? TOKENS.red : TOKENS.ink}`,
                background: overBudget ? TOKENS.redSoft : TOKENS.ink,
                color: overBudget ? TOKENS.red : "#fff",
                padding: "8px 14px", borderRadius: 3, letterSpacing: "0.02em",
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
            {overBudget && <p style={{ color: TOKENS.red, fontSize: 12, marginTop: 10 }}>Allocated budget exceeds the 6,000 character cap. Reduce one or more targets.</p>}
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
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.accent, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: TOKENS.ink }}>{r.text}</p>
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
                      <CharCounter count={charCount(r.id)} budget={budgets[r.id] || 0} trimmed={resp.trimmed} />
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
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, margin: 0 }}>Special Skills & Associations</h3>
              {!skills.text && !skills.generating && (
                <Button variant="secondary" icon={<Sparkles size={13} />} onClick={generateSkills}>Generate</Button>
              )}
            </div>
            <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "4px 0 0" }}>Independent hard cap of {SKILLS_BUDGET.toLocaleString()} characters.</p>
            {skills.generating ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                <Loader2 size={14} className="spin" /> Writing summary...
              </div>
            ) : skills.text ? (
              <div style={{ marginTop: 12 }}>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical", background: "#fff" }}
                  value={skills.text}
                  onChange={(e) => setSkills((s) => ({ ...s, text: e.target.value }))}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <CharCounter count={skills.text.length} budget={SKILLS_BUDGET} trimmed={skills.trimmed} />
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
            <Button variant="primary" icon={<ChevronRight size={14} />} onClick={() => setStep(3)} disabled={!allGenerated}>
              Continue to export
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 4px" }}>Export</h2>
          <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
            Copy sections directly into your agency's application portal, or download everything as text to paste into Word.
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
            {workExperience.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.accent, margin: "0 0 8px", textTransform: "uppercase" }}>Work Experience</p>
                {workExperience.map((w) => (
                  <div key={w.id} style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{w.positionTitle || "(untitled position)"}</p>
                    <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "2px 0 6px" }}>
                      {w.postalType} · {w.startDate || "?"} – {w.current ? "Present" : (w.endDate || "?")}
                    </p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{w.expandedDescription || w.basicDescription}</p>
                  </div>
                ))}
              </div>
            )}

            {education.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.accent, margin: "0 0 8px", textTransform: "uppercase" }}>Education</p>
                {education.map((e) => (
                  <div key={e.id} style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{e.institution || "(institution)"}</p>
                    <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "2px 0 0" }}>
                      {e.startDate || "?"} – {e.endDate || "?"} · {e.subject} · {e.credential}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {skills.text && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.gold, margin: "0 0 8px", textTransform: "uppercase" }}>
                  Special Skills & Associations — {skills.text.length.toLocaleString()} chars
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{skills.text}</p>
              </div>
            )}

            {trainingEntries.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.accent, margin: "0 0 8px", textTransform: "uppercase" }}>Training</p>
                {trainingEntries.map((t) => (
                  <p key={t.id} style={{ fontSize: 13, margin: "0 0 4px" }}>
                    {t.startDate} – {t.endDate} · {t.facility} · {t.course}
                  </p>
                ))}
              </div>
            )}

            {requirements.length > 0 && (
              <div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.accent, margin: "0 0 8px", textTransform: "uppercase" }}>
                  Summary of Accomplishments — {totalChars.toLocaleString()} chars
                </p>
                {requirements.map((r, i) => (
                  <div key={r.id} style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "0 0 4px" }}>
                      Requirement {i + 1} — {charCount(r.id).toLocaleString()} chars
                    </p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{responses[r.id]?.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p style={{ fontSize: 12, color: TOKENS.inkSoft, marginTop: 20, borderTop: `1px solid ${TOKENS.line}`, paddingTop: 16 }}>
            This demo exports plain text. A production build would generate a formatted .docx matching this same structure, using the docx library server-side.
          </p>
        </Card>
      )}
    </div>
  );
}

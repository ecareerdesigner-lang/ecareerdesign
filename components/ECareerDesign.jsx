"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search, FileText, Check, RefreshCw, Copy, Download,
  ChevronRight, ChevronLeft, Sparkles, AlertCircle, Save, Plus, Trash2,
  Loader2, Briefcase, GraduationCap, Award, ExternalLink,
  Mail, MessageSquare, Clock, Star, X
} from "lucide-react";

const TOKENS = {
  ink: "#16283D",
  inkSoft: "#3C5069",
  iconDark: "#0F1D2E",
  paper: "#EEF0EC",
  surface: "#FFFFFF",
  line: "#D7DBD6",
  accent: "#F2660A",
  accentSoft: "#FDE3CC",
  gold: "#B98A2E",
  goldSoft: "#F3E7D1",
  green: "#2F6F4E",
  red: "#B23A2E",
  redSoft: "#F6DEDA",
  shadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px rgba(16,24,40,0.07)",
  shadowHover: "0 2px 4px rgba(16,24,40,0.06), 0 10px 24px rgba(16,24,40,0.12)",
};

const APP_VERSION = "v2.0";

const FONTS_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;

const TOTAL_BUDGET = 6000;   // Summary of Accomplishments (requirement responses), combined
const SKILLS_BUDGET = 2000;  // Special Skills & Associations, independent cap
const WORK_EXP_BUDGET = 1500; // Each work experience description, independent cap per entry
const STEPS_APPLICATION = ["Job & requirements", "Background", "Generate", "Export"];
const STEPS_RESUME = ["Get started", "Background", "Generate", "Export"];
const STEPS_COVERLETTER = ["Job Details", "Background", "Generate", "Export"];
const STEPS_INTERVIEW = ["Setup", "Background", "Mock Interview", "Report"];

const INTERVIEW_TYPES = [
  "General HR Interview", "Behavioral Interview", "STAR Interview", "Technical Interview",
  "Federal Interview", "USPS Interview", "Management Interview", "Executive Interview",
];

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

// Sizes the API's max_tokens generously relative to a character budget, so the
// token limit itself never cuts a response short before our own character-based
// trim gets a chance to run. English text is rarely denser than ~1 token per
// character, so budget characters + a fixed buffer is a safe generous ceiling.
function tokensForBudget(budget) {
  return Math.min(4096, Math.max(300, budget + 300));
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

function resumePrompt(background, contact) {
  return `Write content for a polished, professional resume for a federal government job applicant, based on the candidate's background below. This resume is not targeting any specific posting — write it as a strong general-purpose resume that presents the candidate's full career well.

Output STRICT JSON in exactly this shape, nothing else:
{
  "summary": "2-3 sentence professional summary",
  "skills": ["short skill phrase", "..."],
  "workHistory": [
    { "bullets": ["achievement-oriented bullet, one sentence, no leading dash", "..."] }
  ]
}

Rules:
- "skills" should have 6 to 10 short phrases (2-4 words each), drawn from the candidate's tools, training, and additional context.
- "workHistory" must have exactly one entry per work experience item listed below, IN THE SAME ORDER, each with 3-4 bullet points.
- Every bullet must be grounded in details actually present in the candidate's background — do not invent employers, numbers, dates, or credentials that aren't provided.
- Return ONLY the JSON object. No markdown fences, no commentary.

Candidate name: ${contact.name || "(not provided)"}

Candidate background: ${JSON.stringify(background)}`;
}

function coverLetterPrompt(background, jobTitle, companyName) {
  return `Write the body paragraphs of a professional cover letter for a job application, based on the candidate's background below. Do not include a greeting/salutation or closing signature — only the body paragraphs.

Target job title: ${jobTitle || "the position"}
Target company: ${companyName || "the company"}

Structure: an opening paragraph expressing interest and a hook connecting to the role, one or two middle paragraphs connecting specific background and experience to what the role likely needs, and a closing paragraph reiterating interest and inviting next steps.

Draw only on details actually present in the candidate's background below — do not invent employers, numbers, or credentials that aren't provided.

Candidate background: ${JSON.stringify(background)}

Output STRICT JSON in exactly this shape, nothing else:
{ "bodyParagraphs": ["paragraph 1", "paragraph 2", "paragraph 3"] }

Return ONLY the JSON object. No markdown fences, no commentary.`;
}

function interviewQuestionsPrompt(background, requirements, jobTitle, interviewType) {
  const reqList = (requirements || []).map((r) => r.text).join(" | ");
  return `You are an experienced hiring manager preparing mock interview questions for a candidate applying to "${jobTitle || "this position"}". Interview style: ${interviewType}.

${reqList ? `The job posting's key requirements are: ${reqList}` : "No specific job posting was provided for this session — write general but realistic questions for this type of role and interview style."}

Based on the candidate's background below, generate a realistic interview question set that a hiring manager would actually ask for this exact role and interview style.

Candidate background: ${JSON.stringify(background)}

Output STRICT JSON in exactly this shape:
{
  "openingAnswer": "A customized 'Tell me about yourself' answer draft, grounded in the candidate's actual background, 3-5 sentences",
  "questions": [
    { "category": "Behavioral", "text": "..." },
    { "category": "STAR", "text": "..." },
    { "category": "Resume", "text": "..." },
    { "category": "Job-Specific", "text": "..." },
    { "category": "Tough", "text": "..." }
  ]
}

Include 2-3 questions in each of those five categories (10-12 total, in that order). STAR and Job-Specific questions should directly reference the job requirements listed above when available. Resume questions should reference specifics actually present in the candidate's background (a real gap, transition, achievement, or certification) — never invent a gap or issue that isn't there. Return ONLY the JSON object, no markdown fences, no commentary.`;
}

function answerEvaluationPrompt(question, answerText, background) {
  return `You are an experienced hiring manager evaluating a candidate's mock interview answer, holistically considering structure (STAR where applicable), specificity, confidence, and professionalism.

Question (${question.category}): ${question.text}
Candidate's answer: ${answerText}

Candidate's background, for context only — don't penalize for reasonable details left out: ${JSON.stringify(background)}

Output STRICT JSON in exactly this shape:
{
  "score": <integer 1-10>,
  "feedback": "2-4 sentences of direct, constructive coaching — what worked, what to improve",
  "starRewrite": "If the score is 7 or below, rewrite the answer as a stronger STAR-format response grounded ONLY in facts the candidate actually mentioned — do not invent new facts. If the score is 8 or above, use an empty string here instead.",
  "followUp": "One realistic follow-up question a hiring manager might ask next, based on this specific answer"
}
Return ONLY the JSON object, no markdown fences, no commentary.`;
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
Employer / organization: ${entry.employer || "unspecified"}
Location: ${entry.location || "unspecified"}
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

function parseJsonObject(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no object found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

const RESUME_COLORS = ["#1B3A5C", "#C1440E", "#2F6F4E", "#7A3B3B", "#6B7280", "#B98A2E", "#1E293B", "#0F766E"];

// These job boards don't offer a public search API, but their own search
// pages accept URL parameters directly — so we can deep-link straight into
// pre-filled results without needing any API key or scraping. Indeed,
// LinkedIn, ZipRecruiter, Monster, and SimplyHired use plain text query
// params and are reliable. Glassdoor and Ladders prefer internal location
// IDs we don't have, so those two are best-effort — they'll pre-fill the
// keyword but may not narrow by location as precisely.
function buildJobBoardLinks(title, location) {
  const t = encodeURIComponent(title || "");
  const l = encodeURIComponent(location || "");
  return [
    { name: "Indeed", url: `https://www.indeed.com/jobs?q=${t}&l=${l}` },
    { name: "LinkedIn", url: `https://www.linkedin.com/jobs/search/?keywords=${t}&location=${l}` },
    { name: "ZipRecruiter", url: `https://www.ziprecruiter.com/jobs-search?search=${t}&location=${l}` },
    { name: "Monster", url: `https://www.monster.com/jobs/search?q=${t}&where=${l}` },
    { name: "SimplyHired", url: `https://www.simplyhired.com/search?q=${t}&l=${l}` },
    { name: "Glassdoor", url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${t}&locKeyword=${l}` },
    { name: "Ladders", url: `https://www.theladders.com/jobs/search-jobs?q=${t}&l=${l}` },
  ];
}
const RESUME_TEMPLATES = [
  { id: "sidebar", label: "Sidebar" },
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
];

const COVER_LETTER_TEMPLATES = [
  { id: "pacific", label: "Pacific" },
  { id: "refined", label: "Refined" },
  { id: "contempo", label: "Contempo" },
];

function Stepper({ step, labels }) {
  const totalSegments = 16;
  const filledSegments = Math.max(1, Math.round(((step + 1) / labels.length) * totalSegments));
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 10 }}>
        {labels.map((label, i) => (
          <React.Fragment key={label}>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 14,
              color: i === step ? TOKENS.ink : i < step ? TOKENS.accent : "#9AA3A0",
              fontWeight: i === step ? 600 : 500, whiteSpace: "nowrap",
            }}>
              {label}
            </span>
            {i < labels.length - 1 && <span style={{ color: "#B7BEBB", fontSize: 14 }}>→</span>}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 8, borderRadius: 4,
              background: i < filledSegments ? TOKENS.ink : "repeating-linear-gradient(45deg, #E4E7E3, #E4E7E3 3px, #F4F5F2 3px, #F4F5F2 6px)",
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 13, color: "#9AA3A0", margin: 0 }}>Step {step + 1} of {labels.length}</p>
    </div>
  );
}

function Card({ children, style, interactive, selected, onClick }) {
  return (
    <div
      className={interactive ? "cf-card-interactive" : ""}
      onClick={onClick}
      style={{
        background: TOKENS.surface,
        border: `1px solid ${selected ? TOKENS.accent : TOKENS.line}`,
        borderRadius: 18,
        padding: "1.75rem",
        boxShadow: selected ? TOKENS.shadowHover : TOKENS.shadow,
        cursor: interactive ? "pointer" : "default",
        transition: "box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "secondary", disabled, icon, style }) {
  const base = {
    fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, padding: "10px 18px",
    borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8,
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
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <Button variant="ghost" icon={<ChevronLeft size={14} />} onClick={onClick} style={{ padding: "4px 8px", marginBottom: 14 }}>
      Back
    </Button>
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

// Matches a US Letter page's proportions (8.5" x 11") at a 700px display width,
// so the template always fills a full sheet — colored sidebars run edge to
// edge — instead of shrinking to hug short content.
const PAGE_WIDTH_PX = 700;
const PAGE_HEIGHT_PX = Math.round(PAGE_WIDTH_PX * (11 / 8.5));

const resumePageStyle = {
  width: PAGE_WIDTH_PX, minHeight: PAGE_HEIGHT_PX, maxWidth: "100%", boxSizing: "border-box",
  margin: "0 auto", background: "#fff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
  fontFamily: "'Inter', sans-serif", color: "#1a1a1a", overflow: "hidden",
};

function ResumeSidebarTemplate({ contact, data, color }) {
  return (
    <div style={{ ...resumePageStyle, display: "flex", borderRadius: 4 }}>
      <div style={{ width: "34%", background: color, color: "#fff", padding: "28px 20px" }}>
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, margin: "0 0 4px", lineHeight: 1.2 }}>{contact.name || "Your Name"}</p>
        <div style={{ fontSize: 11, opacity: 0.9, lineHeight: 1.7, marginBottom: 22 }}>
          {contact.email && <p style={{ margin: 0 }}>{contact.email}</p>}
          {contact.phone && <p style={{ margin: 0 }}>{contact.phone}</p>}
          {contact.location && <p style={{ margin: 0 }}>{contact.location}</p>}
        </div>
        {data.skills?.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", opacity: 0.85, margin: "0 0 8px" }}>SKILLS</p>
            {data.skills.map((s, i) => <p key={i} style={{ fontSize: 12, margin: "0 0 5px", opacity: 0.95 }}>{s}</p>)}
          </div>
        )}
        {data.education?.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", opacity: 0.85, margin: "0 0 8px" }}>EDUCATION</p>
            {data.education.map((e, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{[e.credential, e.subject].filter(Boolean).join(": ")}</p>
                <p style={{ fontSize: 11, opacity: 0.85, margin: "2px 0 0" }}>{e.institution}</p>
                <p style={{ fontSize: 11, opacity: 0.85, margin: 0 }}>{e.dates}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: "28px 22px" }}>
        {data.summary && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color, margin: "0 0 8px" }}>PROFESSIONAL SUMMARY</p>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
          </div>
        )}
        {data.workHistory?.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color, margin: "0 0 10px" }}>WORK HISTORY</p>
            {data.workHistory.map((w, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{w.title || "(untitled position)"}</p>
                <p style={{ fontSize: 12, color: "#555", margin: "1px 0 4px" }}>
                  {[w.employer, w.location].filter(Boolean).join(" — ")}{w.dates ? ` · ${w.dates}` : ""}
                </p>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {(w.bullets || []).map((b, bi) => (
                    <li key={bi} style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 3 }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResumeClassicTemplate({ contact, data, color }) {
  const sectionHeading = (label) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 10px" }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: color, opacity: 0.4 }} />
    </div>
  );
  return (
    <div style={{ ...resumePageStyle, border: `2px solid ${color}`, borderRadius: 4, padding: "32px 36px" }}>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, letterSpacing: "0.03em", margin: 0 }}>{contact.name || "Your Name"}</p>
        <p style={{ fontSize: 12, color: "#555", margin: "6px 0 0" }}>
          {[contact.location, contact.phone, contact.email].filter(Boolean).join("  ·  ")}
        </p>
      </div>

      {data.summary && (
        <div>
          {sectionHeading("PROFESSIONAL SUMMARY")}
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, textAlign: "center" }}>{data.summary}</p>
        </div>
      )}

      {data.skills?.length > 0 && (
        <div>
          {sectionHeading("SKILLS")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
            {data.skills.map((s, i) => <p key={i} style={{ fontSize: 12.5, margin: 0 }}>• {s}</p>)}
          </div>
        </div>
      )}

      {data.workHistory?.length > 0 && (
        <div>
          {sectionHeading("WORK HISTORY")}
          {data.workHistory.map((w, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{w.title || "(untitled position)"}</p>
                <p style={{ fontSize: 12, color: "#555", margin: 0 }}>{w.dates}</p>
              </div>
              <p style={{ fontSize: 12, color: "#555", fontStyle: "italic", margin: "1px 0 5px" }}>
                {[w.employer, w.location].filter(Boolean).join(" — ")}
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {(w.bullets || []).map((b, bi) => (
                  <li key={bi} style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 3 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {data.education?.length > 0 && (
        <div>
          {sectionHeading("EDUCATION")}
          {data.education.map((e, i) => (
            <p key={i} style={{ fontSize: 12.5, margin: "0 0 4px" }}>
              <strong>{[e.credential, e.subject].filter(Boolean).join(": ")}</strong>
              {" — "}{e.institution}{e.dates ? `, ${e.dates}` : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeMinimalTemplate({ contact, data, color }) {
  const sectionHeading = (label) => (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color, margin: "22px 0 8px" }}>{label}</p>
  );
  return (
    <div style={{ ...resumePageStyle, padding: "32px 36px" }}>
      <p style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color, margin: 0 }}>{contact.name || "Your Name"}</p>
      <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0" }}>
        {[contact.email, contact.phone, contact.location].filter(Boolean).join("   ")}
      </p>

      {data.summary && (
        <div>
          {sectionHeading("Professional Summary")}
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{data.summary}</p>
        </div>
      )}

      {data.skills?.length > 0 && (
        <div>
          {sectionHeading("Skills")}
          <p style={{ fontSize: 12.5, lineHeight: 1.8, margin: 0 }}>{data.skills.join("   ·   ")}</p>
        </div>
      )}

      {data.workHistory?.length > 0 && (
        <div>
          {sectionHeading("Work History")}
          {data.workHistory.map((w, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                {w.title || "(untitled position)"}{w.employer ? `, ${w.employer}` : ""}
              </p>
              <p style={{ fontSize: 12, color: "#666", margin: "1px 0 5px" }}>
                {[w.location, w.dates].filter(Boolean).join(" · ")}
              </p>
              {(w.bullets || []).map((b, bi) => (
                <p key={bi} style={{ fontSize: 12.5, lineHeight: 1.55, margin: "0 0 3px" }}>{b}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {data.education?.length > 0 && (
        <div>
          {sectionHeading("Education")}
          {data.education.map((e, i) => (
            <p key={i} style={{ fontSize: 12.5, margin: "0 0 4px" }}>
              {[e.credential, e.subject].filter(Boolean).join(": ")} — {e.institution}{e.dates ? `, ${e.dates}` : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ResumePreview({ template, contact, data, color }) {
  if (template === "classic") return <ResumeClassicTemplate contact={contact} data={data} color={color} />;
  if (template === "minimal") return <ResumeMinimalTemplate contact={contact} data={data} color={color} />;
  return <ResumeSidebarTemplate contact={contact} data={data} color={color} />;
}

function LetterBody({ contact, data }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: "#333", margin: "0 0 18px" }}>{data.date}</p>
      {(data.hiringManager || data.companyName || data.companyAddress) && (
        <div style={{ fontSize: 13, color: "#333", margin: "0 0 18px", lineHeight: 1.5 }}>
          {data.hiringManager && <p style={{ margin: 0 }}>{data.hiringManager}</p>}
          {data.companyName && <p style={{ margin: 0 }}>{data.companyName}</p>}
          {data.companyAddress && <p style={{ margin: 0 }}>{data.companyAddress}</p>}
        </div>
      )}
      {data.jobTitle && (
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 18px" }}>
          RE: Application for {data.jobTitle}{data.companyName ? ` at ${data.companyName}` : ""}
        </p>
      )}
      <p style={{ fontSize: 14, margin: "0 0 14px" }}>{data.salutation}</p>
      {(data.bodyParagraphs || []).map((p, i) => (
        <p key={i} style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 14px" }}>{p}</p>
      ))}
      <p style={{ fontSize: 14, margin: "24px 0 4px" }}>{data.closing}</p>
      <p style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 18, margin: 0 }}>{contact.name}</p>
    </div>
  );
}

function CoverLetterPacificTemplate({ contact, data, color }) {
  return (
    <div style={{ ...resumePageStyle, padding: 0 }}>
      <div style={{ background: color, padding: "26px 40px" }}>
        <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, margin: 0, letterSpacing: "0.03em", textTransform: "uppercase", color: "#fff" }}>
          {contact.name || "Your Name"}
        </p>
        <p style={{ fontSize: 12, margin: "6px 0 0", color: "#fff", opacity: 0.9 }}>
          {[contact.location, contact.phone, contact.email].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div style={{ padding: "28px 40px" }}>
        <LetterBody contact={contact} data={data} />
      </div>
    </div>
  );
}

function CoverLetterRefinedTemplate({ contact, data, color }) {
  return (
    <div style={{ ...resumePageStyle, padding: "32px 40px" }}>
      <div style={{ textAlign: "center", borderBottom: `3px double ${color}`, paddingBottom: 12, marginBottom: 22 }}>
        <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, margin: 0, letterSpacing: "0.05em" }}>
          {(contact.name || "Your Name").toUpperCase()}
        </p>
        <p style={{ fontSize: 12, color: "#555", margin: "6px 0 0" }}>
          {[contact.location, contact.phone, contact.email].filter(Boolean).join("  |  ")}
        </p>
      </div>
      <LetterBody contact={contact} data={data} />
    </div>
  );
}

function CoverLetterContempoTemplate({ contact, data, color }) {
  return (
    <div style={{ ...resumePageStyle, padding: "32px 40px" }}>
      <div style={{ borderTop: `4px solid ${color}`, paddingTop: 14, marginBottom: 22 }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 22, margin: 0 }}>{contact.name || "Your Name"}</p>
        <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>
          {[contact.location, contact.phone, contact.email].filter(Boolean).join("  |  ")}
        </p>
      </div>
      <LetterBody contact={contact} data={data} />
    </div>
  );
}

function CoverLetterPreview({ template, contact, data, color }) {
  if (template === "refined") return <CoverLetterRefinedTemplate contact={contact} data={data} color={color} />;
  if (template === "contempo") return <CoverLetterContempoTemplate contact={contact} data={data} color={color} />;
  return <CoverLetterPacificTemplate contact={contact} data={data} color={color} />;
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function relativeDate(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Dashboard({ contactInfo, recentProjects, onResumeBuilder, onJobTailoring, onCoverLetter, onInterviewPrep, onRemoveProject }) {
  return (
    <div>
      <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 6px" }}>
        {timeGreeting()}{contactInfo?.name ? `, ${contactInfo.name.split(" ")[0]}` : ""}
      </p>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 40, margin: "0 0 10px", letterSpacing: "-0.01em", color: TOKENS.ink }}>
        eCareer Design
      </h1>
      <p style={{ fontSize: 18, color: TOKENS.inkSoft, margin: "0 0 20px", maxWidth: 560, lineHeight: 1.5 }}>
        Land more interviews with AI-powered resumes and STAR responses.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
        <span className="cf-badge"><Check size={13} color={TOKENS.green} /> ATS Optimized</span>
        <span className="cf-badge"><Check size={13} color={TOKENS.green} /> STAR Responses</span>
        <span className="cf-badge"><Check size={13} color={TOKENS.green} /> Resume Builder</span>
        <span className="cf-badge"><Check size={13} color={TOKENS.green} /> Federal &amp; Private Jobs</span>
      </div>

      <Card style={{ marginBottom: 28, background: TOKENS.paper, border: "none", boxShadow: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8, color: TOKENS.ink }}>
            <Star size={16} color={TOKENS.gold} fill={TOKENS.gold} /> Build ATS-friendly resumes in minutes
          </p>
          <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={14} color={TOKENS.green} /> Tailored to any job posting
          </p>
          <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={14} color={TOKENS.green} /> STAR interview responses
          </p>
          <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={14} color={TOKENS.green} /> Export to PDF &amp; text
          </p>
        </div>
      </Card>

      <p style={{ fontSize: 14, fontWeight: 500, color: TOKENS.inkSoft, margin: "0 0 12px" }}>What would you like to do today?</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 40 }}>
        <Card interactive onClick={onResumeBuilder} style={{ textAlign: "center" }}>
          <Award size={22} color={TOKENS.iconDark} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>Resume Builder</p>
        </Card>
        <Card interactive onClick={onJobTailoring} style={{ textAlign: "center" }}>
          <Briefcase size={22} color={TOKENS.iconDark} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>Job Tailoring</p>
        </Card>
        <Card interactive onClick={onCoverLetter} style={{ textAlign: "center" }}>
          <Mail size={22} color={TOKENS.iconDark} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>Cover Letter</p>
        </Card>
        <Card interactive onClick={onInterviewPrep} style={{ textAlign: "center" }}>
          <MessageSquare size={22} color={TOKENS.iconDark} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>Interview Prep</p>
        </Card>
      </div>

      <div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 14px", color: TOKENS.ink }}>Recent Projects</h2>
        {recentProjects.length === 0 ? (
          <p style={{ fontSize: 14, color: TOKENS.inkSoft }}>Nothing yet — your finished resumes and applications will show up here.</p>
        ) : (
          <div>
            {recentProjects.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: `1px solid ${TOKENS.line}`, borderRadius: 12, marginBottom: 8, background: TOKENS.surface }}>
                <Clock size={14} color={TOKENS.inkSoft} />
                <span style={{ fontSize: 14, fontWeight: 500, flex: 1, color: TOKENS.ink }}>{p.title}</span>
                <span style={{ fontSize: 12, color: TOKENS.inkSoft }}>{p.type}</span>
                <span style={{ fontSize: 12, color: "#9AA3A0" }}>{relativeDate(p.date)}</span>
                <button
                  onClick={() => onRemoveProject(p.id)}
                  aria-label="Remove this project"
                  title="Remove"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 24, height: 24, borderRadius: "50%", border: "none",
                    background: "transparent", color: "#9AA3A0", cursor: "pointer", flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = TOKENS.redSoft; e.currentTarget.style.color = TOKENS.red; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9AA3A0"; }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ECareerDesign() {
  const [view, setView] = useState("dashboard"); // 'dashboard' | 'wizard'
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null); // 'application' | 'resume'
  const [jobTitle, setJobTitle] = useState("");
  const [rawPosting, setRawPosting] = useState("");
  const [selectedLib, setSelectedLib] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "", location: "" });
  const [resumeData, setResumeData] = useState(null);
  const [resumeGenerating, setResumeGenerating] = useState(false);
  const [resumeError, setResumeError] = useState(false);
  const [resumeTemplate, setResumeTemplate] = useState("sidebar");
  const [resumeColor, setResumeColor] = useState(RESUME_COLORS[0]);
  const resumeExportRef = useRef(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [clCompanyName, setClCompanyName] = useState("");
  const [clCompanyAddress, setClCompanyAddress] = useState("");
  const [clJobTitle, setClJobTitle] = useState("");
  const [clHiringManager, setClHiringManager] = useState("");
  const [coverLetterData, setCoverLetterData] = useState(null);
  const [coverLetterGenerating, setCoverLetterGenerating] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState(false);
  const [coverLetterTemplate, setCoverLetterTemplate] = useState("pacific");
  const [coverLetterColor, setCoverLetterColor] = useState(RESUME_COLORS[0]);
  const coverLetterExportRef = useRef(null);
  const [clPdfGenerating, setClPdfGenerating] = useState(false);
  const [clPdfError, setClPdfError] = useState("");

  const [ivInterviewType, setIvInterviewType] = useState(INTERVIEW_TYPES[0]);
  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [ivGenerating, setIvGenerating] = useState(false);
  const [ivGenError, setIvGenError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswerText, setCurrentAnswerText] = useState("");
  const [answerEvaluating, setAnswerEvaluating] = useState(false);
  const [answerResults, setAnswerResults] = useState({});
  const ivReportRef = useRef(null);
  const [ivPdfGenerating, setIvPdfGenerating] = useState(false);
  const [ivPdfError, setIvPdfError] = useState("");



  const [emailCaptureAddress, setEmailCaptureAddress] = useState("");
  const [emailCaptureOptIn, setEmailCaptureOptIn] = useState(false);
  const [emailCaptureSending, setEmailCaptureSending] = useState(false);
  const [emailCaptureSent, setEmailCaptureSent] = useState(false);
  const [emailCaptureError, setEmailCaptureError] = useState("");
  const [emailCapturePdfWarning, setEmailCapturePdfWarning] = useState("");

  const [jobSearchTitle, setJobSearchTitle] = useState("");
  const [jobSearchLocation, setJobSearchLocation] = useState("");
  const [jobResults, setJobResults] = useState(null);
  const [jobSearching, setJobSearching] = useState(false);
  const [jobSearchWarnings, setJobSearchWarnings] = useState([]);

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
  const [recentProjects, setRecentProjects] = useState([]);

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
        if (saved.contactInfo) setContactInfo(saved.contactInfo);
      }
    } catch (e) {
      // no saved profile yet
    }
    try {
      const rawRecent = localStorage.getItem("ecareerdesign-recent-projects");
      if (rawRecent) setRecentProjects(JSON.parse(rawRecent));
    } catch (e) {
      // no recent projects logged yet
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
        workExperience, education, trainingEntries, trainingPasteText, additionalContext, contactInfo,
      }));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1800);
    } catch (e) {
      console.error("Storage error", e);
    }
  }, [workExperience, education, trainingEntries, trainingPasteText, additionalContext, contactInfo]);

  function logRecentProject() {
    const typeLabel = mode === "resume" ? "Resume" : mode === "coverletter" ? "Cover Letter" : mode === "interview" ? "Interview Prep" : "Job Tailoring";
    const titleLabel = mode === "resume"
      ? (contactInfo.name || "Untitled resume")
      : mode === "coverletter"
      ? (clCompanyName ? `${clJobTitle || "Cover letter"} — ${clCompanyName}` : "Untitled cover letter")
      : mode === "interview"
      ? `${jobTitle || selectedLib?.title || "Practice interview"} (${readinessScore}/100)`
      : (jobTitle || selectedLib?.title || "Untitled application");
    const entry = {
      id: newId("proj"),
      type: typeLabel,
      title: titleLabel,
      date: new Date().toISOString(),
    };
    setRecentProjects((prev) => {
      const next = [entry, ...prev].slice(0, 8);
      try {
        localStorage.setItem("ecareerdesign-recent-projects", JSON.stringify(next));
      } catch (e) {
        // non-fatal
      }
      return next;
    });
  }

  function removeRecentProject(id) {
    setRecentProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem("ecareerdesign-recent-projects", JSON.stringify(next));
      } catch (e) {
        // non-fatal
      }
      return next;
    });
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
    if (mode === "application" && requirements.length === 0) return;
    if (requirements.length > 0) {
      setBudgets(evenBudgets(requirements));
      try {
        localStorage.setItem("ecareerdesign-inprogress", JSON.stringify({ jobTitle, selectedLib, requirements }));
      } catch (e) {
        // non-fatal
      }
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
      id: newId("we"), positionTitle: "", employer: "", location: "", postalType: "Civilian",
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
      const text = await callClaude(workExpandPrompt(entry, jobTitle || selectedLib?.title, requirements), tokensForBudget(WORK_EXP_BUDGET));
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
        employer: w.employer,
        location: w.location,
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
      const text = await callClaude(starPrompt(req.text, buildBackground(), budget), tokensForBudget(budget));
      const { text: fitted, trimmed } = trimToBudget(text.trim(), budget);
      setResponses((r) => ({ ...r, [req.id]: { text: fitted, generating: false, trimmed } }));
    } catch (e) {
      setResponses((r) => ({ ...r, [req.id]: { text: "", generating: false, error: true } }));
    }
  }

  async function generateSkills() {
    setSkills({ text: "", generating: true });
    try {
      const text = await callClaude(skillsPrompt(jobTitle || selectedLib?.title || "this position", buildBackground(), SKILLS_BUDGET), tokensForBudget(SKILLS_BUDGET));
      const { text: fitted, trimmed } = trimToBudget(text.trim(), SKILLS_BUDGET);
      setSkills({ text: fitted, generating: false, trimmed });
    } catch (e) {
      setSkills({ text: "", generating: false, error: true });
    }
  }

  async function generateResume() {
    setResumeGenerating(true);
    setResumeError(false);
    try {
      const bg = buildBackground();
      const text = await callClaude(resumePrompt(bg, contactInfo), 3000);
      const parsed = parseJsonObject(text);
      const workHistory = workExperience.map((w, i) => ({
        title: w.positionTitle,
        employer: w.employer,
        location: w.location,
        dates: `${w.startDate || "?"} - ${w.current ? "Present" : (w.endDate || "?")}`,
        bullets: parsed.workHistory?.[i]?.bullets || [],
      }));
      const educationList = education.map((e) => ({
        credential: e.credential,
        subject: e.subject,
        institution: e.institution,
        dates: `${e.startDate || "?"} - ${e.endDate || "?"}`,
      }));
      setResumeData({
        summary: parsed.summary || "",
        skills: parsed.skills || [],
        workHistory,
        education: educationList,
      });
    } catch (e) {
      setResumeError(true);
    } finally {
      setResumeGenerating(false);
    }
  }

  async function generateCoverLetter() {
    setCoverLetterGenerating(true);
    setCoverLetterError(false);
    try {
      const bg = buildBackground();
      const text = await callClaude(coverLetterPrompt(bg, clJobTitle, clCompanyName), tokensForBudget(1800));
      const parsed = parseJsonObject(text);
      setCoverLetterData({
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        companyName: clCompanyName,
        companyAddress: clCompanyAddress,
        jobTitle: clJobTitle,
        hiringManager: clHiringManager.trim() || "Hiring Manager",
        salutation: clHiringManager.trim() ? `Dear ${clHiringManager.trim()},` : "Dear Hiring Manager,",
        bodyParagraphs: parsed.bodyParagraphs || [],
        closing: "Sincerely,",
      });
    } catch (e) {
      setCoverLetterError(true);
    } finally {
      setCoverLetterGenerating(false);
    }
  }

  async function generateInterviewQuestions() {
    setIvGenerating(true);
    setIvGenError("");
    try {
      const bg = buildBackground();
      const text = await callClaude(
        interviewQuestionsPrompt(bg, requirements, jobTitle || selectedLib?.title, ivInterviewType),
        3200
      );
      const parsed = parseJsonObject(text);
      const questions = (parsed.questions || []).map((q) => ({
        id: newId("q"), category: q.category || "General", text: q.text || "",
      }));
      setInterviewQuestions({ openingAnswer: parsed.openingAnswer || "", questions });
      setCurrentQuestionIndex(0);
      setCurrentAnswerText("");
      setAnswerResults({});
    } catch (e) {
      console.error("generateInterviewQuestions failed:", e);
      setIvGenError(e?.message || "Unknown error");
    } finally {
      setIvGenerating(false);
    }
  }

  async function submitAnswer() {
    if (!interviewQuestions) return;
    const q = interviewQuestions.questions[currentQuestionIndex];
    if (!q || !currentAnswerText.trim()) return;
    setAnswerEvaluating(true);
    try {
      const bg = buildBackground();
      const text = await callClaude(answerEvaluationPrompt(q, currentAnswerText, bg), tokensForBudget(1200));
      const parsed = parseJsonObject(text);
      setAnswerResults((prev) => ({
        ...prev,
        [q.id]: {
          answerText: currentAnswerText,
          score: Math.max(1, Math.min(10, Math.round(Number(parsed.score) || 5))),
          feedback: parsed.feedback || "",
          starRewrite: parsed.starRewrite || "",
          followUp: parsed.followUp || "",
        },
      }));
    } catch (e) {
      // leave unanswered on failure; the person can just try submitting again
    } finally {
      setAnswerEvaluating(false);
    }
  }

  function retryCurrentAnswer() {
    const q = interviewQuestions?.questions[currentQuestionIndex];
    if (!q) return;
    setAnswerResults((prev) => {
      const next = { ...prev };
      delete next[q.id];
      return next;
    });
    setCurrentAnswerText("");
  }

  function goToQuestion(i) {
    if (!interviewQuestions) return;
    const clamped = Math.max(0, Math.min(i, interviewQuestions.questions.length - 1));
    setCurrentQuestionIndex(clamped);
    setCurrentAnswerText(answerResults[interviewQuestions.questions[clamped].id]?.answerText || "");
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

  function buildResumePlainText() {
    if (!resumeData) return "";
    const lines = [];
    if (contactInfo.name) lines.push(contactInfo.name);
    const contactLine = [contactInfo.email, contactInfo.phone, contactInfo.location].filter(Boolean).join(" | ");
    if (contactLine) lines.push(contactLine);
    lines.push("");
    if (resumeData.summary) {
      lines.push("PROFESSIONAL SUMMARY");
      lines.push(resumeData.summary);
      lines.push("");
    }
    if (resumeData.skills?.length) {
      lines.push("SKILLS");
      lines.push(resumeData.skills.join(" | "));
      lines.push("");
    }
    if (resumeData.workHistory?.length) {
      lines.push("WORK HISTORY");
      resumeData.workHistory.forEach((w) => {
        lines.push(`${w.title || "(untitled position)"}${w.employer ? " — " + w.employer : ""}`);
        const meta = [w.location, w.dates].filter(Boolean).join(" | ");
        if (meta) lines.push(meta);
        (w.bullets || []).forEach((b) => lines.push(`- ${b}`));
        lines.push("");
      });
    }
    if (resumeData.education?.length) {
      lines.push("EDUCATION");
      resumeData.education.forEach((e) => {
        lines.push([e.credential, e.subject].filter(Boolean).join(": "));
        lines.push(`${e.institution || ""}${e.dates ? " — " + e.dates : ""}`.trim());
        lines.push("");
      });
    }
    return lines.join("\n").trim();
  }

  function buildCoverLetterPlainText() {
    if (!coverLetterData) return "";
    const lines = [];
    if (contactInfo.name) lines.push(contactInfo.name);
    const contactLine = [contactInfo.email, contactInfo.phone, contactInfo.location].filter(Boolean).join(" | ");
    if (contactLine) lines.push(contactLine);
    lines.push("");
    lines.push(coverLetterData.date);
    lines.push("");
    if (coverLetterData.hiringManager) lines.push(coverLetterData.hiringManager);
    if (coverLetterData.companyName) lines.push(coverLetterData.companyName);
    if (coverLetterData.companyAddress) lines.push(coverLetterData.companyAddress);
    lines.push("");
    if (coverLetterData.jobTitle) {
      lines.push(`RE: Application for ${coverLetterData.jobTitle}${coverLetterData.companyName ? " at " + coverLetterData.companyName : ""}`);
      lines.push("");
    }
    lines.push(coverLetterData.salutation);
    lines.push("");
    (coverLetterData.bodyParagraphs || []).forEach((p) => {
      lines.push(p);
      lines.push("");
    });
    lines.push(coverLetterData.closing);
    lines.push(contactInfo.name || "");
    return lines.join("\n").trim();
  }

  function buildInterviewReportPlainText() {
    if (!interviewQuestions) return "";
    const lines = [];
    lines.push(`INTERVIEW READINESS REPORT`);
    lines.push(`${jobTitle || selectedLib?.title || "General practice"} — ${ivInterviewType}`);
    lines.push("");
    lines.push(`Readiness score: ${readinessScore}/100`);
    lines.push(`Questions completed: ${answeredCount} of ${totalQuestionsCount}`);
    lines.push("");
    if (ivStrengths.length) {
      lines.push("STRENGTHS");
      ivStrengths.forEach((q) => lines.push(`- [${q.score}/10] ${q.text}`));
      lines.push("");
    }
    if (ivImprovements.length) {
      lines.push("AREAS NEEDING IMPROVEMENT");
      ivImprovements.forEach((q) => lines.push(`- [${q.score}/10] ${q.text}`));
      lines.push("");
    }
    lines.push("FULL TRANSCRIPT");
    interviewQuestions.questions.forEach((q, i) => {
      const r = answerResults[q.id];
      lines.push(`${i + 1}. (${q.category}) ${q.text}`);
      if (r) {
        lines.push(`Your answer: ${r.answerText}`);
        lines.push(`Score: ${r.score}/10`);
        lines.push(`Feedback: ${r.feedback}`);
        if (r.starRewrite) lines.push(`Stronger version: ${r.starRewrite}`);
      } else {
        lines.push("(not answered)");
      }
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  async function downloadInterviewReportPDF() {
    if (!ivReportRef.current) return;
    setIvPdfGenerating(true);
    setIvPdfError("");
    try {
      await exportElementToPdf(ivReportRef.current, `${(jobTitle || "interview_report").replace(/\s+/g, "_")}_readiness_report.pdf`);
    } catch (e) {
      setIvPdfError("Could not generate the PDF. Try again, or use Copy as text instead.");
    } finally {
      setIvPdfGenerating(false);
    }
  }

  async function buildPdfFromElement(element) {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    // Wait for web fonts to finish loading so the capture doesn't fall back
    // to a system font while Fraunces/Inter/IBM Plex Mono are still loading.
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    // Diagnostic: log exactly what was captured. A single Letter page at
    // scale 1.5 should be roughly 1050x1360px — if this comes back far
    // taller than that, the captured element itself is laid out wrong
    // (e.g. rendering far more content height than a single visual page).
    console.log(`[PDF capture] element=${element.className || element.tagName} canvas=${canvas.width}x${canvas.height}px`);

    // Sanity check: a real one-to-few-page document should never come back
    // this large. If it does, something is wrong with the captured layout —
    // fail with a clear error instead of trying to process a runaway canvas,
    // which is what was crashing the browser tab with an out-of-memory error.
    const MAX_CANVAS_DIMENSION = 20000;
    if (!canvas.width || !canvas.height || canvas.height > MAX_CANVAS_DIMENSION || canvas.width > MAX_CANVAS_DIMENSION) {
      throw new Error(`Captured content looks invalid: ${canvas.width}x${canvas.height}px. Please try again.`);
    }

    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const scaledHeight = (canvas.height * pageWidth) / canvas.width;
    let pageCount = 1;

    if (scaledHeight <= pageHeight) {
      // Fits on one page.
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidth, scaledHeight);
    } else {
      // Slice the full-resolution canvas into page-sized chunks and add
      // each as its own PDF page, so multi-page documents still print cleanly.
      // pageHeightPx is guaranteed >= 1 here since canvas.width/pageWidth/pageHeight
      // are all positive at this point, but MAX_PAGES is a hard backstop against
      // any future change (or edge case) accidentally reintroducing a runaway loop.
      const pageHeightPx = Math.max(1, Math.floor((canvas.width * pageHeight) / pageWidth));
      const MAX_PAGES = 30;
      let renderedPx = 0;
      let pageIndex = 0;
      while (renderedPx < canvas.height && pageIndex < MAX_PAGES) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

        if (pageIndex > 0) pdf.addPage();
        const sliceHeightPt = (sliceHeightPx * pageWidth) / canvas.width;
        pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidth, sliceHeightPt);

        // Explicitly release this page's canvas memory before the next
        // iteration rather than waiting on garbage collection.
        pageCanvas.width = 0;
        pageCanvas.height = 0;

        renderedPx += sliceHeightPx;
        pageIndex += 1;
      }
      pageCount = pageIndex;
    }

    console.log(`[PDF capture] produced ${pageCount} page(s)`);
    pdf.__captureMeta = { canvasWidth: canvas.width, canvasHeight: canvas.height, pageCount };

    return pdf;
  }

  async function exportElementToPdf(element, filename) {
    const pdf = await buildPdfFromElement(element);
    pdf.save(filename);
  }

  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  async function downloadResumePDF() {
    if (!resumeExportRef.current) return;
    setPdfGenerating(true);
    setPdfError("");
    try {
      await exportElementToPdf(resumeExportRef.current, `${(contactInfo.name || "resume").replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      setPdfError("Could not generate the PDF. Try again, or use Copy as text instead.");
    } finally {
      setPdfGenerating(false);
    }
  }

  async function downloadCoverLetterPDF() {
    if (!coverLetterExportRef.current) return;
    setClPdfGenerating(true);
    setClPdfError("");
    try {
      const name = contactInfo.name || "cover_letter";
      const company = clCompanyName ? `_${clCompanyName}` : "";
      await exportElementToPdf(coverLetterExportRef.current, `${(name + company).replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      setClPdfError("Could not generate the PDF. Try again, or use Copy as text instead.");
    } finally {
      setClPdfGenerating(false);
    }
  }

  useEffect(() => {
    if (resumeData && !jobSearchTitle && resumeData.workHistory?.[0]?.title) {
      setJobSearchTitle(resumeData.workHistory[0].title);
    }
    if (resumeData && !jobSearchLocation && contactInfo.location) {
      setJobSearchLocation(contactInfo.location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData]);

  async function searchJobs() {
    setJobSearching(true);
    setJobSearchWarnings([]);
    try {
      const res = await fetch("/api/job-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: jobSearchTitle, location: jobSearchLocation }),
      });
      const data = await res.json();
      setJobResults(data.results || []);
      setJobSearchWarnings(data.warnings || []);
    } catch (e) {
      setJobResults([]);
      setJobSearchWarnings(["Could not reach the job search service."]);
    } finally {
      setJobSearching(false);
    }
  }

  function assembleExportText() {
    if (mode === "resume") {
      return buildResumePlainText();
    }
    const parts = [];
    if (workExperience.length) {
      parts.push("WORK EXPERIENCE\n" + "=".repeat(16));
      workExperience.forEach((w) => {
        const desc = w.expandedDescription || w.basicDescription || "";
        const orgLine = [w.employer, w.location].filter(Boolean).join(" — ");
        parts.push(
          `${w.positionTitle || "(untitled position)"}${orgLine ? "\n" + orgLine : ""}\n` +
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
    a.download = `${(contactInfo.name || jobTitle || selectedLib?.title || "KSA-Assist-export").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitEmailCapture() {
    if (!emailCaptureAddress.trim()) return;
    setEmailCaptureSending(true);
    setEmailCaptureError("");
    setEmailCapturePdfWarning("");
    try {
      const contentType = mode === "resume" ? "resume" : mode === "coverletter" ? "cover letter" : mode === "interview" ? "interview report" : "application responses";
      const content = mode === "interview" ? buildInterviewReportPlainText() : assembleExportText();

      // Build a PDF matching the exact template/color the person picked, the
      // same way "Download PDF" does, so the emailed copy looks identical.
      let pdfBase64 = null;
      let pdfFilename = null;
      let pdfFailReason = "";
      const wantsPdf = mode === "resume" || mode === "coverletter" || mode === "interview";
      try {
        let pdfMeta = null;
        if (mode === "resume" && resumeExportRef.current) {
          const pdf = await buildPdfFromElement(resumeExportRef.current);
          pdfMeta = pdf.__captureMeta;
          pdfBase64 = arrayBufferToBase64(pdf.output("arraybuffer"));
          pdfFilename = `${(contactInfo.name || "resume").replace(/\s+/g, "_")}.pdf`;
        } else if (mode === "coverletter" && coverLetterExportRef.current) {
          const pdf = await buildPdfFromElement(coverLetterExportRef.current);
          pdfMeta = pdf.__captureMeta;
          pdfBase64 = arrayBufferToBase64(pdf.output("arraybuffer"));
          const name = contactInfo.name || "cover_letter";
          const company = clCompanyName ? `_${clCompanyName}` : "";
          pdfFilename = `${(name + company).replace(/\s+/g, "_")}.pdf`;
        } else if (mode === "interview" && ivReportRef.current) {
          const pdf = await buildPdfFromElement(ivReportRef.current);
          pdfMeta = pdf.__captureMeta;
          pdfBase64 = arrayBufferToBase64(pdf.output("arraybuffer"));
          pdfFilename = "interview_readiness_report.pdf";
        } else if (wantsPdf) {
          pdfFailReason = "The preview element wasn't found on the page (ref was empty).";
        }
      } catch (e) {
        // If PDF generation fails for any reason, fall back to a text-only
        // email rather than blocking the whole request — but remember why,
        // so we can actually show it instead of failing silently.
        console.error("PDF generation for email failed:", e);
        pdfFailReason = e?.message || String(e);
        pdfBase64 = null;
        pdfFilename = null;
      }

      // Vercel serverless functions cap the total request body at 4.5MB.
      // Base64 inflates binary size by ~33%, so cap well under that limit —
      // if the PDF somehow came back oversized, drop it and send text-only
      // rather than risk the whole request failing with an opaque error.
      const MAX_PDF_BASE64_CHARS = 3_000_000;
      if (pdfBase64 && pdfBase64.length > MAX_PDF_BASE64_CHARS) {
        console.error("Generated PDF too large to email, sending text-only instead:", pdfBase64.length);
        const dims = pdfMeta ? ` — captured at ${pdfMeta.canvasWidth}x${pdfMeta.canvasHeight}px across ${pdfMeta.pageCount} page(s)` : "";
        pdfFailReason = `The generated PDF was too large to email (${Math.round(pdfBase64.length / 1024)}KB encoded)${dims}.`;
        pdfBase64 = null;
        pdfFilename = null;
      }

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailCaptureAddress.trim(),
          optIn: emailCaptureOptIn,
          content,
          contentType,
          pdfBase64,
          pdfFilename,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Server returned an unexpected response (status ${res.status}).`);
      }

      if (data.success) {
        setEmailCaptureSent(true);
        if (wantsPdf && !pdfBase64) {
          setEmailCapturePdfWarning(`Sent as text only — the PDF wasn't included. Reason: ${pdfFailReason || "unknown error"}`);
        }
      } else {
        setEmailCaptureError(data.error || "Could not send. Try again.");
      }
    } catch (e) {
      console.error("submitEmailCapture failed:", e);
      setEmailCaptureError(e?.message || "Could not reach the email service.");
    } finally {
      setEmailCaptureSending(false);
    }
  }

  const answeredQuestions = interviewQuestions
    ? interviewQuestions.questions.filter((q) => answerResults[q.id]).map((q) => ({ ...q, ...answerResults[q.id] }))
    : [];
  const answeredCount = answeredQuestions.length;
  const totalQuestionsCount = interviewQuestions?.questions.length || 0;
  const avgScore = answeredCount ? answeredQuestions.reduce((s, a) => s + a.score, 0) / answeredCount : 0;
  const readinessScore = Math.round(avgScore * 10);
  const sortedAnswered = [...answeredQuestions].sort((a, b) => b.score - a.score);
  const ivStrengths = sortedAnswered.slice(0, 3);
  const ivImprovements = sortedAnswered.slice(-3).reverse().filter((q) => !ivStrengths.includes(q));

  const allGenerated = mode === "resume"
    ? !!resumeData
    : mode === "coverletter"
    ? !!coverLetterData
    : mode === "interview"
    ? (interviewQuestions && totalQuestionsCount > 0 && answeredCount === totalQuestionsCount)
    : requirements.length > 0 && requirements.every((r) => responses[r.id]?.text);

  function renderEmailCapture(label) {
    const hasPdf = mode === "resume" || mode === "coverletter" || mode === "interview";
    return (
      <Card style={{ marginTop: 16, borderColor: TOKENS.accent }}>
        <SectionHeading
          icon={<Mail size={18} color={TOKENS.accent} />}
          title="Email me a copy"
          subtitle={hasPdf ? `We'll send your ${label} straight to your inbox, as a PDF matching the design you picked.` : `We'll send your ${label} straight to your inbox.`}
        />
        {emailCaptureSent ? (
          <div>
            <p style={{ fontSize: 14, color: TOKENS.green, display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
              <Check size={15} /> Sent — check your inbox.
            </p>
            {emailCapturePdfWarning && (
              <p style={{ fontSize: 13, color: TOKENS.gold, marginTop: 8 }}>{emailCapturePdfWarning}</p>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <input
                style={{ ...inputStyle, flex: 1, minWidth: 220 }}
                type="email"
                placeholder="you@example.com"
                value={emailCaptureAddress}
                onChange={(e) => setEmailCaptureAddress(e.target.value)}
              />
              <Button
                variant="primary"
                icon={emailCaptureSending ? <Loader2 size={14} className="spin" /> : <Mail size={14} />}
                onClick={submitEmailCapture}
                disabled={emailCaptureSending || !emailCaptureAddress.trim()}
              >
                {emailCaptureSending ? "Sending..." : "Email it to me"}
              </Button>
            </div>
            <label style={{ fontSize: 13, color: TOKENS.inkSoft, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={emailCaptureOptIn} onChange={(e) => setEmailCaptureOptIn(e.target.checked)} />
              Also send me occasional updates about new eCareer Design features
            </label>
            {emailCaptureError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 8 }}>{emailCaptureError}</p>}
          </div>
        )}
      </Card>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: TOKENS.ink, maxWidth: 880, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <style>{`
        ${FONTS_IMPORT}
        input:focus, textarea:focus, select:focus { border-color: ${TOKENS.accent} !important; }
        ::placeholder { color: #9AA39B; }
        textarea, select { font-family: 'Inter', sans-serif; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (hover: hover) {
          .cf-card-interactive:hover { box-shadow: ${TOKENS.shadowHover}; transform: translateY(-3px); border-color: ${TOKENS.accent}; }
        }
        .cf-badge {
          display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;
          color: ${TOKENS.inkSoft}; background: ${TOKENS.paper}; border: 1px solid ${TOKENS.line};
          border-radius: 999px; padding: 6px 12px;
        }
        .cf-brand:hover { opacity: 0.75; cursor: pointer; }
      `}</style>

      {view === "wizard" && (
        <>
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <h1
                className="cf-brand"
                onClick={() => setView("dashboard")}
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 40, margin: 0, letterSpacing: "-0.01em" }}
              >
                eCareer Design
              </h1>
            </div>
            <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "6px 0 0", maxWidth: 620 }}>
              STAR-format response and resume builder for your next job application.
            </p>
          </div>

          <div style={{ background: TOKENS.goldSoft, border: `1px solid ${TOKENS.gold}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: "1.75rem" }}>
            <AlertCircle size={16} color={TOKENS.gold} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 14, margin: 0, color: "#5C4210", lineHeight: 1.5 }}>
              <strong>Disclaimer</strong> — AI-generated content should always be reviewed before submission.
            </p>
          </div>

          <Stepper step={step} labels={mode === "resume" ? STEPS_RESUME : mode === "coverletter" ? STEPS_COVERLETTER : mode === "interview" ? STEPS_INTERVIEW : STEPS_APPLICATION} />

      {step === 0 && mode === null && (
        <Card>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>What do you want to build?</h2>
          <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 24px" }}>
            You can always come back and try the other option later.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div
              onClick={() => setMode("application")}
              style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 4, padding: 20, cursor: "pointer", background: TOKENS.paper }}
            >
              <FileText size={20} color={TOKENS.accent} />
              <p style={{ fontSize: 15, fontWeight: 600, margin: "10px 0 4px" }}>Tailor to a specific job</p>
              <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.5 }}>
                Enter a job posting's qualifications and get STAR-format responses for each one, plus a skills summary.
              </p>
            </div>
            <div
              onClick={() => setMode("resume")}
              style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 4, padding: 20, cursor: "pointer", background: TOKENS.paper }}
            >
              <Award size={20} color={TOKENS.accent} />
              <p style={{ fontSize: 15, fontWeight: 600, margin: "10px 0 4px" }}>Build a general resume</p>
              <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.5 }}>
                Skip the job posting entirely — go straight to your background and get a polished, general-purpose resume.
              </p>
            </div>
          </div>
        </Card>
      )}

      {step === 0 && mode === "application" && (
        <Card>
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => { setMode(null); setView("dashboard"); }}>← Home</Button>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Job title and requirements</h2>
          <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 24px" }}>
            Search the sample requirement library first. If your title isn't listed, paste the qualifications straight from the posting.
          </p>

          <Field label="Job title">
            <input
              style={inputStyle}
              value={jobTitle}
              onChange={(e) => { setJobTitle(e.target.value); setSelectedLib(null); setRequirements([]); }}
              placeholder="e.g., Management and Program Analyst"
            />
          </Field>

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

      {step === 0 && mode === "interview" && (
        <Card>
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => { setMode(null); setView("dashboard"); }}>← Home</Button>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Set up your mock interview</h2>
          <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 24px" }}>
            If you already pulled in a job's requirements under Job Tailoring, they're still here — this interview will be built around them.
          </p>

          <Field label="Interview type">
            <select style={inputStyle} value={ivInterviewType} onChange={(e) => setIvInterviewType(e.target.value)}>
              {INTERVIEW_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Job title">
            <input
              style={inputStyle}
              value={jobTitle}
              onChange={(e) => { setJobTitle(e.target.value); setSelectedLib(null); setRequirements([]); }}
              placeholder="e.g., Management and Program Analyst"
            />
          </Field>

          <div>
            <Field label="Paste the Qualifications / Requirements section from the job posting (optional)">
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

          {requirements.length > 0 && (
            <div style={{ marginTop: 24, borderTop: `1px solid ${TOKENS.line}`, paddingTop: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 10px" }}>{requirements.length} requirements loaded — this interview will target them</p>
              {requirements.map((r, i) => (
                <div key={r.id} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: TOKENS.inkSoft }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{r.text}</span>
                </div>
              ))}
            </div>
          )}

          <Button variant="primary" style={{ marginTop: 18 }} onClick={goToBackground} icon={<ChevronRight size={14} />}>
            Continue to background
          </Button>
        </Card>
      )}

      {step === 0 && mode === "resume" && (
        <Card>
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => { setMode(null); setView("dashboard"); }}>← Home</Button>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Build a general resume</h2>
          <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 24px", lineHeight: 1.6 }}>
            No job posting needed for this path. Head straight to your background — work experience, education, and training — and eCareer Design will turn it into a polished, general-purpose resume.
          </p>
          <Button variant="primary" onClick={goToBackground} icon={<ChevronRight size={14} />}>
            Continue to background
          </Button>
        </Card>
      )}

      {step === 0 && mode === "coverletter" && (
        <Card>
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => { setMode(null); setView("dashboard"); }}>← Home</Button>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Job details</h2>
          <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 24px", lineHeight: 1.6 }}>
            Tell us who you're writing to. Your background comes next, and eCareer Design will draft the letter itself.
          </p>
          <Field label="Company name">
            <input style={inputStyle} placeholder="e.g., Acme Corporation" value={clCompanyName} onChange={(e) => setClCompanyName(e.target.value)} />
          </Field>
          <Field label="Job title you're applying for">
            <input style={inputStyle} placeholder="e.g., Management and Program Analyst" value={clJobTitle} onChange={(e) => setClJobTitle(e.target.value)} />
          </Field>
          <Field label="Hiring manager's name (optional)">
            <input style={inputStyle} placeholder="Leave blank to use 'Hiring Manager'" value={clHiringManager} onChange={(e) => setClHiringManager(e.target.value)} />
          </Field>
          <Field label="Company address (optional)">
            <input style={inputStyle} placeholder="City, State" value={clCompanyAddress} onChange={(e) => setClCompanyAddress(e.target.value)} />
          </Field>
          <Button variant="primary" onClick={goToBackground} icon={<ChevronRight size={14} />}>
            Continue to background
          </Button>
        </Card>
      )}


      {step === 1 && (
        <div>
          <BackButton onClick={() => setStep(0)} />
          {(mode === "resume" || mode === "coverletter") && (
            <Card style={{ marginBottom: 16 }}>
              <SectionHeading icon={<FileText size={18} color={TOKENS.accent} />} title="Contact info" subtitle={mode === "resume" ? "Goes at the top of your resume." : "Goes at the top of your cover letter."} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input style={smallInputStyle} placeholder="Full name" value={contactInfo.name} onChange={(e) => setContactInfo((c) => ({ ...c, name: e.target.value }))} />
                <input style={smallInputStyle} placeholder="Location (city, state)" value={contactInfo.location} onChange={(e) => setContactInfo((c) => ({ ...c, location: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input style={smallInputStyle} placeholder="Email" value={contactInfo.email} onChange={(e) => setContactInfo((c) => ({ ...c, email: e.target.value }))} />
                <input style={smallInputStyle} placeholder="Phone" value={contactInfo.phone} onChange={(e) => setContactInfo((c) => ({ ...c, phone: e.target.value }))} />
              </div>
            </Card>
          )}
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
                    <option>Civilian</option>
                    <option>Federal</option>
                    <option>Postal</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <input style={smallInputStyle} placeholder="Employer / organization" value={w.employer} onChange={(e) => updateWorkExperience(w.id, { employer: e.target.value })} />
                  <input style={smallInputStyle} placeholder="Location (city, state)" value={w.location} onChange={(e) => updateWorkExperience(w.id, { location: e.target.value })} />
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
                placeholder="e.g., Salesforce, Excel/pivot tables, project tracking software, internal databases"
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

      {step === 2 && mode === "resume" && (
        <div>
          <BackButton onClick={() => setStep(1)} />
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Your resume</h2>
            <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
              Built from your work experience, education, training, and additional context — no job posting involved.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: TOKENS.ink, margin: "0 0 8px" }}>Template</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {RESUME_TEMPLATES.map((t) => (
                    <Button key={t.id} variant={resumeTemplate === t.id ? "ink" : "secondary"} onClick={() => setResumeTemplate(t.id)}>
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: TOKENS.ink, margin: "0 0 8px" }}>Color</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {RESUME_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setResumeColor(c)}
                      style={{
                        width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer",
                        border: resumeColor === c ? `2px solid ${TOKENS.ink}` : "2px solid transparent",
                        outline: resumeColor === c ? `2px solid ${c}` : "none",
                        outlineOffset: 2,
                      }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {resumeGenerating ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                <Loader2 size={14} className="spin" /> Writing your resume...
              </div>
            ) : resumeData ? (
              <div>
                <div style={{ background: TOKENS.paper, padding: 20, borderRadius: 4, marginBottom: 12 }}>
                  <ResumePreview template={resumeTemplate} contact={contactInfo} data={resumeData} color={resumeColor} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Button variant="ghost" icon={<RefreshCw size={13} />} onClick={generateResume}>Regenerate content</Button>
                  <Button variant="ghost" icon={copiedKey === "resume" ? <Check size={13} /> : <Copy size={13} />} onClick={() => copyText("resume", buildResumePlainText())}>
                    {copiedKey === "resume" ? "Copied" : "Copy as text"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="primary" icon={<Sparkles size={14} />} onClick={generateResume}>Generate resume</Button>
            )}
            {resumeError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>Something went wrong generating the resume. Try again.</p>}
          </Card>

          <div style={{ textAlign: "right" }}>
            <Button variant="primary" icon={<ChevronRight size={14} />} onClick={() => { logRecentProject(); setStep(3); }} disabled={!allGenerated}>
              Continue to export
            </Button>
          </div>
        </div>
      )}

      {step === 2 && mode === "coverletter" && (
        <div>
          <BackButton onClick={() => setStep(1)} />
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Your cover letter</h2>
            <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
              Built from your background, tailored to {clJobTitle || "the role"}{clCompanyName ? ` at ${clCompanyName}` : ""}.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: TOKENS.ink, margin: "0 0 8px" }}>Template</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {COVER_LETTER_TEMPLATES.map((t) => (
                    <Button key={t.id} variant={coverLetterTemplate === t.id ? "ink" : "secondary"} onClick={() => setCoverLetterTemplate(t.id)}>
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: TOKENS.ink, margin: "0 0 8px" }}>Color</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {RESUME_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCoverLetterColor(c)}
                      style={{
                        width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer",
                        border: coverLetterColor === c ? `2px solid ${TOKENS.ink}` : "2px solid transparent",
                        outline: coverLetterColor === c ? `2px solid ${c}` : "none",
                        outlineOffset: 2,
                      }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {coverLetterGenerating ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                <Loader2 size={14} className="spin" /> Writing your cover letter...
              </div>
            ) : coverLetterData ? (
              <div>
                <div style={{ background: TOKENS.paper, padding: 20, borderRadius: 4, marginBottom: 12 }}>
                  <CoverLetterPreview template={coverLetterTemplate} contact={contactInfo} data={coverLetterData} color={coverLetterColor} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Button variant="ghost" icon={<RefreshCw size={13} />} onClick={generateCoverLetter}>Regenerate content</Button>
                  <Button variant="ghost" icon={copiedKey === "coverletter" ? <Check size={13} /> : <Copy size={13} />} onClick={() => copyText("coverletter", buildCoverLetterPlainText())}>
                    {copiedKey === "coverletter" ? "Copied" : "Copy as text"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="primary" icon={<Sparkles size={14} />} onClick={generateCoverLetter}>Generate cover letter</Button>
            )}
            {coverLetterError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>Something went wrong generating the cover letter. Try again.</p>}
          </Card>

          <div style={{ textAlign: "right" }}>
            <Button variant="primary" icon={<ChevronRight size={14} />} onClick={() => { logRecentProject(); setStep(3); }} disabled={!allGenerated}>
              Continue to export
            </Button>
          </div>
        </div>
      )}

      {step === 2 && mode === "interview" && (
        <div>
          <BackButton onClick={() => setStep(1)} />

          {!interviewQuestions ? (
            <Card style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Ready to start</h2>
              <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
                eCareer Design will generate a realistic question set for {ivInterviewType.toLowerCase()}
                {jobTitle || selectedLib?.title ? ` targeting ${jobTitle || selectedLib?.title}` : ""}, based on your background{requirements.length ? " and the job requirements you loaded" : ""}.
              </p>
              {ivGenerating ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                  <Loader2 size={14} className="spin" /> Building your question set...
                </div>
              ) : (
                <Button variant="primary" icon={<Sparkles size={14} />} onClick={generateInterviewQuestions}>Generate interview questions</Button>
              )}
              {ivGenError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>Something went wrong generating questions: {ivGenError}</p>}
            </Card>
          ) : (
            <>
              <Card style={{ marginBottom: 16, background: TOKENS.paper, border: "none", boxShadow: "none" }}>
                <SectionHeading icon={<MessageSquare size={18} color={TOKENS.accent} />} title="Tell me about yourself — a starting draft" />
                <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: TOKENS.ink }}>{interviewQuestions.openingAnswer}</p>
              </Card>

              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.inkSoft }}>
                    Question {currentQuestionIndex + 1} of {interviewQuestions.questions.length}
                  </span>
                  <span className="cf-badge">{interviewQuestions.questions[currentQuestionIndex].category}</span>
                </div>

                <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: TOKENS.ink }}>
                  {interviewQuestions.questions[currentQuestionIndex].text}
                </p>

                <textarea
                  style={{ ...inputStyle, minHeight: 120, resize: "vertical", background: "#fff", marginBottom: 12 }}
                  placeholder="Type your answer here..."
                  value={currentAnswerText}
                  onChange={(e) => setCurrentAnswerText(e.target.value)}
                />

                {answerEvaluating ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                    <Loader2 size={14} className="spin" /> Evaluating your answer...
                  </div>
                ) : answerResults[interviewQuestions.questions[currentQuestionIndex].id] ? (
                  (() => {
                    const result = answerResults[interviewQuestions.questions[currentQuestionIndex].id];
                    return (
                      <div style={{ background: TOKENS.paper, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <span style={{
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 700,
                            color: result.score >= 8 ? TOKENS.green : result.score >= 5 ? TOKENS.gold : TOKENS.red,
                          }}>
                            {result.score}/10
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: TOKENS.ink }}>Coaching feedback</span>
                        </div>
                        <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 10px", color: TOKENS.ink }}>{result.feedback}</p>
                        {result.starRewrite && (
                          <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${TOKENS.line}` }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accent, margin: "0 0 6px", textTransform: "uppercase" }}>Stronger STAR version</p>
                            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{result.starRewrite}</p>
                          </div>
                        )}
                        {result.followUp && (
                          <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0, fontStyle: "italic" }}>
                            A hiring manager might follow up with: "{result.followUp}"
                          </p>
                        )}
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <Button variant="ghost" icon={<RefreshCw size={13} />} onClick={retryCurrentAnswer}>Try again</Button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <Button variant="primary" icon={<Sparkles size={14} />} onClick={submitAnswer} disabled={!currentAnswerText.trim()}>
                    Submit answer
                  </Button>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${TOKENS.line}` }}>
                  <Button variant="secondary" icon={<ChevronLeft size={14} />} onClick={() => goToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0}>
                    Previous
                  </Button>
                  <Button variant="secondary" onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex === interviewQuestions.questions.length - 1}>
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              </Card>

              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: TOKENS.ink }}>Readiness score</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700, color: TOKENS.accent }}>{readinessScore}/100</span>
                </div>
                <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>{answeredCount} of {totalQuestionsCount} questions answered</p>
              </Card>
            </>
          )}

          <div style={{ textAlign: "right" }}>
            <Button variant="primary" icon={<ChevronRight size={14} />} onClick={() => { logRecentProject(); setStep(3); }} disabled={!allGenerated}>
              Continue to report
            </Button>
          </div>
        </div>
      )}

      {step === 2 && mode === "application" && (
        <div>
          <BackButton onClick={() => setStep(1)} />
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Summary of Accomplishments</h2>
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
            <Button variant="primary" icon={<ChevronRight size={14} />} onClick={() => { logRecentProject(); setStep(3); }} disabled={!allGenerated}>
              Continue to export
            </Button>
          </div>
        </div>
      )}

      {step === 3 && mode !== "interview" && (
        <>
          <BackButton onClick={() => setStep(2)} />
          <Card>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Export</h2>
          <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 24px" }}>
            {mode === "resume"
              ? "Download a PDF that looks exactly like the template and color you picked, or copy the content as plain text."
              : mode === "coverletter"
              ? "Download a PDF that matches the template and color you picked, or copy the letter as plain text."
              : "Copy sections directly into your agency's application portal, or download everything as text to paste into Word."}
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {mode === "resume" ? (
              <>
                <Button variant="primary" icon={pdfGenerating ? <Loader2 size={14} className="spin" /> : <Download size={14} />} onClick={downloadResumePDF} disabled={pdfGenerating || !resumeData}>
                  {pdfGenerating ? "Preparing PDF..." : "Download PDF"}
                </Button>
                <Button variant="secondary" icon={copiedKey === "all" ? <Check size={14} /> : <Copy size={14} />} onClick={copyAll}>
                  {copiedKey === "all" ? "Copied" : "Copy as text"}
                </Button>
              </>
            ) : mode === "coverletter" ? (
              <>
                <Button variant="primary" icon={clPdfGenerating ? <Loader2 size={14} className="spin" /> : <Download size={14} />} onClick={downloadCoverLetterPDF} disabled={clPdfGenerating || !coverLetterData}>
                  {clPdfGenerating ? "Preparing PDF..." : "Download PDF"}
                </Button>
                <Button variant="secondary" icon={copiedKey === "cl-all" ? <Check size={14} /> : <Copy size={14} />} onClick={() => copyText("cl-all", buildCoverLetterPlainText())}>
                  {copiedKey === "cl-all" ? "Copied" : "Copy as text"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" icon={copiedKey === "all" ? <Check size={14} /> : <Copy size={14} />} onClick={copyAll}>
                  {copiedKey === "all" ? "Copied all" : "Copy all"}
                </Button>
                <Button variant="secondary" icon={<Download size={14} />} onClick={downloadText}>
                  Download as text
                </Button>
              </>
            )}
          </div>
          {mode === "resume" && pdfError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: -10, marginBottom: 16 }}>{pdfError}</p>}
          {mode === "coverletter" && clPdfError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: -10, marginBottom: 16 }}>{clPdfError}</p>}

          {renderEmailCapture(mode === "resume" ? "resume" : mode === "coverletter" ? "cover letter" : "application responses")}

          <div style={{ borderTop: `1px solid ${TOKENS.line}`, paddingTop: 16 }}>
            {mode === "resume" ? (
              <div style={{ background: TOKENS.paper, padding: 20, borderRadius: 4 }}>
                {resumeData && (
                  <div ref={resumeExportRef} style={{ display: "inline-block" }}>
                    <ResumePreview template={resumeTemplate} contact={contactInfo} data={resumeData} color={resumeColor} />
                  </div>
                )}
              </div>
            ) : mode === "coverletter" ? (
              <div style={{ background: TOKENS.paper, padding: 20, borderRadius: 4 }}>
                {coverLetterData && (
                  <div ref={coverLetterExportRef} style={{ display: "inline-block" }}>
                    <CoverLetterPreview template={coverLetterTemplate} contact={contactInfo} data={coverLetterData} color={coverLetterColor} />
                  </div>
                )}
              </div>
            ) : (
              <>
                {workExperience.length > 0 && (
                  <div style={{ marginBottom: 22 }}>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.accent, margin: "0 0 8px", textTransform: "uppercase" }}>Work Experience</p>
                    {workExperience.map((w) => (
                      <div key={w.id} style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{w.positionTitle || "(untitled position)"}</p>
                        {(w.employer || w.location) && (
                          <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "1px 0 0" }}>
                            {[w.employer, w.location].filter(Boolean).join(" — ")}
                          </p>
                        )}
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
              </>
            )}
          </div>

          {mode === "application" && (
            <p style={{ fontSize: 12, color: TOKENS.inkSoft, marginTop: 20, borderTop: `1px solid ${TOKENS.line}`, paddingTop: 16 }}>
              This demo exports plain text. A production build would generate a formatted .docx matching this same structure, using the docx library server-side.
            </p>
          )}
          </Card>
        </>
      )}

      {step === 3 && mode === "interview" && (
        <>
          <BackButton onClick={() => setStep(2)} />
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Interview Readiness Report</h2>
            <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
              {jobTitle || selectedLib?.title || "General practice"} · {ivInterviewType}
            </p>

            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <Button variant="primary" icon={ivPdfGenerating ? <Loader2 size={14} className="spin" /> : <Download size={14} />} onClick={downloadInterviewReportPDF} disabled={ivPdfGenerating}>
                {ivPdfGenerating ? "Preparing PDF..." : "Download PDF report"}
              </Button>
              <Button variant="secondary" icon={copiedKey === "iv-report" ? <Check size={14} /> : <Copy size={14} />} onClick={() => copyText("iv-report", buildInterviewReportPlainText())}>
                {copiedKey === "iv-report" ? "Copied" : "Copy as text"}
              </Button>
            </div>
            {ivPdfError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: -10, marginBottom: 16 }}>{ivPdfError}</p>}

            {renderEmailCapture("interview report")}

            <div ref={ivReportRef} style={{ background: "#fff" }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
                <div style={{ textAlign: "center", background: TOKENS.paper, borderRadius: 12, padding: "18px 26px" }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 32, fontWeight: 700, margin: 0, color: TOKENS.accent }}>{readinessScore}</p>
                  <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "4px 0 0" }}>Readiness Score</p>
                </div>
                <div style={{ textAlign: "center", background: TOKENS.paper, borderRadius: 12, padding: "18px 26px" }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 32, fontWeight: 700, margin: 0, color: TOKENS.ink }}>{answeredCount}/{totalQuestionsCount}</p>
                  <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "4px 0 0" }}>Questions Completed</p>
                </div>
              </div>

              {ivStrengths.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.green, margin: "0 0 8px", textTransform: "uppercase" }}>Strengths</p>
                  {ivStrengths.map((q) => (
                    <p key={q.id} style={{ fontSize: 14, margin: "0 0 6px" }}>
                      <strong>[{q.score}/10]</strong> {q.text}
                    </p>
                  ))}
                </div>
              )}

              {ivImprovements.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.red, margin: "0 0 8px", textTransform: "uppercase" }}>Areas Needing Improvement</p>
                  {ivImprovements.map((q) => (
                    <p key={q.id} style={{ fontSize: 14, margin: "0 0 6px" }}>
                      <strong>[{q.score}/10]</strong> {q.text}
                    </p>
                  ))}
                </div>
              )}

              <div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: TOKENS.accent, margin: "0 0 10px", textTransform: "uppercase" }}>Full Transcript</p>
                {interviewQuestions?.questions.map((q, i) => {
                  const r = answerResults[q.id];
                  return (
                    <div key={q.id} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: i < interviewQuestions.questions.length - 1 ? `1px solid ${TOKENS.line}` : "none" }}>
                      <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "0 0 4px" }}>{i + 1}. {q.category}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>{q.text}</p>
                      {r ? (
                        <>
                          <p style={{ fontSize: 13, margin: "0 0 6px", color: "#444" }}>{r.answerText}</p>
                          <p style={{ fontSize: 13, margin: 0, color: TOKENS.inkSoft }}>Score: {r.score}/10 — {r.feedback}</p>
                        </>
                      ) : (
                        <p style={{ fontSize: 13, color: TOKENS.inkSoft, fontStyle: "italic", margin: 0 }}>Not answered</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </>
      )}

      {step === 3 && mode === "resume" && resumeData && (
        <Card style={{ marginTop: 16 }}>
          <SectionHeading icon={<Search size={18} color={TOKENS.accent} />} title="Find matching jobs" subtitle="Searches real, live postings and links you straight to the original listing to apply." />
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 10, marginBottom: 16, alignItems: "center" }}>
            <input style={inputStyle} placeholder="Job title" value={jobSearchTitle} onChange={(e) => setJobSearchTitle(e.target.value)} />
            <input style={inputStyle} placeholder="Location (city, state)" value={jobSearchLocation} onChange={(e) => setJobSearchLocation(e.target.value)} />
            <Button variant="primary" icon={jobSearching ? <Loader2 size={14} className="spin" /> : <Search size={14} />} onClick={searchJobs} disabled={jobSearching}>
              {jobSearching ? "Searching..." : "Search jobs"}
            </Button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: TOKENS.ink, margin: "0 0 8px" }}>Or search directly on:</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {buildJobBoardLinks(jobSearchTitle, jobSearchLocation).map((board) => (
                <a key={board.name} href={board.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <Button variant="secondary" icon={<ExternalLink size={13} />}>{board.name}</Button>
                </a>
              ))}
            </div>
          </div>

          {jobSearchWarnings.length > 0 && (
            <div style={{ background: TOKENS.goldSoft, border: `1px solid ${TOKENS.gold}`, borderRadius: 4, padding: "8px 12px", marginBottom: 16 }}>
              {jobSearchWarnings.map((w, i) => (
                <p key={i} style={{ fontSize: 12, color: "#5C4210", margin: i === 0 ? 0 : "4px 0 0" }}>{w}</p>
              ))}
            </div>
          )}

          {jobResults && jobResults.length === 0 && jobSearchWarnings.length === 0 && (
            <p style={{ fontSize: 13, color: TOKENS.inkSoft }}>No matching postings found. Try a broader title or location.</p>
          )}

          {jobResults && jobResults.length > 0 && (
            <div>
              {jobResults.map((job, i) => (
                <div key={i} style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 3, padding: 14, marginBottom: 10, background: TOKENS.paper }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{job.title || "(untitled position)"}</p>
                      <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "2px 0 0" }}>
                        {[job.employer, job.location].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: TOKENS.inkSoft, border: `1px solid ${TOKENS.line}`, padding: "2px 6px", borderRadius: 2, whiteSpace: "nowrap" }}>
                      {job.source}
                    </span>
                  </div>
                  {job.snippet && <p style={{ fontSize: 12.5, color: "#444", margin: "8px 0 0", lineHeight: 1.5 }}>{job.snippet}…</p>}
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                      <Button variant="secondary" icon={<ExternalLink size={13} />} style={{ marginTop: 10 }}>
                        Apply on {job.source}
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
        </>
      )}

      {view === "dashboard" && (
        <Dashboard
          contactInfo={contactInfo}
          recentProjects={recentProjects}
          onResumeBuilder={() => { setMode("resume"); setStep(1); setView("wizard"); }}
          onJobTailoring={() => { setMode("application"); setStep(0); setView("wizard"); }}
          onCoverLetter={() => { setMode("coverletter"); setStep(0); setView("wizard"); }}
          onInterviewPrep={() => { setMode("interview"); setStep(0); setView("wizard"); }}
          onRemoveProject={removeRecentProject}
        />
      )}

      <p style={{ textAlign: "center", fontSize: 12, color: "#9AA3A0", marginTop: 40 }}>
        eCareer Design AI Resume Studio · {APP_VERSION}
        <br />
        <Link href="/privacy" style={{ color: "#9AA3A0", marginRight: 12 }}>Privacy Notice</Link>
        <Link href="/terms" style={{ color: "#9AA3A0", marginRight: 12 }}>Terms of Use</Link>
        <a href="mailto:hello@ecareerdesign.net" style={{ color: "#9AA3A0" }}>Contact Us</a>
      </p>
    </div>
  );
}

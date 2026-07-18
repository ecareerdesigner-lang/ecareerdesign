"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import {
  Search, FileText, Check, RefreshCw, Copy, Download,
  ChevronRight, ChevronLeft, Sparkles, AlertCircle, Save, Plus, Trash2,
  Loader2, Briefcase, GraduationCap, Award, ExternalLink,
  Mail, MessageSquare, Clock, Star, X, Send, Mic, Volume2
} 
from "lucide-react";

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

const TOTAL_BUDGET = 6000;   // Summary of Accomplishments (requirement responses), combined
const SKILLS_BUDGET = 2000;  // Special Skills & Associations, independent cap
const WORK_EXP_BUDGET = 1500; // Each work experience description, independent cap per entry
const STEPS_APPLICATION = ["Job & requirements", "Background", "Generate", "Export"];
const STEPS_RESUME = ["Get started", "Background", "Generate", "Export"];
const STEPS_COVERLETTER = ["Job Details", "Background", "Generate", "Export"];
const STEPS_INTERVIEW = ["Setup", "Background", "Mock Interview", "Report"];
const STEPS_COACH = ["Get Started", "Your Stories", "Prep for a Job", "Practice", "Mock Interview"];
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

Output STRICT, VALID JSON in exactly this shape:
{
  "score": <integer 0-100, overall match percentage>,
  "matchedSkills": ["up to 6 specific skills/qualifications from the posting that the candidate's background clearly supports"],
  "missingSkills": ["up to 6 specific skills/qualifications from the posting that the candidate's background does NOT clearly show"],
  "summary": "2-3 sentence honest assessment of fit, mentioning the strongest match and the biggest gap"
}
Every string value must be valid JSON: escape any internal double quotes as \\", and do not include literal line breaks inside any string value. Return ONLY the JSON object, no markdown fences, no commentary.`;}

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
function resumeScorePrompt(resumeText) {
  return `You are an expert resume reviewer and ATS (Applicant Tracking System) specialist. Analyze this resume and score it honestly and specifically — do not inflate scores to be encouraging.

Resume text:
${resumeText}

Output STRICT, VALID JSON in exactly this shape:
{
  "overallScore": <integer 0-100>,
  "atsScore": <integer 0-100, how well this would parse and rank in an Applicant Tracking System>,
  "keywordScore": <integer 0-100, presence of strong, relevant, industry-standard keywords and skills>,
  "formattingScore": <integer 0-100, structure, consistency, scannability>,
"weakBulletPoints": ["up to 5 specific bullet points from the resume that are vague, passive, or lack measurable impact, PARAPHRASED in your own words rather than quoted verbatim, to avoid introducing special characters"],
  "missingSkills": ["up to 6 skills or qualifications commonly expected for this type of role that are absent from the resume"],
  "employerReadiness": "2-3 sentence honest assessment of how ready this resume is to be sent to employers today, and the single biggest thing to fix first"
}
Every string value must be valid JSON: escape any internal double quotes as \\", and do not include literal line breaks inside any string value. Return ONLY the JSON object, no markdown fences, no commentary.`;
}
function matchScorePrompt(background, jobDescription, jobTitle, companyName) {
  return `You are an experienced recruiter comparing a candidate's background against a specific job posting to estimate fit.

Job title: ${jobTitle || "(not provided)"}
Company: ${companyName || "(not provided)"}
Job posting text: ${jobDescription}

Candidate background: ${JSON.stringify(background)}

Evaluate how well the candidate's actual experience, skills, and qualifications match this specific posting. Be realistic and specific — do not inflate the score to be encouraging.

Output STRICT JSON in exactly this shape:
{
  "score": <integer 0-100, overall match percentage>,
  "matchedSkills": ["up to 6 specific skills/qualifications from the posting that the candidate's background clearly supports"],
  "missingSkills": ["up to 6 specific skills/qualifications from the posting that the candidate's background does NOT clearly show"],
  "summary": "2-3 sentence honest assessment of fit, mentioning the strongest match and the biggest gap"
}
Return ONLY the JSON object, no markdown fences, no commentary.`;
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

// Builds a full formatted address ("123 Main St, Charlotte, NC 28202") from
// separate fields, gracefully collapsing down when some parts are blank
// (e.g. just "Charlotte, NC" if no street/zip were entered).
function formatAddress(c) {
  const stateZip = [c?.state, c?.zip].filter(Boolean).join(" ");
  const cityStateZip = [c?.city, stateZip].filter(Boolean).join(", ");
  return [c?.street, cityStateZip].filter(Boolean).join(", ");
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

function ResumeSidebarTemplate({ contact, data, color, photo }) {
  return (
    <div style={{ ...resumePageStyle, display: "flex", borderRadius: 4 }}>
      <div style={{ width: "34%", background: color, color: "#fff", padding: "28px 20px" }}>
        {photo && (
          <img src={photo} alt="" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.5)", marginBottom: 16, display: "block" }} />
        )}
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, margin: "0 0 4px", lineHeight: 1.2 }}>{contact.name || "Your Name"}</p>
        <div style={{ fontSize: 11, opacity: 0.9, lineHeight: 1.7, marginBottom: 22 }}>
          {contact.email && <p style={{ margin: 0 }}>{contact.email}</p>}
          {contact.phone && <p style={{ margin: 0 }}>{contact.phone}</p>}
          {formatAddress(contact) && <p style={{ margin: 0 }}>{formatAddress(contact)}</p>}
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

function ResumeClassicTemplate({ contact, data, color, photo }) {
  const sectionHeading = (label) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 10px" }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: color, opacity: 0.4 }} />
    </div>
  );
  return (
    <div style={{ ...resumePageStyle, border: `2px solid ${color}`, borderRadius: 4, padding: "32px 36px" }}>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        {photo && (
          <img src={photo} alt="" style={{ width: 92, height: 92, borderRadius: "50%", objectFit: "cover", border: `3px solid ${color}`, margin: "0 auto 14px", display: "block" }} />
        )}
        <p style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, letterSpacing: "0.03em", margin: 0 }}>{contact.name || "Your Name"}</p>
        <p style={{ fontSize: 12, color: "#555", margin: "6px 0 0" }}>
          {[formatAddress(contact), contact.phone, contact.email].filter(Boolean).join("  ·  ")}
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

function ResumeMinimalTemplate({ contact, data, color, photo }) {
  const sectionHeading = (label) => (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color, margin: "22px 0 8px" }}>{label}</p>
  );
  return (
    <div style={{ ...resumePageStyle, padding: "32px 36px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {photo && (
          <img src={photo} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        )}
        <div>
          <p style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color, margin: 0 }}>{contact.name || "Your Name"}</p>
          <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0" }}>
            {[contact.email, contact.phone, formatAddress(contact)].filter(Boolean).join("   ")}
          </p>
        </div>
      </div>

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

function ResumePreview({ template, contact, data, color, photo }) {
  if (template === "classic") return <ResumeClassicTemplate contact={contact} data={data} color={color} photo={photo} />;
  if (template === "minimal") return <ResumeMinimalTemplate contact={contact} data={data} color={color} photo={photo} />;
  return <ResumeSidebarTemplate contact={contact} data={data} color={color} photo={photo} />;
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
          {[formatAddress(contact), contact.phone, contact.email].filter(Boolean).join(" · ")}
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
          {[formatAddress(contact), contact.phone, contact.email].filter(Boolean).join("  |  ")}
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
          {[formatAddress(contact), contact.phone, contact.email].filter(Boolean).join("  |  ")}
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

function VirtualAssistant() {
  const GREETING = "Hi! I'm here to help you use eCareer Design — building a resume, tailoring an application, writing a cover letter, or prepping for an interview. What do you need help with?";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong.");
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text || "Sorry, I didn't catch that." }]);
      }
    } catch (e) {
      setError("Could not reach the assistant.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: "fixed", bottom: 96, right: 24, width: 340, maxWidth: "calc(100vw - 32px)",
            height: 460, maxHeight: "calc(100vh - 140px)", background: "#fff", borderRadius: 16,
            boxShadow: "0 8px 24px rgba(16,24,40,0.18), 0 2px 6px rgba(16,24,40,0.1)",
            display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1000,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div style={{
            background: `linear-gradient(135deg, ${TOKENS.ink}, ${TOKENS.iconDark})`,
            color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MessageSquare size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, margin: 0 }}>eCareer Design Assistant</p>
              <p style={{ fontSize: 11, margin: 0, opacity: 0.8, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} /> Here to help
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 4, display: "flex" }}
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 16px", background: TOKENS.paper }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={{
                  maxWidth: "85%", padding: "9px 13px", borderRadius: 14,
                  background: m.role === "user" ? TOKENS.accent : "#fff",
                  color: m.role === "user" ? "#fff" : TOKENS.ink,
                  fontSize: 13.5, lineHeight: 1.5,
                  boxShadow: m.role === "user" ? "none" : "0 1px 2px rgba(16,24,40,0.06)",
                  borderBottomRightRadius: m.role === "user" ? 4 : 14,
                  borderBottomLeftRadius: m.role === "user" ? 14 : 4,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                <div style={{ padding: "9px 13px", borderRadius: 14, background: "#fff", boxShadow: "0 1px 2px rgba(16,24,40,0.06)" }}>
                  <Loader2 size={14} className="spin" color={TOKENS.inkSoft} />
                </div>
              </div>
            )}
            {error && <p style={{ color: TOKENS.red, fontSize: 12, textAlign: "center", marginTop: 8 }}>{error}</p>}
          </div>

          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${TOKENS.line}`, background: "#fff" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask how to use eCareer Design..."
              rows={1}
              style={{
                flex: 1, resize: "none", border: `1px solid ${TOKENS.line}`, borderRadius: 10,
                padding: "9px 12px", fontSize: 13.5, fontFamily: "'Inter', sans-serif", outline: "none",
                maxHeight: 70,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              aria-label="Send"
              style={{
                width: 38, height: 38, borderRadius: 10, border: "none", flexShrink: 0,
                background: TOKENS.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: sending || !input.trim() ? "default" : "pointer", opacity: sending || !input.trim() ? 0.5 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
        className="cf-card-interactive"
        style={{
          position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${TOKENS.ink}, ${TOKENS.iconDark})`,
          border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 14px rgba(16,24,40,0.25)", cursor: "pointer", zIndex: 1001,
        }}
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>
    </>
  );
}

function Dashboard({ contactInfo, recentProjects, onResumeBuilder, onJobTailoring, onCoverLetter, onInterviewPrep, onInterviewCoach, onRemoveProject, weeklyAppCount, nextInterview, dashboardStatsLoaded, onPracticeInterview, newJobMatchCount, careerBackground }) {
  const [matchJobTitle, setMatchJobTitle] = useState("");
  const [matchCompanyName, setMatchCompanyName] = useState("");
  const [matchJobDescription, setMatchJobDescription] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState(null);
const [showJobMatches, setShowJobMatches] = useState(false);
  const [jobMatchesList, setJobMatchesList] = useState([]);
  const [jobMatchesLoading, setJobMatchesLoading] = useState(false);

  async function toggleJobMatches() {
    if (showJobMatches) {
      setShowJobMatches(false);
      return;
    }
    setShowJobMatches(true);
    setJobMatchesLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("job_matches")
          .select("job_title, company_name, job_url, source")
          .eq("user_id", user.id)
          .order("first_seen_at", { ascending: false })
          .limit(20);
        setJobMatchesList(data || []);
      }
    } catch (e) {
      console.error("toggleJobMatches failed:", e);
    } finally {
      setJobMatchesLoading(false);
    }
  }
  async function runMatchScore() {
    if (!matchJobDescription.trim()) return;
    setMatchLoading(true);
    setMatchError(null);
    try {
      const text = await callClaude(
        matchScorePrompt(careerBackground, matchJobDescription, matchJobTitle, matchCompanyName),
        tokensForBudget(800)
      );
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setMatchResult(parsed);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("resume_match_scores").insert({
          user_id: user.id,
          job_title: matchJobTitle || null,
          company_name: matchCompanyName || null,
          job_description: matchJobDescription,
          match_score: parsed.score,
          matched_skills: parsed.matchedSkills,
          missing_skills: parsed.missingSkills,
          summary: parsed.summary,
        });
      }
    } catch (e) {
      console.error("runMatchScore failed:", e);
      setMatchError(e?.message || "Could not score this match. Try again.");
    } finally {
      setMatchLoading(false);
    }
  }
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
{dashboardStatsLoaded && (
        <Card style={{ marginBottom: 24, background: TOKENS.paper }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accent, margin: "0 0 12px", textTransform: "uppercase" }}>
            Today's Career Dashboard
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            <div>
              <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 2px" }}>📈 Weekly goal</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>
                Apply to 15 jobs ({weeklyAppCount} completed)
              </p>
            </div>
{newJobMatchCount > 0 && (
              <div onClick={toggleJobMatches} style={{ cursor: "pointer" }}>
                <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 2px" }}>🔥 New matches</p>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.accent, textDecoration: "underline" }}>
                  {newJobMatchCount} new job{newJobMatchCount === 1 ? "" : "s"} matching your profile
                </p>
              </div>
            )}
            {nextInterview && (
              <div>
                <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 2px" }}>📅 Next interview</p>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>
                  {nextInterview.company_name || nextInterview.job_title || "Upcoming interview"} —{" "}
                  {new Date(nextInterview.interview_at).toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            )}
          </div>
          {nextInterview && (
            <Button variant="primary" icon={<Sparkles size={14} />} onClick={onPracticeInterview} style={{ marginTop: 16 }}>
              🎯 Practice for this interview
            </Button>
          )}

          {showJobMatches && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${TOKENS.line}`, paddingTop: 14 }}>
              {jobMatchesLoading ? (
                <p style={{ fontSize: 13, color: TOKENS.inkSoft }}>Loading...</p>
              ) : jobMatchesList.length === 0 ? (
                <p style={{ fontSize: 13, color: TOKENS.inkSoft }}>No matches found yet.</p>
              ) : (
                jobMatchesList.map((job, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < jobMatchesList.length - 1 ? `1px solid ${TOKENS.line}` : "none" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: TOKENS.ink }}>{job.job_title}</p>
                      <p style={{ fontSize: 12.5, color: TOKENS.inkSoft, margin: 0 }}>{job.company_name || "—"} · {job.source}</p>
                    </div>
                    {job.job_url && (
                      <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" icon={<ExternalLink size={12} />}>Apply</Button>
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      )}

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
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginBottom: 40 }}>
        <Card interactive onClick={onResumeBuilder} style={{ textAlign: "center", flex: "1 1 180px", maxWidth: 220 }}>
          <Award size={22} color={TOKENS.iconDark} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>Resume Builder</p>
        </Card>
        <Card interactive onClick={onJobTailoring} style={{ textAlign: "center", flex: "1 1 180px", maxWidth: 220 }}>
          <Briefcase size={22} color={TOKENS.iconDark} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>Job Tailoring</p>
        </Card>
        <Card interactive onClick={onCoverLetter} style={{ textAlign: "center", flex: "1 1 180px", maxWidth: 220 }}>
          <Mail size={22} color={TOKENS.iconDark} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>Cover Letter</p>
        </Card>
        <Card interactive onClick={onInterviewPrep} style={{ textAlign: "center", flex: "1 1 180px", maxWidth: 220 }}>
          <MessageSquare size={22} color={TOKENS.iconDark} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>Interview Prep</p>
        </Card>
<Card interactive onClick={onInterviewCoach} style={{ textAlign: "center", flex: "1 1 180px", maxWidth: 220 }}>
          <Sparkles size={22} color={TOKENS.iconDark} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink }}>Interview Coach</p>
        </Card>
      </div>
<div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 14px", color: TOKENS.ink }}>Resume Match Score</h2>
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Job title (optional)"
              value={matchJobTitle}
              onChange={(e) => setMatchJobTitle(e.target.value)}
              style={{ flex: 1, minWidth: 160, padding: "8px 10px", borderRadius: 8, border: `1px solid ${TOKENS.line}`, fontSize: 14 }}
            />
            <input
              type="text"
              placeholder="Company (optional)"
              value={matchCompanyName}
              onChange={(e) => setMatchCompanyName(e.target.value)}
              style={{ flex: 1, minWidth: 160, padding: "8px 10px", borderRadius: 8, border: `1px solid ${TOKENS.line}`, fontSize: 14 }}
            />
          </div>
          <textarea
            placeholder="Paste the job posting text here..."
            value={matchJobDescription}
            onChange={(e) => setMatchJobDescription(e.target.value)}
            rows={5}
            style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${TOKENS.line}`, fontSize: 14, marginBottom: 10, boxSizing: "border-box", fontFamily: "inherit" }}
          />
          <Button
            variant="primary"
            icon={matchLoading ? <Loader2 size={14} className="cf-spin" /> : <Sparkles size={14} />}
            onClick={runMatchScore}
            disabled={matchLoading || !matchJobDescription.trim()}
          >
            {matchLoading ? "Scoring..." : "Check Match"}
          </Button>

          {matchError && (
            <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>{matchError}</p>
          )}

          {matchResult && (
            <div style={{ marginTop: 18 }}>
              <p style={{ fontSize: 32, fontWeight: 700, margin: "0 0 4px", color: TOKENS.ink }}>
                {matchResult.score}%
              </p>
              <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: "0 0 14px" }}>{matchResult.summary}</p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: TOKENS.green, margin: "0 0 6px" }}>✓ Matched</p>
                  {(matchResult.matchedSkills || []).map((s, i) => (
                    <p key={i} style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 4px" }}>{s}</p>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: TOKENS.red, margin: "0 0 6px" }}>✗ Missing</p>
                  {(matchResult.missingSkills || []).map((s, i) => (
                    <p key={i} style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 4px" }}>{s}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
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
  const [view, setView] = useState("landing"); // 'landing' | 'auth' | 'pricing' | 'dashboard' | 'wizard'
  const [currentUser, setCurrentUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
const [resumeScoreFile, setResumeScoreFile] = useState(null);
  const [resumeScoreLoading, setResumeScoreLoading] = useState(false);
  const [resumeScoreError, setResumeScoreError] = useState("");
  const [resumeScoreResult, setResumeScoreResult] = useState(null);
  const [returnToView, setReturnToView] = useState("landing");
useEffect(() => {
    async function loadSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user || null);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .maybeSingle();
        setIsPremium(!!profile?.is_premium);
      }
      setAuthChecked(true);
    }
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      if (_event === "SIGNED_OUT") {
        setIsPremium(false);
        setView("landing");
      }
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);
async function handleAuthSubmit() {
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").insert({ id: data.user.id, is_premium: false });
        }
        setCurrentUser(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setCurrentUser(data.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", data.user.id)
          .maybeSingle();
        setIsPremium(!!profile?.is_premium);
      }
      setAuthEmail("");
      setAuthPassword("");
      setView(returnToView);
      setReturnToView("landing");
    } catch (e) {
      setAuthError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }
  async function handleCheckout() {
    if (!currentUser) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, email: currentUser.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutLoading(false);
      }
    } catch (e) {
      console.error("handleCheckout failed:", e);
      setCheckoutLoading(false);
    }
  }

  async function runResumeScore() {
    if (!resumeScoreFile) return;
    setResumeScoreLoading(true);
    setResumeScoreError("");
    setResumeScoreResult(null);
    try {
      const formData = new FormData();
      formData.append("file", resumeScoreFile);
      const parseRes = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const parseData = await parseRes.json();
      if (!parseRes.ok || parseData.error) {
        throw new Error(parseData.error || "Could not read this file.");
      }

      let parsed;
      try {
        const text = await callClaude(resumeScorePrompt(parseData.text), tokensForBudget(1200));
        const cleaned = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn("First scoring attempt failed to parse, retrying once:", parseErr);
        const text2 = await callClaude(resumeScorePrompt(parseData.text), tokensForBudget(1200));
        const cleaned2 = text2.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(cleaned2);
      }
      setResumeScoreResult(parsed);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("resume_scores").insert({
          user_id: user.id,
          filename: resumeScoreFile.name,
          overall_score: parsed.overallScore,
          ats_score: parsed.atsScore,
          keyword_score: parsed.keywordScore,
          formatting_score: parsed.formattingScore,
          weak_bullet_points: parsed.weakBulletPoints,
          missing_skills: parsed.missingSkills,
          employer_readiness: parsed.employerReadiness,
        });

        fetch("/api/send-resume-score-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            overallScore: parsed.overallScore,
            atsScore: parsed.atsScore,
            keywordScore: parsed.keywordScore,
            formattingScore: parsed.formattingScore,
            weakBulletPoints: parsed.weakBulletPoints,
            missingSkills: parsed.missingSkills,
            employerReadiness: parsed.employerReadiness,
          }),
        }).catch((e) => console.error("send-resume-score-email failed:", e));
      }
    } catch (e) {
      console.error("runResumeScore failed:", e);
      setResumeScoreError(e.message || "Something went wrong scoring your resume. Please try again.");
    } finally {
      setResumeScoreLoading(false);
    }
  }
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null); // 'application' | 'resume'
  const [jobTitle, setJobTitle] = useState("");
  const [rawPosting, setRawPosting] = useState("");
  const [selectedLib, setSelectedLib] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");

  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "", street: "", city: "", state: "", zip: "" });
  const [resumePhoto, setResumePhoto] = useState(null);
  const photoInputRef = useRef(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [resumeData, setResumeData] = useState(null);
  const [resumeGenerating, setResumeGenerating] = useState(false);
  const [resumeError, setResumeError] = useState(false);
  const [resumeTemplate, setResumeTemplate] = useState("sidebar");
  const [resumeColor, setResumeColor] = useState(RESUME_COLORS[0]);
  const resumeExportRef = useRef(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [clCompanyName, setClCompanyName] = useState("");
  const [clCompanyStreet, setClCompanyStreet] = useState("");
  const [clCompanyCity, setClCompanyCity] = useState("");
  const [clCompanyState, setClCompanyState] = useState("");
  const [clCompanyZip, setClCompanyZip] = useState("");
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
const [careerStories, setCareerStories] = useState([]);
const [coachQuestions, setCoachQuestions] = useState(null);
  const [coachQuestionsGenerating, setCoachQuestionsGenerating] = useState(false);
  const [coachQuestionsError, setCoachQuestionsError] = useState("");
const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceScore, setPracticeScore] = useState(null);
  const [practiceScoring, setPracticeScoring] = useState(false);
  const [practiceError, setPracticeError] = useState("");
const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);  
const [mockIndex, setMockIndex] = useState(0);
  const [mockAnswer, setMockAnswer] = useState("");
  const [mockScores, setMockScores] = useState([]);
  const [mockScoring, setMockScoring] = useState(false);
  const [mockError, setMockError] = useState("");
const [mockCurrentQuestion, setMockCurrentQuestion] = useState(null);
  const [mockQuestionCount, setMockQuestionCount] = useState(0);
  const [mockGeneratingQuestion, setMockGeneratingQuestion] = useState(false);
  const [mockComplete, setMockComplete] = useState(false);
const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyCompany, setApplyCompany] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [applyInterviewDate, setApplyInterviewDate] = useState("");
  const [applySaving, setApplySaving] = useState(false);
  const [applySaved, setApplySaved] = useState(false);
  const [weeklyAppCount, setWeeklyAppCount] = useState(0);
  const [nextInterview, setNextInterview] = useState(null);
  const [dashboardStatsLoaded, setDashboardStatsLoaded] = useState(false);
const [newJobMatchCount, setNewJobMatchCount] = useState(0);
const [mockListening, setMockListening] = useState(false);
  const [mockSpeaking, setMockSpeaking] = useState(false);
  const mockRecognitionRef = useRef(null);
const [coachExtracting, setCoachExtracting] = useState(false);
  const [coachExtractError, setCoachExtractError] = useState("");
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
const [jobMatchResults, setJobMatchResults] = useState({});
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
    function loadVoices() {
      window.speechSynthesis?.getVoices();
    }
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);
useEffect(() => {
    async function loadProfile() {
      let loadedFromCloud = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: row } = await supabase
            .from("resume_profiles")
            .select("profile_data")
            .eq("user_id", user.id)
            .maybeSingle();
          if (row?.profile_data) {
            const saved = row.profile_data;
            if (saved.workExperience) setWorkExperience(saved.workExperience);
            if (saved.education) setEducation(saved.education);
            if (saved.trainingEntries) setTrainingEntries(saved.trainingEntries);
            if (saved.trainingPasteText) setTrainingPasteText(saved.trainingPasteText);
            if (saved.additionalContext) setAdditionalContext(saved.additionalContext);
            if (saved.contactInfo) setContactInfo(saved.contactInfo);
            if (saved.resumePhoto) setResumePhoto(saved.resumePhoto);
            if (saved.jobTitle) setJobTitle(saved.jobTitle);
            if (saved.selectedLib) setSelectedLib(saved.selectedLib);
            if (saved.requirements?.length) {
              setRequirements(saved.requirements);
              setBudgets(evenBudgets(saved.requirements));
            }
            if (saved.clCompanyName) setClCompanyName(saved.clCompanyName);
            if (saved.clCompanyStreet) setClCompanyStreet(saved.clCompanyStreet);
            if (saved.clCompanyCity) setClCompanyCity(saved.clCompanyCity);
            if (saved.clCompanyState) setClCompanyState(saved.clCompanyState);
            if (saved.clCompanyZip) setClCompanyZip(saved.clCompanyZip);
            if (saved.clJobTitle) setClJobTitle(saved.clJobTitle);
            if (saved.clHiringManager) setClHiringManager(saved.clHiringManager);
            loadedFromCloud = true;
          }
        }
      } catch (e) {
        console.error("Cloud load error", e);
      }
      if (loadedFromCloud) return;
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
          if (saved.resumePhoto) setResumePhoto(saved.resumePhoto);
          if (saved.jobTitle) setJobTitle(saved.jobTitle);
          if (saved.selectedLib) setSelectedLib(saved.selectedLib);
          if (saved.requirements?.length) {
            setRequirements(saved.requirements);
            setBudgets(evenBudgets(saved.requirements));
          }
          if (saved.clCompanyName) setClCompanyName(saved.clCompanyName);
          if (saved.clCompanyStreet) setClCompanyStreet(saved.clCompanyStreet);
          if (saved.clCompanyCity) setClCompanyCity(saved.clCompanyCity);
          if (saved.clCompanyState) setClCompanyState(saved.clCompanyState);
          if (saved.clCompanyZip) setClCompanyZip(saved.clCompanyZip);
          if (saved.clJobTitle) setClJobTitle(saved.clJobTitle);
          if (saved.clHiringManager) setClHiringManager(saved.clHiringManager);
        }
      } catch (e) {
        // no saved profile yet
      }
    }
    loadProfile();
  }, [currentUser]);
useEffect(() => {
   loadDashboardStats();
  }, [currentUser]);
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

const saveProfile = useCallback(async () => {
    const profileData = {
      workExperience, education, trainingEntries, trainingPasteText, additionalContext, contactInfo, resumePhoto,
      jobTitle, selectedLib, requirements,
      clCompanyName, clCompanyStreet, clCompanyCity, clCompanyState, clCompanyZip, clJobTitle, clHiringManager,
    };
    try {
      localStorage.setItem("ecareerdesign-profile", JSON.stringify(profileData));
    } catch (e) {
      console.error("Storage error", e);
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("resume_profiles").upsert({
          user_id: user.id,
          profile_data: profileData,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
    } catch (e) {
      console.error("Cloud save error", e);
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1800);
  }, [
    workExperience, education, trainingEntries, trainingPasteText, additionalContext, contactInfo, resumePhoto,
    jobTitle, selectedLib, requirements,
    clCompanyName, clCompanyStreet, clCompanyCity, clCompanyState, clCompanyZip, clJobTitle, clHiringManager,
  ]);

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
      const text = await callClaude(resumePrompt(bg, contactInfo), 10000);
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
        companyAddress: formatAddress({ street: clCompanyStreet, city: clCompanyCity, state: clCompanyState, zip: clCompanyZip }),
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

function coachStoriesPrompt(background) {
    return `You are helping a job candidate build a personal "interview story bank" from their career background. Read the background below and identify 4 to 8 distinct, concrete accomplishments or experiences that could be used to answer behavioral interview questions.

For each one, write it in STAR format (Situation, Task, Action, Result) as flowing narrative text — do not include visible "Situation:"/"Task:"/"Action:"/"Result:" labels. Only use details actually present in the background below — do not invent specifics (names, numbers, dates) that weren't provided.

Categorize each story into ONE of these categories: "Leadership", "Process Improvement", "Conflict Resolution", "Customer Service", "Project Management", "Failure or Learning", "Teamwork", "Problem Solving".

Candidate background: ${JSON.stringify(background)}

Output STRICT JSON in exactly this shape, nothing else:
[
  {
    "title": "Short descriptive title, a few words",
    "category": "One of the categories above",
    "situation": "...",
    "task": "...",
    "action": "...",
    "result": "...",
    "competencies": ["short tag", "short tag"]
  }
]

Return ONLY the JSON array. No markdown fences, no commentary. If the background doesn't contain enough detail for a solid story in a category, skip that category rather than inventing one.`;
  }

  async function extractCareerStories() {
    setCoachExtracting(true);
    setCoachExtractError("");
    try {
      const background = buildBackground();
      const text = await callClaude(coachStoriesPrompt(background), 3200);
      const stories = parseJsonArray(text);
      const withIds = stories.map((s) => ({ ...s, id: newId("story") }));
      setCareerStories(withIds);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const rows = withIds.map((s) => ({
          user_id: user.id,
          category: s.category || "Teamwork",
          title: s.title || "Untitled story",
          situation: s.situation || "",
          task: s.task || "",
          action: s.action || "",
          result: s.result || "",
          competencies: s.competencies || [],
        }));
       const { data: insertedRows, error: insertError } = await supabase.from("career_stories").insert(rows).select();
if (insertError) throw insertError;
if (insertedRows) {
 setCareerStories(withIds.map((s, i) => ({ ...s, id: insertedRows[i]?.id || s.id })));
     }
      }
      setStep(1);
    } 
catch (e) {
      console.error("extractCareerStories failed:", e);
      setCoachExtractError(e?.message || "Could not extract stories from your background.");
    } finally {
      setCoachExtracting(false);
    }
  }
function coachQuestionsPrompt(jobTitleText, jobRequirements, stories) {
    const reqList = (jobRequirements || []).map((r) => r.text).join(" | ");
    const storySummaries = stories.map((s) => `[${s.id}] (${s.category}) ${s.title}: ${s.situation} ${s.action} ${s.result}`).join("\n");
    return `You are a hiring manager preparing realistic interview questions for a candidate applying to "${jobTitleText || "this role"}".

${reqList ? `The job's key requirements are: ${reqList}` : "No specific job requirements were provided — generate general but realistic questions for this type of role."}

The candidate has the following interview stories already prepared:
${storySummaries || "(no stories available)"}

Generate 6 to 8 realistic interview questions a hiring manager would actually ask for this role. For each question, pick the SINGLE best-matching story ID from the list above (or null if none of the stories fit well), and write a short 1-2 sentence tip on how to adapt that story to this specific question.

Output STRICT JSON in exactly this shape, nothing else:
[
  {
    "question": "...",
    "category": "Behavioral | Technical | Situational | Resume-based | Closing",
    "matchedStoryId": "the [id] from above, or null",
    "tip": "short adaptation tip"
  }
]

Return ONLY the JSON array. No markdown fences, no commentary.`;
  }

  async function generateCoachQuestions() {
    setCoachQuestionsGenerating(true);
    setCoachQuestionsError("");
    try {
      const text = await callClaude(
        coachQuestionsPrompt(jobTitle || selectedLib?.title, requirements, careerStories),
        3200
      );
      const questions = parseJsonArray(text);
      setCoachQuestions(questions.map((q) => ({ ...q, id: newId("cq") })));
    } catch (e) {
      console.error("generateCoachQuestions failed:", e);
      setCoachQuestionsError(e?.message || "Could not generate questions.");
    } finally {
      setCoachQuestionsGenerating(false);
    }
  }
function scoreAnswerPrompt(question, answer, matchedStory) {
    return `You are an experienced interview coach giving honest, constructive feedback on a practice answer.

Question asked: "${question}"

Candidate's answer: "${answer}"

${matchedStory ? `For reference, the story this question was meant to draw from: ${matchedStory.situation} ${matchedStory.action} ${matchedStory.result}` : ""}

Score the answer on each dimension from 1 to 10:
- communication: clarity, structure, conciseness
- confidence: hedging language, filler words, assertiveness
- relevance: does the answer actually address the question asked
- starStructure: presence and completeness of Situation-Task-Action-Result components
- specificity: concrete details vs. vague generalities
- results: quantified or clear outcomes present

Then give a short "strengths" note (1-2 sentences on what worked) and an "improvements" note (1-2 sentences on what to add or change), and an "overall" score from 1 to 10.

Output STRICT JSON in exactly this shape, nothing else:
{
  "communication": 0,
  "confidence": 0,
  "relevance": 0,
  "starStructure": 0,
  "specificity": 0,
  "results": 0,
  "overall": 0,
  "strengths": "...",
  "improvements": "..."
}

Return ONLY the JSON object. No markdown fences, no commentary.`;
  }

  async function scorePracticeAnswer() {
    setPracticeScoring(true);
    setPracticeError("");
    try {
      const matched = careerStories.find((s) => s.id === practiceQuestion?.matchedStoryId);
      const text = await callClaude(
        scoreAnswerPrompt(practiceQuestion?.question, practiceAnswer, matched),
        1200
      );
      const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
      const score = JSON.parse(cleaned);
      setPracticeScore(score);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: session } = await supabase
          .from("interview_sessions")
          .insert({ user_id: user.id, mode: "practice", job_title: jobTitle || selectedLib?.title || null, status: "completed" })
          .select()
          .single();
        const { data: qRow } = await supabase
          .from("interview_questions")
          .insert({ session_id: session.id, question_text: practiceQuestion?.question, question_category: practiceQuestion?.category })
          .select()
          .single();
        const { data: rRow } = await supabase
          .from("interview_responses")
          .insert({ question_id: qRow.id, matched_story_id: matched?.id || null, user_response_text: practiceAnswer, response_source: "user_spoken" })
          .select()
          .single();
        const { error: scoreError } = await supabase.from("response_scores").insert({
          response_id: rRow.id,
          communication_score: score.communication,
          confidence_score: score.confidence,
          relevance_score: score.relevance,
          star_structure_score: score.starStructure,
          specificity_score: score.specificity,
          results_score: score.results,
          overall_score: score.overall,
          strengths: score.strengths,
          improvement_suggestions: score.improvements,
        });
        if (scoreError) throw scoreError;
      }
    } catch (e) {
      console.error("scorePracticeAnswer failed:", e);
      setPracticeError(e?.message || "Could not score your answer.");
    } finally {
      setPracticeScoring(false);
    }
  }
function toggleVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPracticeError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = practiceAnswer ? practiceAnswer + " " : "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += chunk + " ";
        } else {
          interim += chunk;
        }
      }
      setPracticeAnswer(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      setPracticeError(`Voice input error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

 function speakQuestion(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;

 const preferredNames = [
      "Aria Online (Natural)",
      "Ava Online (Natural)",
      "Jenny Online (Natural)",
      "Libby Online (Natural)",
    ];

    const voices = window.speechSynthesis.getVoices();
    let chosen = null;
    for (const name of preferredNames) {
      chosen = voices.find((v) => v.name.includes(name));
      if (chosen) break;
    }
    if (!chosen) {
      chosen = voices.find((v) => v.lang === "en-US" && /natural|neural/i.test(v.name));
    }
    if (!chosen) {
      chosen = voices.find((v) => v.lang === "en-US");
    }
    if (chosen) utterance.voice = chosen;

    utterance.onstart = () => setMockSpeaking(true);
    utterance.onend = () => setMockSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function toggleMockVoiceInput() {
    if (mockListening) {
      mockRecognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMockError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = mockAnswer ? mockAnswer + " " : "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += chunk + " ";
        } else {
          interim += chunk;
        }
      }
      setMockAnswer(finalTranscript + interim);
    };

    recognition.onerror = (event) => {
      setMockError(`Voice input error: ${event.error}`);
      setMockListening(false);
    };

    recognition.onend = () => {
      setMockListening(false);
    };

    mockRecognitionRef.current = recognition;
    recognition.start();
    setMockListening(true);
  }
async function scoreAndAdvanceMock() {
    setMockScoring(true);
    setMockError("");
    try {
      const matched = careerStories.find((s) => s.id === mockCurrentQuestion?.matchedStoryId);
      const text = await callClaude(
        scoreAnswerPrompt(mockCurrentQuestion?.question, mockAnswer, matched),
        1200
      );
      const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
      const score = JSON.parse(cleaned);
      const newHistory = [...mockScores, { question: mockCurrentQuestion?.question, answer: mockAnswer, score }];
      setMockScores(newHistory);
      setMockAnswer("");
      setMockScoring(false);
      await generateNextMockQuestion(newHistory);
    } catch (e) {
      console.error("scoreAndAdvanceMock failed:", e);
      setMockError(e?.message || "Could not score your answer.");
      setMockScoring(false);
    }
  }
  
function nextQuestionPrompt(jobTitleText, jobRequirements, stories, history) {
    const reqList = (jobRequirements || []).map((r) => r.text).join(" | ");
    const storySummaries = stories.map((s) => `[${s.id}] (${s.category}) ${s.title}: ${s.situation} ${s.action} ${s.result}`).join("\n");
    const historyText = history.length
      ? history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join("\n\n")
      : "(This is the first question of the interview.)";

    return `You are an experienced, attentive hiring manager conducting a live interview for "${jobTitleText || "this role"}". You've asked ${history.length} question${history.length === 1 ? "" : "s"} so far.

${reqList ? `Key job requirements: ${reqList}` : ""}

Candidate's prepared stories (for your reference only, to judge if their answers align with real experience):
${storySummaries || "(none available)"}

Conversation so far:
${historyText}

Decide what to ask next, the way a real interviewer would:
- If the candidate's last answer was vague, lacked a measurable result, or left something unclear, ask a natural, SHORT follow-up digging into that specific gap (e.g., "Can you quantify that?" or "What was the outcome?"). Only do this occasionally, not after every answer.
- Otherwise, move to a new, distinct topic or competency not yet covered.
- Keep questions realistic and conversational, the way a real hiring manager talks — not stiff or robotic.
- If ${history.length} questions have already been asked and you believe you've covered enough ground (typically 6-8 questions total), set "wrapUp" to true instead of asking another question.

Output STRICT JSON in exactly this shape, nothing else:
{
  "wrapUp": false,
  "question": "the next question to ask, or empty string if wrapUp is true",
  "category": "Behavioral | Technical | Situational | Follow-up | Closing",
  "isFollowUp": false
}

Return ONLY the JSON object. No markdown fences, no commentary.`;
  }

  async function generateNextMockQuestion(history) {
    setMockGeneratingQuestion(true);
    setMockError("");
    try {
      const text = await callClaude(
        nextQuestionPrompt(jobTitle || selectedLib?.title, requirements, careerStories, history),
        800
      );
      const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
      const result = JSON.parse(cleaned);

      if (result.wrapUp || history.length >= 8) {
        setMockComplete(true);
        setMockCurrentQuestion(null);
        window.speechSynthesis?.cancel();
        return;
      }

      const q = { question: result.question, category: result.category || "Behavioral", isFollowUp: !!result.isFollowUp, id: newId("mq") };
      setMockCurrentQuestion(q);
      setMockQuestionCount(history.length + 1);
    } catch (e) {
      console.error("generateNextMockQuestion failed:", e);
      setMockError(e?.message || "Could not generate the next question.");
    } finally {
      setMockGeneratingQuestion(false);
    }
  }
async function saveApplication() {
    setApplySaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("job_applications").insert({
        user_id: user.id,
        company_name: applyCompany || null,
        job_title: jobTitle || selectedLib?.title || null,
        job_url: applyUrl || null,
        match_score: null,
        interview_at: applyInterviewDate ? new Date(applyInterviewDate).toISOString() : null,
      });
      if (error) throw error;
      setApplySaved(true);
      setApplyCompany("");
      setApplyUrl("");
      setApplyInterviewDate("");
      setTimeout(() => { setShowApplyForm(false); setApplySaved(false); }, 1500);
    } catch (e) {
      console.error("saveApplication failed:", e);
    } finally {
      setApplySaving(false);
    }
  }
 async function loadDashboardStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setDashboardStatsLoaded(true); return; }

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("applied_at", startOfWeek.toISOString());
      setWeeklyAppCount(count || 0);
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: newJobMatches } = await supabase
        .from("job_matches")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("first_seen_at", oneDayAgo);
      console.log("newJobMatches count:", newJobMatches);
      setNewJobMatchCount(newJobMatches || 0);

      const { data: upcoming } = await supabase
        .from("job_applications")
        .select("company_name, job_title, interview_at")
        .eq("user_id", user.id)
        .not("interview_at", "is", null)
        .gte("interview_at", new Date().toISOString())
        .order("interview_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setNextInterview(upcoming || null);
    } catch (e) {
      console.error("loadDashboardStats failed:", e);
    } finally {
      setDashboardStatsLoaded(true);
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
    const contactLine = [contactInfo.email, contactInfo.phone, formatAddress(contactInfo)].filter(Boolean).join(" | ");
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
    const contactLine = [contactInfo.email, contactInfo.phone, formatAddress(contactInfo)].filter(Boolean).join(" | ");
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

  function handlePhotoUpload(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    setPhotoError("");
    setPhotoProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize down to a reasonable max dimension and re-encode as JPEG —
        // keeps localStorage usage and PDF export size small regardless of
        // how large the original photo was.
        const MAX_DIM = 500;
        let { width, height } = img;
        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        setResumePhoto(canvas.toDataURL("image/jpeg", 0.88));
        setPhotoProcessing(false);
      };
      img.onerror = () => {
        setPhotoError("Could not read that image. Try a different file.");
        setPhotoProcessing(false);
      };
      img.src = reader.result;
    };
    reader.onerror = () => {
      setPhotoError("Could not read that file.");
      setPhotoProcessing(false);
    };
    reader.readAsDataURL(file);
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
    if (resumeData && !jobSearchLocation && (contactInfo.city || contactInfo.state)) {
      setJobSearchLocation([contactInfo.city, contactInfo.state].filter(Boolean).join(", "));
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
async function runJobCardMatch(job, key) {
    if (!currentUser || !isPremium) {
      setView("pricing");
      return;
    }
    setJobMatchResults((r) => ({ ...r, [key]: { loading: true, error: null, result: null } }));
    try {
      const jobDescText = job.description || job.snippet || "";
      const background = buildBackground();
      const text = await callClaude(
        matchScorePrompt(background, jobDescText, job.title, job.employer),
        tokensForBudget(800)
      );
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setJobMatchResults((r) => ({ ...r, [key]: { loading: false, error: null, result: parsed } }));

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("resume_match_scores").insert({
          user_id: user.id,
          job_title: job.title || null,
          company_name: job.employer || null,
          job_description: jobDescText,
          match_score: parsed.score,
          matched_skills: parsed.matchedSkills,
          missing_skills: parsed.missingSkills,
          summary: parsed.summary,
        });
      }
    } catch (e) {
      console.error("runJobCardMatch failed:", e);
      setJobMatchResults((r) => ({ ...r, [key]: { loading: false, error: "Could not score this match.", result: null } }));
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
      <style suppressHydrationWarning>{`
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
{view === "landing" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.75rem" }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 40, margin: 0, letterSpacing: "-0.01em" }}>
              eCareer Design
            </h1>
            {authChecked && (
              currentUser ? (
                <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); }}>
                  Log Out
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setView("auth")}>
                  Log In
                </Button>
              )
            )}
          </div>

         <p style={{ fontSize: 18, color: TOKENS.inkSoft, margin: "0 0 32px", maxWidth: 560, lineHeight: 1.5 }}>
            Land more interviews with AI-powered resumes, STAR responses, and interview coaching.
          </p>

          <Card
            interactive
            onClick={() => {
              if (currentUser) {
                setView("resumescore");
              } else {
                setReturnToView("resumescore");
                setView("auth");
              }
            }}
            style={{ marginBottom: 24, border: `2px solid ${TOKENS.accent}` }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accent, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Free · Takes 30 seconds
            </p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, margin: "0 0 8px", color: TOKENS.ink }}>
              Get Your Free Resume Score
            </h2>
            <p style={{ fontSize: 14.5, color: TOKENS.inkSoft, margin: "0 0 4px", lineHeight: 1.5 }}>
              Upload your resume and get an instant Overall Score, ATS Score, Keyword Score, Formatting Score, weak bullet points, missing skills, and an honest Employer Readiness assessment.
            </p>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
            <Card interactive onClick={() => { setMode("resume"); setStep(1); setView("wizard"); }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 6px" }}>Resume Builder</h3>
              <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: 0 }}>Build an ATS-friendly resume in minutes.</p>
            </Card>
            <Card interactive onClick={() => { setMode("application"); setStep(0); setView("wizard"); }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 6px" }}>Job Tailoring</h3>
              <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: 0 }}>Tailored STAR responses for any posting.</p>
            </Card>
            <Card interactive onClick={() => { setMode("coverletter"); setStep(0); setView("wizard"); }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 6px" }}>Cover Letter</h3>
              <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: 0 }}>Generate a matching cover letter.</p>
            </Card>
           <Card interactive onClick={() => setView("jobsearch")}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, margin: "0 0 6px" }}>Job Search</h3>
              <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: 0 }}>Search real postings across USAJOBS, Adzuna &amp; Jooble.</p>
            </Card>
          </div>

          <Card style={{ background: TOKENS.ink, border: "none" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accentSoft, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Premium
            </p>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, margin: "0 0 8px", color: "#fff" }}>
              Career Dashboard, Interview Coach &amp; Resume Match Scoring
            </h3>
            <p style={{ fontSize: 14, color: "#C9D2DD", margin: "0 0 18px", maxWidth: 520, lineHeight: 1.5 }}>
              Track applications, practice live mock interviews with AI coaching, and see how well your resume matches any job posting.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                if (currentUser && isPremium) {
                  setView("dashboard");
                } else {
                  setView("pricing");
                }
              }}
            >
              {currentUser && isPremium ? "Go to Dashboard" : "See Premium Plans"}
            </Button>
          </Card>
        </div>
      )}
      {view === "auth" && (
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <h1
            className="cf-brand"
            onClick={() => setView("landing")}
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 32, margin: "0 0 24px", letterSpacing: "-0.01em", cursor: "pointer" }}
          >
            eCareer Design
          </h1>
          <Card>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, margin: "0 0 4px" }}>
              {authMode === "signup" ? "Create your account" : "Log in"}
            </h2>
            <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
              {authMode === "signup" ? "Already have an account? " : "Don't have an account yet? "}
              <span
                onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }}
                style={{ color: TOKENS.accent, cursor: "pointer", fontWeight: 500 }}
              >
                {authMode === "signup" ? "Log in" : "Sign up"}
              </span>
            </p>

            <Field label="Email">
              <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </Field>

            {authError && (
              <p style={{ color: TOKENS.red, fontSize: 13, margin: "0 0 14px" }}>{authError}</p>
            )}

            <Button
              variant="primary"
              icon={authLoading ? <Loader2 size={14} className="cf-spin" /> : null}
              disabled={authLoading || !authEmail || !authPassword}
              onClick={handleAuthSubmit}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {authLoading ? "Please wait..." : authMode === "signup" ? "Sign up" : "Log in"}
            </Button>
          </Card>
        </div>
      )}
{view === "pricing" && (
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => setView("landing")}>← Home</Button>

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 40, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
              Choose your plan
            </h1>
            <p style={{ fontSize: 17, color: TOKENS.inkSoft, margin: 0 }}>
              Start free. Upgrade whenever you're ready to move faster.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>

            <Card style={{ padding: 32 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 6px", color: TOKENS.ink }}>Free</h2>
              <p style={{ fontSize: 15, color: TOKENS.inkSoft, margin: "0 0 20px", lineHeight: 1.5 }}>
                Everything you need to build a standout application.
              </p>
              <p style={{ fontSize: 34, fontWeight: 700, color: TOKENS.ink, margin: "0 0 24px" }}>$0</p>

              <div style={{ borderTop: `1px solid ${TOKENS.line}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={18} color={TOKENS.green} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px", color: TOKENS.ink }}>Resume Builder</p>
                    <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.5 }}>Build an ATS-friendly resume in minutes.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={18} color={TOKENS.green} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px", color: TOKENS.ink }}>Job Tailoring</p>
                    <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.5 }}>Tailored STAR responses for any posting.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={18} color={TOKENS.green} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px", color: TOKENS.ink }}>Cover Letter</p>
                    <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.5 }}>Generate a matching cover letter.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={18} color={TOKENS.green} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px", color: TOKENS.ink }}>Job Search</p>
                    <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.5 }}>Search real postings across USAJOBS, Adzuna &amp; Jooble.</p>
                  </div>
                </div>
              </div>

              <Button variant="secondary" onClick={() => setView(currentUser ? "landing" : "auth")} style={{ width: "100%", justifyContent: "center" }}>
                Get Started Free
              </Button>
            </Card>

            <Card style={{ background: TOKENS.ink, border: "none", padding: 32 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accentSoft, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Premium
              </p>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 6px", color: "#fff" }}>Everything you need to land the offer</h2>
              <p style={{ fontSize: 15, color: "#C9D2DD", margin: "0 0 20px", lineHeight: 1.5 }}>
                Prep smarter, track everything, and know exactly where you stand.
              </p>
              <p style={{ fontSize: 34, fontWeight: 700, color: "#fff", margin: "0 0 24px" }}>
                $9.99<span style={{ fontSize: 16, fontWeight: 400, color: "#C9D2DD" }}> /mo</span>
              </p>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accentSoft, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Everything in Free, plus:
                </p>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={18} color={TOKENS.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px", color: "#fff" }}>Career Dashboard</p>
                    <p style={{ fontSize: 13.5, color: "#C9D2DD", margin: 0, lineHeight: 1.5 }}>
                      Track applications, set weekly goals, and get notified of new job matches automatically, every day.
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={18} color={TOKENS.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px", color: "#fff" }}>Interview Coach</p>
                    <p style={{ fontSize: 13.5, color: "#C9D2DD", margin: 0, lineHeight: 1.5 }}>
                      Extract your best career stories, practice job-specific questions, and run full adaptive mock interviews with voice and AI scoring.
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={18} color={TOKENS.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px", color: "#fff" }}>Resume Match Scoring</p>
                    <p style={{ fontSize: 13.5, color: "#C9D2DD", margin: 0, lineHeight: 1.5 }}>
                      See exactly how well your resume matches any job posting, with a breakdown of what's missing.
                    </p>
                  </div>
                </div>
              </div>
<Button
                variant="primary"
                icon={checkoutLoading ? <Loader2 size={16} className="cf-spin" /> : null}
                disabled={checkoutLoading}
                onClick={() => (currentUser ? handleCheckout() : setView("auth"))}
                style={{ width: "100%", justifyContent: "center", fontSize: 16, padding: "14px 20px" }}
              >
                {checkoutLoading ? "Redirecting to checkout..." : !currentUser ? "Sign up first — $9.99/mo" : "Subscribe — $9.99/mo"}
              </Button>
            </Card>

          </div>

          {!currentUser && (
            <p style={{ fontSize: 14, color: TOKENS.inkSoft, textAlign: "center" }}>
              Don't have an account yet?{" "}
              <span onClick={() => setView("auth")} style={{ color: TOKENS.accent, cursor: "pointer", fontWeight: 500 }}>
                Sign up first
              </span>
            </p>
          )}
        </div>
      )}
{view === "jobsearch" && (
        <div>
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => setView("landing")}>← Home</Button>
          <Card>
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
                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                          <Button variant="secondary" icon={<ExternalLink size={13} />}>
                            Apply on {job.source}
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="secondary"
                        icon={jobMatchResults[i]?.loading ? <Loader2 size={13} className="cf-spin" /> : <Sparkles size={13} />}
                        onClick={() => runJobCardMatch(job, i)}
                        disabled={jobMatchResults[i]?.loading}
                      >
                        {jobMatchResults[i]?.loading ? "Scoring..." : "Check Match %"}
                      </Button>
                    </div>

                    {jobMatchResults[i]?.error && (
                      <p style={{ color: TOKENS.red, fontSize: 12.5, marginTop: 8 }}>{jobMatchResults[i].error}</p>
                    )}

                    {jobMatchResults[i]?.result && (
                      <div style={{ marginTop: 10, padding: 10, borderRadius: 6, background: TOKENS.surface, border: `1px solid ${TOKENS.line}` }}>
                        <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: TOKENS.ink }}>
                          {jobMatchResults[i].result.score}% match
                        </p>
                        <p style={{ fontSize: 12.5, color: TOKENS.inkSoft, margin: "0 0 8px" }}>{jobMatchResults[i].result.summary}</p>
                        {jobMatchResults[i].result.missingSkills?.length > 0 && (
                          <p style={{ fontSize: 12, color: TOKENS.red, margin: 0 }}>
                            Missing: {jobMatchResults[i].result.missingSkills.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
{view === "resumescore" && (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => setView("landing")}>← Home</Button>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 34, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
              Free Resume Score
            </h1>
            <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: 0 }}>
              Upload your resume and get an instant, honest breakdown — ATS compatibility, keyword strength, formatting, and what's holding you back.
            </p>
          </div>

          <Card>
            {!resumeScoreResult && (
              <>
                <div style={{ border: `2px dashed ${TOKENS.line}`, borderRadius: 8, padding: 32, textAlign: "center", marginBottom: 16 }}>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    id="resumeScoreFileInput"
                    style={{ display: "none" }}
                    onChange={(e) => setResumeScoreFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="resumeScoreFileInput" style={{ cursor: "pointer" }}>
                    <FileText size={28} color={TOKENS.accent} style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: 15, fontWeight: 600, color: TOKENS.ink, margin: "0 0 4px" }}>
                      {resumeScoreFile ? resumeScoreFile.name : "Click to upload your resume"}
                    </p>
                    <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>PDF or Word (.docx)</p>
                  </label>
                </div>

                <Button
                  variant="primary"
                  icon={resumeScoreLoading ? <Loader2 size={14} className="cf-spin" /> : <Sparkles size={14} />}
                  disabled={!resumeScoreFile || resumeScoreLoading}
                  onClick={runResumeScore}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {resumeScoreLoading ? "Analyzing your resume..." : "Get My Free Score"}
                </Button>

                {resumeScoreError && (
                  <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 12 }}>{resumeScoreError}</p>
                )}
              </>
            )}

            {resumeScoreResult && (
              <div>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: TOKENS.inkSoft, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px" }}>
                    Overall Score
                  </p>
                  <p style={{ fontSize: 56, fontWeight: 700, color: TOKENS.ink, margin: 0 }}>
                    {resumeScoreResult.overallScore}<span style={{ fontSize: 24, color: TOKENS.inkSoft }}>/100</span>
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 28 }}>
                  <div style={{ textAlign: "center", padding: 14, background: TOKENS.paper, borderRadius: 6 }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: TOKENS.ink, margin: "0 0 2px" }}>{resumeScoreResult.atsScore}</p>
                    <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: 0 }}>ATS Score</p>
                  </div>
                  <div style={{ textAlign: "center", padding: 14, background: TOKENS.paper, borderRadius: 6 }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: TOKENS.ink, margin: "0 0 2px" }}>{resumeScoreResult.keywordScore}</p>
                    <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: 0 }}>Keyword Score</p>
                  </div>
                  <div style={{ textAlign: "center", padding: 14, background: TOKENS.paper, borderRadius: 6 }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: TOKENS.ink, margin: "0 0 2px" }}>{resumeScoreResult.formattingScore}</p>
                    <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: 0 }}>Formatting</p>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: TOKENS.ink, margin: "0 0 8px" }}>Weak Bullet Points</p>
                  {(resumeScoreResult.weakBulletPoints || []).map((b, i) => (
                    <p key={i} style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: "0 0 6px", lineHeight: 1.5 }}>• {b}</p>
                  ))}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: TOKENS.ink, margin: "0 0 8px" }}>Missing Skills</p>
                  {(resumeScoreResult.missingSkills || []).map((s, i) => (
                  <p key={i} style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: "0 0 6px" }}>• {s}</p>
                  ))}
                </div>

                <div style={{ marginBottom: 24, padding: 16, background: TOKENS.paper, borderRadius: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: TOKENS.ink, margin: "0 0 6px" }}>Employer Readiness</p>
                  <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.5 }}>{resumeScoreResult.employerReadiness}</p>
                </div>

                <p style={{ fontSize: 13, color: TOKENS.inkSoft, marginBottom: 16 }}>
                  We've also emailed a copy of this score to you.
                </p>

                <Button variant="primary" onClick={() => setView("landing")} style={{ width: "100%", justifyContent: "center" }}>
                  Fix These Issues With Resume Builder
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

{view === "wizard" && (  
        <>
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <h1
                className="cf-brand"
                onClick={() => setView("landing")}
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
<Button variant="ghost" style={{ marginBottom: 14, padding: "4px 8px" }} onClick={() => { setMode(null); setStep(0); setView("landing"); }}>← Home</Button>
          <Stepper step={step} labels={mode === "resume" ? STEPS_RESUME : mode === "coverletter" ? STEPS_COVERLETTER : mode === "interview" ? STEPS_INTERVIEW : mode === "coach" ? STEPS_COACH : STEPS_APPLICATION} />

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
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => { setMode(null); setView("landing"); }}>← Home</Button>
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
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => { setMode(null); setView("landing"); }}>← Home</Button>
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

      {step === 0 && mode === "coach" && (
        <Card>
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => { setMode(null); setView("landing"); }}>← Home</Button>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Build your interview knowledge base</h2>
          <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
            eCareer Design will read your saved work experience, education, and training, and turn them into ready-to-use interview stories — organized by category, so you always have the right example on hand.
          </p>
          <div style={{ background: TOKENS.goldSoft, border: `1px solid ${TOKENS.gold}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
            <AlertCircle size={16} color={TOKENS.gold} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, margin: 0, color: "#5C4210", lineHeight: 1.5 }}>
              This is a practice tool. You are solely responsible for how you use it, including during any real interview. eCareer Design does not represent or guarantee outcomes based on AI-generated practice content.
            </p>
          </div>
          {!workExperience.length ? (
            <p style={{ fontSize: 14, color: TOKENS.inkSoft }}>
              You don't have any work experience saved yet. Head to <strong>Resume Builder</strong> and fill in your background first, then come back here.
            </p>
          ) : coachExtracting ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
              <Loader2 size={14} className="spin" /> Reading your background and building your story bank...
            </div>
          ) : (
            <Button variant="primary" icon={<Sparkles size={14} />} onClick={extractCareerStories}>Build my interview stories</Button>
          )}
          {coachExtractError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>{coachExtractError}</p>}
        </Card>
      )}

      {step === 1 && mode === "coach" && (
        <div>
          <BackButton onClick={() => setStep(0)} />
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Your interview stories</h2>
            <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 20px" }}>
              {careerStories.length} stor{careerStories.length === 1 ? "y" : "ies"} pulled from your background, organized by category.
            </p>
            <Button variant="secondary" icon={<RefreshCw size={13} />} onClick={extractCareerStories}>Regenerate from background</Button>
            <Button variant="primary" icon={<ChevronRight size={14} />} onClick={() => setStep(2)} style={{ marginLeft: 8 }}>Prep for a specific job</Button>
          </Card>
          {careerStories.map((s) => (
            <Card key={s.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: TOKENS.ink }}>{s.title}</p>
                <span className="cf-badge">{s.category}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 8px", color: TOKENS.ink }}>
                {[s.situation, s.task, s.action, s.result].filter(Boolean).join(" ")}
              </p>
              {s.competencies?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {s.competencies.map((c, i) => (
                    <span key={i} style={{ fontSize: 12, color: TOKENS.inkSoft, border: `1px solid ${TOKENS.line}`, padding: "2px 8px", borderRadius: 999 }}>{c}</span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {step === 2 && mode === "coach" && (
        <div>
          <BackButton onClick={() => setStep(1)} />
          <Card style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Prep for a specific job</h2>
            <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 16px" }}>
              {jobTitle || selectedLib?.title
                ? `Using your saved job details for ${jobTitle || selectedLib?.title}.`
                : "No job details loaded yet — you can still generate general questions, or add a job title below."}
            </p>
            <Field label="Job title">
              <input style={inputStyle} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Operations Manager" />
            </Field>
            {coachQuestionsGenerating ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                <Loader2 size={14} className="spin" /> Matching your stories to likely questions...
              </div>
            ) : (
              <Button variant="primary" icon={<Sparkles size={14} />} onClick={generateCoachQuestions}>
                {coachQuestions ? "Regenerate questions" : "Generate questions for this job"}
              </Button>
            )}
            {coachQuestionsError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>{coachQuestionsError}</p>}
            {coachQuestions?.length > 0 && (
             <Button variant="primary" icon={<Sparkles size={14} />} onClick={() => { setMockScores([]); setMockAnswer(""); setMockComplete(false); setMockCurrentQuestion(null); setMockQuestionCount(0); setStep(4); generateNextMockQuestion([]); }} style={{ marginTop: 12 }}>
                Start full mock interview
              </Button>
            )}
          </Card>

          {coachQuestions?.map((q) => {
            const matched = careerStories.find((s) => s.id === q.matchedStoryId);
            return (
              <Card key={q.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: TOKENS.ink, flex: 1 }}>{q.question}</p>
                  <span className="cf-badge">{q.category}</span>
                </div>
                {matched ? (
                  <div style={{ background: TOKENS.paper, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accent, margin: "0 0 4px", textTransform: "uppercase" }}>Use this story: {matched.title}</p>
                    <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.5 }}>{q.tip}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: TOKENS.inkSoft, fontStyle: "italic", marginBottom: 8 }}>No strong story match — {q.tip}</p>
                )}
<Button variant="secondary" icon={<MessageSquare size={13} />} onClick={() => { setPracticeQuestion(q); setPracticeAnswer(""); setPracticeScore(null); setStep(3); }} style={{ marginTop: 8 }}>Practice this answer</Button>
              </Card>
            );
          })}
        </div>
      )}

      {step === 3 && mode === "coach" && (
        <div>
          <BackButton onClick={() => setStep(2)} />
          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accent, margin: "0 0 6px", textTransform: "uppercase" }}>Practice question</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, margin: "0 0 16px" }}>{practiceQuestion?.question}</h2>
         <Field label="Your answer">
              <textarea
                style={{ ...inputStyle, minHeight: 160, resize: "vertical" }}
                value={practiceAnswer}
                onChange={(e) => setPracticeAnswer(e.target.value)}
                placeholder="Type your answer, or click the microphone to speak it..."
                disabled={practiceScoring}
              />
              <Button
                variant={isListening ? "primary" : "secondary"}
                icon={<Mic size={13} />}
                onClick={toggleVoiceInput}
                style={{ marginTop: 8 }}
              >
                {isListening ? "Stop recording" : "Speak your answer"}
              </Button>
            </Field>
            {practiceScoring ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                <Loader2 size={14} className="spin" /> Scoring your answer...
              </div>
            ) : (
              <Button variant="primary" icon={<Sparkles size={14} />} onClick={scorePracticeAnswer} disabled={!practiceAnswer.trim()}>
                {practiceScore ? "Score again" : "Get feedback"}
              </Button>
            )}
            {practiceError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>{practiceError}</p>}
          </Card>

          {practiceScore && (
            <Card>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, margin: 0 }}>Overall: {practiceScore.overall}/10</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
                {[
                  ["Communication", practiceScore.communication],
                  ["Confidence", practiceScore.confidence],
                  ["Relevance", practiceScore.relevance],
                  ["STAR structure", practiceScore.starStructure],
                  ["Specificity", practiceScore.specificity],
                  ["Results", practiceScore.results],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: TOKENS.paper, borderRadius: 8, padding: "10px 12px" }}>
                    <p style={{ fontSize: 12, color: TOKENS.inkSoft, margin: "0 0 4px" }}>{label}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: TOKENS.ink }}>{val}<span style={{ fontSize: 13, fontWeight: 400, color: TOKENS.inkSoft }}>/10</span></p>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.green || "#2E7D32", margin: "0 0 4px", textTransform: "uppercase" }}>Strengths</p>
                <p style={{ fontSize: 14, color: TOKENS.ink, margin: 0, lineHeight: 1.5 }}>{practiceScore.strengths}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accent, margin: "0 0 4px", textTransform: "uppercase" }}>Improve by</p>
                <p style={{ fontSize: 14, color: TOKENS.ink, margin: 0, lineHeight: 1.5 }}>{practiceScore.improvements}</p>
              </div>
            </Card>
          )}
        </div>
      )}{step === 0 && mode === "coverletter" && (
        <Card>
          <Button variant="ghost" style={{ marginBottom: 10, padding: "4px 8px" }} onClick={() => { setMode(null); setView("landing"); }}>← Home</Button>
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
            <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Street address" value={clCompanyStreet} onChange={(e) => setClCompanyStreet(e.target.value)} />
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 10 }}>
              <input style={inputStyle} placeholder="City" value={clCompanyCity} onChange={(e) => setClCompanyCity(e.target.value)} />
              <input style={inputStyle} placeholder="State" value={clCompanyState} onChange={(e) => setClCompanyState(e.target.value)} />
              <input style={inputStyle} placeholder="ZIP" value={clCompanyZip} onChange={(e) => setClCompanyZip(e.target.value)} />
            </div>
          </Field>
          <Button variant="primary" onClick={goToBackground} icon={<ChevronRight size={14} />}>
            Continue to background
          </Button>
        </Card>
      )}

{step === 4 && mode === "coach" && (
        <div>
          <BackButton onClick={() => { window.speechSynthesis?.cancel(); setStep(2); setMockCurrentQuestion(null); setMockAnswer(""); setMockScores([]); setMockComplete(false); }} />

          {mockGeneratingQuestion && !mockCurrentQuestion ? (
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                <Loader2 size={14} className="spin" /> Preparing your first question...
              </div>
            </Card>
          ) : mockComplete ? (
            <div>
              <Card style={{ marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, margin: "0 0 4px" }}>Interview complete</h2>
                <p style={{ fontSize: 16, color: TOKENS.inkSoft, margin: "0 0 16px" }}>
                  {mockScores.length} question{mockScores.length === 1 ? "" : "s"} answered. Here's how you did.
                </p>
                <p style={{ fontSize: 40, fontWeight: 700, margin: 0, color: TOKENS.ink }}>
                  {mockScores.length ? (mockScores.reduce((sum, s) => sum + (s.score.overall || 0), 0) / mockScores.length).toFixed(1) : "—"}
                  <span style={{ fontSize: 18, fontWeight: 400, color: TOKENS.inkSoft }}>/10 average</span>
                </p>
              </Card>
              {mockScores.map((item, i) => (
                <Card key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: TOKENS.ink, flex: 1 }}>{item.question}</p>
                    <span className="cf-badge">{item.score.overall}/10</span>
                  </div>
                  <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: "0 0 8px", fontStyle: "italic" }}>{item.answer}</p>
                  <p style={{ fontSize: 13, color: TOKENS.ink, margin: 0, lineHeight: 1.5 }}><strong>Strengths:</strong> {item.score.strengths}</p>
                  <p style={{ fontSize: 13, color: TOKENS.ink, margin: "6px 0 0", lineHeight: 1.5 }}><strong>Improve by:</strong> {item.score.improvements}</p>
                </Card>
              ))}
              <Button variant="secondary" icon={<RefreshCw size={13} />} onClick={() => { setMockScores([]); setMockAnswer(""); setMockComplete(false); setMockCurrentQuestion(null); setMockQuestionCount(0); generateNextMockQuestion([]); }}>Start over</Button>
            </div>
          ) : mockCurrentQuestion ? (
            <Card>
              <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accent, margin: "0 0 6px", textTransform: "uppercase" }}>
                Question {mockQuestionCount}{mockCurrentQuestion.isFollowUp ? " · Follow-up" : ""}
              </p>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, margin: "0 0 16px" }}>{mockCurrentQuestion.question}</h2>
              <Button
                variant="secondary"
                icon={<Volume2 size={13} />}
                onClick={() => speakQuestion(mockCurrentQuestion.question)}
                disabled={mockSpeaking}
                style={{ marginBottom: 16 }}
              >
                {mockSpeaking ? "Speaking..." : "Hear the question"}
              </Button>
              <Field label="Your answer">
                <textarea
                  style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
                  value={mockAnswer}
                  onChange={(e) => setMockAnswer(e.target.value)}
                  placeholder="Type your answer, or click the microphone to speak it..."
                  disabled={mockScoring || mockGeneratingQuestion}
                />
                <Button
                  variant={mockListening ? "primary" : "secondary"}
                  icon={<Mic size={13} />}
                  onClick={toggleMockVoiceInput}
                  style={{ marginTop: 8 }}
                >
                  {mockListening ? "Stop recording" : "Speak your answer"}
                </Button>
              </Field>
              {mockScoring || mockGeneratingQuestion ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: TOKENS.inkSoft, fontSize: 13 }}>
                  <Loader2 size={14} className="spin" /> {mockScoring ? "Scoring your answer..." : "Thinking of the next question..."}
                </div>
              ) : (
                <Button variant="primary" icon={<ChevronRight size={14} />} onClick={scoreAndAdvanceMock} disabled={!mockAnswer.trim()} style={{ marginTop: 12 }}>
                  Submit answer
                </Button>
              )}
              {mockError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 10 }}>{mockError}</p>}
            </Card>
          ) : (
            <Card>
              <p style={{ fontSize: 14, color: TOKENS.inkSoft }}>
                Generate questions for a job first, then come back here to start a full mock interview.
              </p>
            </Card>
          )}
        </div>
      )}
      {step === 1 && (
        <div>
          <BackButton onClick={() => setStep(0)} />
          {(mode === "resume" || mode === "coverletter") && (
            <Card style={{ marginBottom: 16 }}>
              <SectionHeading icon={<FileText size={18} color={TOKENS.accent} />} title="Contact info" subtitle={mode === "resume" ? "Goes at the top of your resume." : "Goes at the top of your cover letter."} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input style={smallInputStyle} placeholder="Full name" value={contactInfo.name} onChange={(e) => setContactInfo((c) => ({ ...c, name: e.target.value }))} />
                <input style={smallInputStyle} placeholder="Email" value={contactInfo.email} onChange={(e) => setContactInfo((c) => ({ ...c, email: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 10 }}>
                <input style={smallInputStyle} placeholder="Street address (optional)" value={contactInfo.street} onChange={(e) => setContactInfo((c) => ({ ...c, street: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input style={smallInputStyle} placeholder="City" value={contactInfo.city} onChange={(e) => setContactInfo((c) => ({ ...c, city: e.target.value }))} />
                <input style={smallInputStyle} placeholder="State" value={contactInfo.state} onChange={(e) => setContactInfo((c) => ({ ...c, state: e.target.value }))} />
                <input style={smallInputStyle} placeholder="ZIP" value={contactInfo.zip} onChange={(e) => setContactInfo((c) => ({ ...c, zip: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                <input style={smallInputStyle} placeholder="Phone" value={contactInfo.phone} onChange={(e) => setContactInfo((c) => ({ ...c, phone: e.target.value }))} />
              </div>

              {mode === "resume" && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${TOKENS.line}` }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: TOKENS.ink, margin: "0 0 8px" }}>Headshot photo (optional)</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {resumePhoto ? (
                      <img src={resumePhoto} alt="Headshot preview" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `1px solid ${TOKENS.line}` }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: TOKENS.paper, border: `1px dashed ${TOKENS.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileText size={20} color={TOKENS.inkSoft} />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={photoInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button
                          variant="secondary"
                          icon={photoProcessing ? <Loader2 size={13} className="spin" /> : <Plus size={13} />}
                          disabled={photoProcessing}
                          onClick={() => photoInputRef.current?.click()}
                        >
                          {photoProcessing ? "Processing..." : resumePhoto ? "Change photo" : "Upload photo"}
                        </Button>
                        {resumePhoto && (
                          <Button variant="dangerGhost" icon={<Trash2 size={13} />} onClick={() => setResumePhoto(null)}>Remove</Button>
                        )}
                      </div>
                      {photoError && <p style={{ fontSize: 12, color: TOKENS.red, margin: "6px 0 0" }}>{photoError}</p>}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: TOKENS.gold, margin: "10px 0 0", lineHeight: 1.5 }}>
                    Heads up: many U.S. employers — and virtually all federal/USAJOBS applications — discourage or prohibit photos on resumes, specifically to avoid any appearance of bias. This is optional; skip it for federal or corporate applications unless you know it's expected.
                  </p>
                </div>
              )}
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
                  <ResumePreview template={resumeTemplate} contact={contactInfo} data={resumeData} color={resumeColor} photo={resumePhoto} />
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
{(mode === "application" || mode === "coverletter") && (
            <Card style={{ marginTop: 16 }}>
              {!showApplyForm ? (
                <Button variant="secondary" icon={<Check size={14} />} onClick={() => setShowApplyForm(true)}>
                  Mark as applied
                </Button>
              ) : (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px", color: TOKENS.ink }}>Log this application</h3>
                  <Field label="Company name">
                    <input style={inputStyle} value={applyCompany} onChange={(e) => setApplyCompany(e.target.value)} placeholder="e.g., Acme Corp" />
                  </Field>
                  <Field label="Job posting link (optional)">
                    <input style={inputStyle} value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="https://..." />
                  </Field>
                  <Field label="Interview scheduled? (optional)">
                    <input type="datetime-local" style={inputStyle} value={applyInterviewDate} onChange={(e) => setApplyInterviewDate(e.target.value)} />
                  </Field>
                  {applySaved ? (
                    <p style={{ color: TOKENS.green || "#2E7D32", fontSize: 14, margin: "8px 0 0" }}>✓ Saved to your applications</p>
                  ) : (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Button variant="primary" onClick={saveApplication} disabled={applySaving || !applyCompany.trim()}>
                        {applySaving ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowApplyForm(false)}>Cancel</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          <div style={{ borderTop: `1px solid ${TOKENS.line}`, paddingTop: 16 }}>
            {mode === "resume" ? (
              <div style={{ background: TOKENS.paper, padding: 20, borderRadius: 4 }}>
                {resumeData && (
                  <div ref={resumeExportRef} style={{ display: "inline-block" }}>
                    <ResumePreview template={resumeTemplate} contact={contactInfo} data={resumeData} color={resumeColor} photo={resumePhoto} />
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
              )}Not yet started: resume match scoring (compare a resume against a specific job posting, return a %), and the "one-click auto-apply" idea remains a deliberately separate, unstarted decision (ToS/automation complexity flagged, not ruled out).

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
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <Button variant="secondary" icon={<ExternalLink size={13} />}>
                          Apply on {job.source}
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="secondary"
                      icon={jobMatchResults[i]?.loading ? <Loader2 size={13} className="cf-spin" /> : <Sparkles size={13} />}
                      onClick={() => runJobCardMatch(job, i)}
                      disabled={jobMatchResults[i]?.loading}
                    >
                      {jobMatchResults[i]?.loading ? "Scoring..." : "Check Match %"}
                    </Button>
                  </div>

                  {jobMatchResults[i]?.error && (
                    <p style={{ color: TOKENS.red, fontSize: 12.5, marginTop: 8 }}>{jobMatchResults[i].error}</p>
                  )}

                  {jobMatchResults[i]?.result && (
                    <div style={{ marginTop: 10, padding: 10, borderRadius: 6, background: TOKENS.surface, border: `1px solid ${TOKENS.line}` }}>
                      <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: TOKENS.ink }}>
                        {jobMatchResults[i].result.score}% match
                      </p>
                      <p style={{ fontSize: 12.5, color: TOKENS.inkSoft, margin: "0 0 8px" }}>{jobMatchResults[i].result.summary}</p>
                      {jobMatchResults[i].result.missingSkills?.length > 0 && (
                        <p style={{ fontSize: 12, color: TOKENS.red, margin: 0 }}>
                          Missing: {jobMatchResults[i].result.missingSkills.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
        </>
      )}

      {view === "dashboard" && isPremium && (
        <Dashboard
          contactInfo={contactInfo}
          recentProjects={recentProjects}
          onResumeBuilder={() => { setMode("resume"); setStep(1); setView("wizard"); }}
          onJobTailoring={() => { setMode("application"); setStep(0); setView("wizard"); }}
          onCoverLetter={() => { setMode("coverletter"); setStep(0); setView("wizard"); }}
          onInterviewPrep={() => { setMode("interview"); setStep(0); setView("wizard"); }}
onInterviewCoach={() => { setMode("coach"); setStep(0); setView("wizard"); }}
          onRemoveProject={removeRecentProject}
          weeklyAppCount={weeklyAppCount}
newJobMatchCount={newJobMatchCount}
          nextInterview={nextInterview}
          dashboardStatsLoaded={dashboardStatsLoaded}
          onPracticeInterview={() => { setMode("coach"); setStep(2); setView("wizard"); }}
careerBackground={buildBackground()}
        />
      )}

      {view === "dashboard" && !isPremium && (
        <div>
          <p style={{ fontSize: 16, color: TOKENS.inkSoft, marginBottom: 16 }}>
            This page is part of eCareer Design Premium.
          </p>
          <Button variant="primary" onClick={() => setView("pricing")}>See Premium Plans</Button>
        </div>
      )}
      <p style={{ textAlign: "center", fontSize: 12, color: "#9AA3A0", marginTop: 40 }}>
        eCareer Design AI Resume Studio · {APP_VERSION}
        <br />
        <Link href="/privacy" style={{ color: "#9AA3A0", marginRight: 12 }}>Privacy Notice</Link>
        <Link href="/terms" style={{ color: "#9AA3A0", marginRight: 12 }}>Terms of Use</Link>
        <a href="mailto:hello@ecareerdesign.net" style={{ color: "#9AA3A0" }}>Contact Us</a>
      </p>

      <VirtualAssistant />
    </div>
  );
}

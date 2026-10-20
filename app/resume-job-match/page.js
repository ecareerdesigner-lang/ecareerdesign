import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta({
  title: "Resume Job Description Match Score - Free Keyword Checker",
  description: "Paste your resume and a job description to get an instant match score, missing keywords, and skill gaps - free, no account required.",
  path: "/resume-job-match",
});

import ResumeJobMatchTool from "./ResumeJobMatchTool";

export default function ResumeJobMatchPage() {
  return <ResumeJobMatchTool />;
}

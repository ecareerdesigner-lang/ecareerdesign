export const metadata = {
  title: "Free ATS Score Checker - See Your Resume's ATS Score",
  description: "Calculate your resume's ATS score for free in 30 seconds - Overall Score, Keyword Score, and Formatting Score, no account required.",
};

import ATSCheckerTool from "./ATSCheckerTool";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is an ATS score?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An ATS score is a number that reflects how well your resume matches a job description and how cleanly it can be read by Applicant Tracking System software. This free ATS score checker calculates it instantly from your resume.",
      },
    },
    {
      "@type": "Question",
      name: "How do I calculate my ATS score?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Upload your resume and click \"Check My Resume Score.\" The tool analyzes your formatting, keywords, and structure and gives you an Overall Score, ATS Score, Keyword Score, and Formatting Score in about 30 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Is an ATS score checker the same as an ATS tracker?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "They're related but not identical. An ATS tracker generally refers to the software employers use to manage applications. An ATS score checker checks your resume against that kind of system before you apply, so you can fix issues in advance.",
      },
    },
    {
      "@type": "Question",
      name: "Why did I get a low ATS score if I'm qualified for the job?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A low score usually means formatting or keyword issues, not a lack of qualifications. Tables, text boxes, and non-standard section headings can confuse ATS parsing, and missing the exact terms from a job posting can lower your keyword score even when your real experience is a strong fit.",
      },
    },
    {
      "@type": "Question",
      name: "Is this ATS score checker really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Checking your resume's ATS score is free and doesn't require an account.",
      },
    },
  ],
};

export default function ATSCheckerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ATSCheckerTool />
    </>
  );
}

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL("https://ecareerdesign.net"),
  title: "eCareer Design: AI Resume Builder, Cover Letters & Interview Prep",
  description: "STAR-format response and resume builder for your next job application.",
  openGraph: {
    title: "eCareer Design",
    description: "Tailored resumes, cover letters, and mock interviews, built from the exact job you're applying for.",
    siteName: "eCareer Design",
    type: "website",
    url: "https://ecareerdesign.net",
  },
  twitter: {
    card: "summary_large_image",
    title: "eCareer Design",
    description: "Tailored resumes, cover letters, and mock interviews, built from the exact job you're applying for.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#EEF0EC" }}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

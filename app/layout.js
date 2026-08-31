import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";

// Self-hosted via Next.js instead of a runtime @import: these get included
// directly in the initial HTML response, so there's no separate network
// round-trip and no text reflow once a late-loading stylesheet arrives —
// that reflow was the main driver of a poor Cumulative Layout Shift score.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://www.ecareerdesign.net"),
  title: "eCareer Design: AI Resume, Cover Letter & Interview Prep",
  description: "Build a job-winning resume, cover letter, and interview answers with AI — trusted by career changers and federal job seekers. Try eCareer Design free.",
  openGraph: {
    title: "eCareer Design",
    description: "Tailored resumes, cover letters, and mock interviews, all built from the exact job you're applying for, using one background you enter just once.",
    siteName: "eCareer Design",
    type: "website",
    url: "https://www.ecareerdesign.net",
  },
  twitter: {
    card: "summary_large_image",
    title: "eCareer Design",
    description: "Tailored resumes, cover letters, and mock interviews, all built from the exact job you're applying for, using one background you enter just once.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.className} ${inter.className} ${ibmPlexMono.className}`}
        style={{ margin: 0, background: "#EEF0EC" }}
      >
        {children}
        <Analytics />
        <SpeedInsights />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PST16FSVMK"
          strategy="beforeInteractive"
        />
        <Script id="ga4-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PST16FSVMK');
          `}
        </Script>
        <Script id="error-capture-init" strategy="afterInteractive">
          {`
            function reportClientError(message, stack, feature) {
              try {
                fetch('/api/log-error', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: message, stack: stack, feature: feature || 'uncaught' }),
                  keepalive: true,
                });
              } catch (e) {}
            }
            window.addEventListener('error', function(event) {
              reportClientError(event.message, event.error && event.error.stack, 'window-error');
            });
            window.addEventListener('unhandledrejection', function(event) {
              var reason = event.reason;
              var message = reason && reason.message ? reason.message : String(reason);
              var stack = reason && reason.stack ? reason.stack : null;
              reportClientError(message, stack, 'unhandled-rejection');
            });
          `}
        </Script>
      </body>
    </html>
  );
}

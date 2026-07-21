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
  metadataBase: new URL("https://ecareerdesign.net"),
  title: "eCareer Design: AI Resume, Cover Letter & Interview Prep",
  description: "STAR-format response and resume builder for your next job application.",
  openGraph: {
    title: "eCareer Design",
    description: "Tailored resumes, cover letters, and mock interviews, all built from the exact job you're applying for, using one background you enter just once.",
    siteName: "eCareer Design",
    type: "website",
    url: "https://ecareerdesign.net",
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
<Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xq4knfwz85");
          `}
        </Script>
      </body>
    </html>
  );
}


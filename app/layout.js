import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "eCareer Design",
  description: "STAR-format response and resume builder for your next job application.",
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

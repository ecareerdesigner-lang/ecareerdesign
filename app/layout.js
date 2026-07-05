export const metadata = {
  title: "CareerForge",
  description: "STAR-format response and resume builder for your next job application.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#EEF0EC" }}>{children}</body>
    </html>
  );
}

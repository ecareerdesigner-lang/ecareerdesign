export const metadata = {
  title: "KSA Assist",
  description: "STAR-format response builder for Federal Government Career applications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#EEF0EC" }}>{children}</body>
    </html>
  );
}

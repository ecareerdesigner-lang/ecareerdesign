export const metadata = {
  title: "eCareerDesign",
  description: "STAR-format response builder for internal USPS eCareer applications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#EEF0EC" }}>{children}</body>
    </html>
  );
}

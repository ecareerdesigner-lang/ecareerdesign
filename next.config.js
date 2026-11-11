// Content-Security-Policy starts in Report-Only mode: it logs what it would
// block in the browser console without breaking anything. Check a week of
// real traffic, then rename the header to "Content-Security-Policy" to enforce.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://in.heycatch.ai https://va.vercel-scripts.com https://js.stripe.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://in.heycatch.ai https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://api.stripe.com https://cdn.jsdelivr.net",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy-Report-Only", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // HeyCatch short links: /a -> /?utm_source=heycatch&utm_campaign=a
      {
        source: '/:l([a-z0-9])',
        destination: '/?utm_source=heycatch&utm_campaign=:l',
        permanent: false,
      },
      {
        source: '/blog/resume-mistakes-costing-you-interviews',
        destination: '/blog/resume-mistakes-hiring-managers-notice',
        permanent: true,
      },
      {
        source: '/blog/ai-resume-builder-vs-traditional-resume-writing',
        destination: '/blog/ai-resume-builders-vs-writing-your-own-resume',
        permanent: true,
      },
      {
        source: '/cover_letter',
        destination: '/cover-letter-generator',
        permanent: true,
      },
      {
        source: '/coverletter',
        destination: '/cover-letter-generator',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig

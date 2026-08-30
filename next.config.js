/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/parse-resume/route': ['./public/tessdata/**'],
    },
  },
  async redirects() {
    return [
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

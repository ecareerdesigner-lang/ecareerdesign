/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ]
  },
}

module.exports = nextConfig

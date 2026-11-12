// Real-world proof points for the marketing site (audit items D3.1-D3.5 and FIT).
// Everything here is OWNER-SUPPLIED. Nothing is invented: each block on the site
// renders only once its value below is filled in, so empty = hidden.

export const SITE_PROOF = {
  // D3.1  Real usage number from analytics, e.g. { count: "1,200", label: "resumes scored this month" }
  usage: null,

  // D3.1  Optional avatar grid: up to 20 of { name, photo } (photo = path under /public). Use real signups, with permission.
  avatars: [],

  // D3.2  Named customer stories, 3-5 recommended. Each:
  // { name: "Dana", role: "Federal applicant", photo: "/proof/dana.jpg", quote: "...", outcome: "Moved from 52% to 88% match" }
  testimonials: [
    {
      name: "Mike S.",
      role: "Lexington, KY",
      quote:
        "My work team was abruptly eliminated, and I had thirty days to find a new position. eCareer Design was a life saver in job matching and tailoring my profile to match each job that I applied for in that short period of time.",
    },
    {
      name: "Gabi",
      role: "Charlotte, NC",
      quote:
        "I was struggling to find part-time work while still going to school. eCareer Design helped me take the skills and experiences from school, training and volunteer work and craft a wonderful cover letter and resume as well as using it built in job search to find the perfect job for me.",
    },
    {
      name: "Amanda D.",
      role: "Jacksonville, FL",
      quote:
        "I get so stressed out during my company's end of year review process. We have 5 goals we have to meet for the year and we are graded on a 1-5 scale based in large part on our written review and ability to show how we far exceeded expectations of the goals, showed extraordinary efforts in achieving the goals and surpass the goals outcomes and tasks related to the goals. I have a hard time remembering what I did last week let alone for the entire year. eCareer Design Performance Review Writer helps me keep track of tasks for the entire year towards each goal and then polishes the final draft. It is a life saver.",
    },
  ],

  // D3.5  Third-party rating/badge. Fill when the first review lands, e.g.
  // { label: "4.8 on Trustpilot", url: "https://...", date: "November 2026" }
  rating: null,

  // D3.3  Founder block + /about page. /about returns 404 until this is filled. { name, role, photo, story, linkedin }
    founder: {
    name: "Phil Zimmerman",
    role: "Founder",
    photo: "/proof/phil.jpg",
    linkedin: "https://www.linkedin.com/in/philip-zimmerman-9a64588/",
    blurb:
      "I spent 30 years working in government operations, leading teams and strategic initiatives. I built eCareer Design because good people with real experience get passed over when they don't know how to present it.",
    story: `I spent 30 years working in government operations, leading teams and strategic initiatives. In that time I saw how confusing and frustrating the federal hiring process can be. Good people with real experience get passed over because they don't know how to present it. I built eCareer Design to change that.

Today the platform helps job seekers build stronger resumes, write tailored cover letters, and walk into interviews prepared. I built it the way I wish I'd had it: practical, clear, and focused on helping you tell your story.

This work matters to me because a job is never just a job. It's a paycheck, a family's stability, and a chance to do work you're proud of. When someone lands a role they've worked hard for, that's the win I care about.

If you're in the middle of a job search, I'm glad you're here.`,
  },

  // D3.4  Money-back guarantee in days. Leave null unless you really offer one (e.g. 7).
  guaranteeDays: null,

  // FIT  Free-tier limit line shown on both Free cards, e.g. "Unlimited on the free tier"
  // or "3 tailored resumes per month, free forever". Leave null until confirmed.
  freeTierLine: "Includes 2 free generations each of resume, cover letter, and job tailoring.",
};

export const SITE_URL = "https://www.ecareerdesign.net";

export const SOCIAL_LINKS = [
  "https://www.facebook.com/profile.php?id=61591358744526",
  "https://www.instagram.com/ecareerdesign/",
  "https://www.linkedin.com/in/ecareer-design-874062420/",
  "https://www.tiktok.com/@ecareerdesign.net",
  "https://www.youtube.com/@eCareerdesign",
];

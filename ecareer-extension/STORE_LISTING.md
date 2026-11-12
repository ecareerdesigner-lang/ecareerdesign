# Chrome Web Store listing: eCareer Design Apply Assistant

Copy each section into the matching field of the Chrome Web Store developer dashboard.

## Store listing tab

**Name:** eCareer Design Apply Assistant

**Summary (max 132 characters):**
Find jobs that fit your resume, get a tailored resume and cover letter for each, and fill applications. You approve every send.

**Category:** Productivity (or Workflow & Planning)

**Language:** English

**Description:**

Find roles that fit your resume, get a tailored application for each, and have the forms filled in for you. You review and approve every submission yourself.

Apply Assistant is a Premium feature of eCareer Design (ecareerdesign.net). It works from the resume you already built there.

WHAT IT DOES
- Finds roles that fit: searches USAJOBS, Adzuna, remote job boards and public employer job boards, then ranks them against your resume with a match score and plain-language reasons.
- Scores any job page: open a posting on any site and score it against your resume.
- Writes each application: a tailored plain-text resume (downloadable as a PDF) and a short cover letter you can edit before using.
- Fills the form: on supported sites (Greenhouse, Lever, Ashby, and the visible step of Workday) it fills your contact details and attaches your resume.
- Keeps a history of what you prepared and what you decided.

YOU STAY IN CONTROL
- Nothing is ever submitted without you. A review banner lists what was filled, and the Submit button is only pressed after you tick "I reviewed every field" and click Approve.
- It never answers legal, work-authorization, demographic, salary or consent questions. Those are listed for you to answer.
- It never creates accounts, types passwords, or solves CAPTCHAs.
- It never overwrites anything you already typed.
- It never invents experience. Gaps are reported as gaps.
- Each site needs your permission first. It does nothing on sites you haven't allowed.
- Disconnect any browser from your eCareer Design Dashboard at any time.

SITE SUPPORT
Auto-fill works on Greenhouse, Lever and Ashby, and partly on Workday. LinkedIn, Indeed and USAJOBS are not auto-filled; for those, the extension gives you the tailored resume and cover letter to use yourself.

REQUIREMENTS
An eCareer Design Premium account (monthly subscription or 30-day pass) and a resume saved in your account. Connect by pasting a one-time code from your Dashboard.

PRIVACY
Your resume and the job text are processed on eCareer Design's servers and sent to Anthropic's AI API to produce scores and drafts. Job search services receive only a job title and location. We don't sell your data or use it for advertising. Full details: https://www.ecareerdesign.net/privacy

Not affiliated with USAJOBS, LinkedIn, Indeed, Greenhouse, Lever, Ashby or Workday.

## Privacy practices tab

**Single purpose:**
Help a signed-in eCareer Design Premium user find job postings that match their saved resume, prepare a tailored resume and cover letter for each, and fill in the job application form for the user to review and submit.

**Permission justifications:**

| Permission | Justification |
|---|---|
| storage | Stores the user's private access token (to stay connected to their eCareer Design account) and a short-lived cache of recent job matches in the extension's own storage. |
| sidePanel | The extension's interface (find roles, prepare, history) is a side panel so it stays open next to the job posting. |
| activeTab | Lets the extension read the job posting on the current tab only when the user clicks "Score this page". |
| scripting | Injects the form-filling script into the application page the user chose to fill, after the user grants that site. |
| tabs | Opens the job posting in a new tab, and reads the address of the tab being filled so the extension can ask for permission for that specific site and know when the page has finished loading. |
| Host permission: https://www.ecareerdesign.net/* | Connects to the user's eCareer Design account (pairing, resume profile, match scoring, saved applications). |
| Optional host permissions: https://*/* | Employers use many different application sites. The extension requests access to one specific site at a time, only when the user clicks to fill an application there, and does nothing on sites the user hasn't approved. |
| Content scripts (Greenhouse, Lever, Ashby, Workday) | Reads the job posting and fills the application form on these supported application sites. |

**Remote code:** No. All code is included in the package.

**Data usage (check these boxes):**
- Personally identifiable information (name, email, phone, address from the user's resume)
- Authentication information (access token)
- Website content (job posting text from pages the user chooses to score or fill)
- Personal communications: not collected

**Certifications (check all three):**
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://www.ecareerdesign.net/privacy

## Still needed from you

- At least one screenshot at 1280x800 (up to five). The side panel with ranked matches, the prepared application with the cover letter, and the review banner on a Greenhouse page are the three best.
- A small promo tile, 440x280 (required by the store).
- The $5 one-time developer registration fee.
- Support email / website to list on the store page.
- Review the privacy page before submitting. It was updated to describe the extension, but it was written with AI assistance and should be checked by you (and ideally an attorney) before the store reviews it.

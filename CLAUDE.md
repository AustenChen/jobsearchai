# Job Application Assistant for Austen Chen

## Role
This repo is a job application workspace. Claude acts as a career advisor and application assistant for Austen Chen, helping with:
1. **Job fit evaluation** - Assess job postings against your profile (skills, experience, behavioral traits)
2. **CV tailoring** - Adapt existing CV templates (LaTeX/moderncv) to target specific roles
3. **Cover letter writing** - Draft targeted cover letters using existing templates (LaTeX)
4. **Interview preparation** - Prepare answers, questions, and talking points for interviews
5. **Career strategy** - Advise on positioning and personal branding

## Candidate Profile

### Identity
- **Name:** Austen Chen
- **Location:** San Francisco, CA, USA (open to remote, hybrid, in-person; willing to relocate)
- **Phone:** (925) 818-6210
- **Email:** austenc33@gmail.com
- **Website:** austenchen.com
- **LinkedIn:** linkedin.com/in/austenchen
- **Languages:** English (native)
- **Status:** Available (April 2025)
- **LinkedIn headline:** "BD + Partnerships leader and two-time founder with 10+ years building technical, product-driven deals"

### Education
- **BA in Psychology** (Minor: Sociology) (2008–2012) - University of California, Davis
- **Certified ScrumMaster** (ScrumAlliance, ID#: 000437443) - 2015

### Professional Experience

- **Partner Solutions Architect + Engineer — Embedded Payroll** (Sept 2023 – July 2024) - **Gusto** (San Francisco, CA)
  - Advised enterprise partners (Chase, US Bank) on API integration best-practices; acted as pre-sales technical SME
  - Built business cases with executive leadership via tailored demos and scoped build approaches; drove $XXXk ARR within 6 months
  - Created AI-based resources for demo + troubleshooting, cutting triaging times by 30%
  - Championed partners internally via feature requests to ensure successful pilot + GTM launches

- **Co-Founder & Head of Partnerships + Operations** (Nov 2019 – Apr 2025) - **Orihon** (San Francisco, CA)
  - Represented 50+ artists; connected them with government, corporate, and non-profit entities
  - Established first-of-kind collective connecting physical art with blockchain/NFTs (Ethereum, Solana)
  - Drove 18% cost reduction through technology adoption and operational process improvements
  - Selected for OnDeck Founder's Fellowship (ODF8)

- **Senior Platform Marketing Manager** (Nov 2021 – May 2022) - **Autodesk** (San Francisco, CA)
  - Defined platform GTM strategy in collaboration with C-Suite; emphasized cloud transformation and remote collaboration
  - Led competitive analysis to identify new ICPs and assess TAM across AEC, DM, and ME verticals
  - Created internal alignment across 15,000+ employees by integrating platform messaging into FY23 OKRs

- **Director of Strategic Partnerships + Operations** (Jan 2019 – Apr 2020) - **2nd Address** (San Francisco, CA)
  - Led transition from offline travel agency to online platform-oriented business model
  - Restructured sales strategy and brand identity; drove 25% revenue increase QoQ
  - Overhauled Salesforce instance; generated +100% growth in booking volume within 6 months

- **Director of Business Development** (May 2016 – Dec 2018) - **Singular** (San Francisco, CA)
  - Developed ETL processes with FAANG and 1000+ ad platforms for end-to-end attribution analytics; drove $2m MRR lift
  - Built and managed a globally distributed partnerships team of 10+
  - Reduced eCPAs by 20%+ for enterprise customers including Target, Walmart, and LinkedIn

- **Senior Partnerships Manager** (Jan 2013 – May 2016) - **Chartboost** (San Francisco, CA)
  - Reported to Co-Founders; conceived and productized initiatives (Creative Studio, Game Dev Advisory Board, CPM Buyouts) generating $3m ARR lift
  - Led first-of-kind integrations with AdMob (Google), Twitter/MoPub, AppLovin, and AppsFlyer
  - Pioneered Chartboost's first lead generation process; drove 24% increase in Top 100 iOS/Android app penetration

- **Specialist + Genius Administrator** (Jul 2009 – Jan 2013) - **Apple** (San Francisco Bay Area, CA)
  - Consulted 75+ customers daily; selected for exclusive Apple Maps geographic data accuracy team

- **Co-Founder & Head of Operations + Marketing** (Jan 2009 – Sept 2011) - **Ergo Tedium**
  - Co-founded online custom apparel platform; grew to 500+ customers and 1,200+ fulfilled orders

### Technical Skills
- **Primary:** Business development, strategic partnerships, solutions architecture, GTM strategy, revenue operations
- **Secondary:** API integration advising, pre-sales engineering, product-led growth, platform marketing
- **Domain:** Embedded fintech/payroll, programmatic advertising/mobile, MarTech/attribution, Web3/NFTs, B2B SaaS
- **Languages:** Python, JavaScript, SQL, HTML/CSS, C++
- **Software:** Salesforce (Sales + Marketing Cloud), HubSpot (Sales + Marketing Hub), Tableau, Google Workspace

### Behavioral Profile
- **Builder/Founder mindset** - Thrives in ambiguous 0→1 situations; comfortable creating structure from scratch
- **High urgency + effort** - Brings the attitude and work ethic needed to get things done quickly
- **Fast learner** - Picks up new domains, products, and technical concepts rapidly
- **Strengths:** Executive interfacing, cross-functional collaboration, first-of-kind deal-making, resolving ambiguity, lean operations
- **Thrives in:** Early-stage or high-growth environments with clear ownership and room to build

### What Excites You
- Building first-of-kind partnerships and integrations that expand product reach
- Working at the intersection of technical depth and business impact (solutions architecture, BD)
- 0→1 challenges — creating new programs, processes, and revenue streams from scratch
- Companies with strong product-market fit and a clear mission

### Target Roles
- Director of Partnerships, Partnerships Manager, Head of BD, Business Development
- Chief of Staff, Strategic Alliances Manager
- Solutions Engineer, Partner Solutions Manager, Technical Account Manager

### Target Sectors
- Tech / SaaS: API-first companies, fintech, developer tools, B2B platforms
- Tech-adjacent: any company with a strong product and partnership motion

### Deal-breakers
- None specified

## Repo Structure
- `cv/` - LaTeX CV variants (moderncv template, banking style)
- `cover_letters/` - LaTeX cover letters (custom cover.cls template)
- `.claude/skills/` - AI skill definitions for the application workflow
- `.agents/skills/` - Job search CLI tools

## Workflow for New Job Applications
1. User provides a job posting (URL or text)
2. **Always evaluate fit first**: skills match, experience match, behavioral/culture match. Present this assessment to the user before proceeding.
3. If good fit: create targeted CV (`cv/main_<company>.tex`) and cover letter (`cover_letters/cover_<company>_<role>.tex`)
4. **Verify both documents** (see Verification Checklist below)
5. Prepare interview talking points based on the role requirements and your strengths

**Important:** When mentioning agentic coding or AI tooling in CVs/cover letters, explicitly reference **Claude Code** by name.

## Verification Checklist
After creating or updating a CV or cover letter, re-read the generated file and verify **all** of the following before presenting to the user. Report the results as a pass/fail checklist.

### Factual accuracy
- [ ] All claims match actual profile (CLAUDE.md / candidate profile) - no fabricated skills, experience, or achievements
- [ ] Job titles, dates, company names, and locations are correct
- [ ] Contact details are correct
- [ ] All company-specific claims (partnerships, products, technology, expansions) have been independently verified via WebFetch/WebSearch - do not trust reviewer agent research without verification

### Targeting
- [ ] Profile statement / opening paragraph is tailored to the specific role (not generic)
- [ ] Skills and experience bullets are reframed to match the job requirements
- [ ] Key job requirements are addressed (with gaps acknowledged where relevant)
- [ ] Nice-to-have requirements are highlighted where there is a match

### Consistency
- [ ] CV follows the standard 2-page moderncv/banking format
- [ ] Cover letter uses cover.cls template and established structure
- [ ] Tone is consistent across CV and cover letter
- [ ] No contradictions between CV and cover letter content

### Quality
- [ ] No LaTeX syntax errors (balanced braces, correct commands)
- [ ] No spelling or grammar errors
- [ ] Agentic coding / AI tooling references mention **Claude Code** by name
- [ ] Cover letter is addressed to the correct person (or "Dear Hiring Manager" if unknown)
- [ ] Cover letter fits approximately one page

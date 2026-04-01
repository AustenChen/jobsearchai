# CV Templates and Tailoring Guide — Austen Chen

## Template: LaTeX moderncv (Banking Style)

All CVs use the moderncv LaTeX package with the "banking" style and "blue" color scheme.

**Output file:** `cv/main_<company>.tex`
**Compile with:** pdflatex (not xelatex)
**Master reference:** `cv/main_example.tex` (comprehensive CV — use as source when building targeted CVs)

## Document Structure

```latex
\documentclass[11pt,a4paper,sans]{moderncv}
\moderncvstyle{banking}
\moderncvcolor{blue}

\usepackage[utf8]{inputenc}
\usepackage{hyperref}
\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    filecolor=magenta,
    urlcolor=blue,
    pdftitle={Austen Chen - CV},
    pdfpagemode=FullScreen,
}
\usepackage[scale=0.77]{geometry}
\usepackage{import}

% Personal data
\name{Austen}{Chen}
\address{San Francisco, CA}{}{}
\phone[mobile]{(925) 818-6210}
\email{austenc33@gmail.com}
\extrainfo{\href{https://linkedin.com/in/austenchen}{LinkedIn}, \href{https://austenchen.com}{austenchen.com}}

\begin{document}
\makecvtitle

% 1. Profile statement (tailored per role)
% 2. Core Competencies
% 3. Professional Experience
% 4. Education + Certifications
% 5. References

\end{document}
```

## Profile Statement Templates

The profile statement is the most important section to customize. Write 4-6 lines that function as an elevator pitch explaining why Austen is the right hire for *this specific role*.

---

**For Director of Partnerships / Head of BD roles:**
> BD and Partnerships leader with 10+ years building technical, product-driven deals and first-of-kind integrations across fintech, adtech, and B2B SaaS. Two-time founder with a proven ability to build partnership functions from the ground up — from strategy through execution, GTM, and scale. Experienced working directly with C-Suite and enterprise decision-makers to align on vision, scope builds, and drive revenue. Thrive in ambiguous 0→1 environments where ownership, speed, and cross-functional influence matter.

---

**For Solutions Engineer / Partner Solutions Manager roles:**
> Technical partnerships professional with 10+ years bridging business strategy and product execution across embedded fintech, programmatic advertising, and B2B SaaS. At Gusto, served as the pre-sales technical SME for enterprise embedded payroll integrations — advising Chase, US Bank, and others on API architecture, backend utilization, and frontend best practices while building business cases with executive leadership. Comfortable in the full partner lifecycle: from initial scoping and technical solutioning through GTM launch and ongoing product alignment.

---

**For Strategic Alliances / Ecosystem roles:**
> Strategic Alliances and ecosystem builder with 10+ years creating first-of-kind partnerships across AdTech, fintech, and B2B SaaS. Led exploratory integrations with Google (AdMob), Twitter/MoPub, AppLovin, and AppsFlyer at Chartboost; built the FAANG + 1,000-platform ETL ecosystem at Singular. Combines strong technical fluency with the relationship skills and business acumen to structure, negotiate, and operationalize complex, multi-stakeholder partnerships at scale.

---

**For Chief of Staff roles:**
> Operational leader and two-time founder with 10+ years of experience driving cross-functional alignment, building scalable processes, and executing directly alongside C-Suite leadership. At Autodesk, defined platform GTM strategy with the executive team and drove internal alignment across 15,000+ employees. At 2nd Address, led the full business model transformation and rebuilt the Salesforce forecasting infrastructure. Brings the generalist breadth, founder urgency, and executive presence to operate effectively as a force multiplier for senior leadership.

---

## Section-by-Section Tailoring

### Core Competencies
Choose 5-7 from this list based on what the job posting emphasizes:
- **Business Development & Partnerships:** First-of-kind integrations, ecosystem building, deal structuring, contract negotiation
- **Solutions Architecture:** Pre-sales technical advisory, API integration, demo engineering, phased build scoping
- **GTM Strategy & Platform Marketing:** C-Suite collaboration, ICP definition, competitive analysis, messaging frameworks
- **Revenue Operations:** Salesforce/HubSpot, pipeline management, forecasting, CRM overhauls
- **Technical Fluency:** REST APIs, ETL processes, backend/frontend patterns, Python, SQL, JavaScript
- **Team Leadership:** Built and managed distributed partnerships teams of 10+; cross-functional influence without direct authority
- **Founder/Operator Mindset:** 0→1 program creation, lean operations, resolving ambiguity, OnDeck Fellow (ODF8)

### Professional Experience — Tailoring Guide

**For BD/Partnerships-heavy roles:** Lead with Gusto (enterprise, technical, pre-sales) and Singular ($2m MRR, distributed team, FAANG ecosystem). Emphasize Chartboost's $3m ARR lift and first-of-kind integrations.

**For Solutions Engineering / Technical roles:** Lead with Gusto (API advising, backend/frontend best practices, AI-based tooling). Mention Singular's ETL/CDN integrations and Chartboost's SDK advisory work.

**For platform/ecosystem/alliances roles:** Lead with Chartboost (header bidding partnerships, AdMob/Twitter/AppLovin) and Singular (1,000+ platform ecosystem, omni-channel). Mention Gusto's enterprise embedded payroll partner ecosystem.

**For CoS / operational roles:** Lead with Autodesk (GTM strategy, 15,000-person alignment, OKR integration) and 2nd Address (business model transformation, Salesforce overhaul, +100% booking growth). Use the founder experience at Orihon to show operational range.

### Employment Gap Note
There is a brief gap between Gusto (July 2024) and the present (April 2025). If asked:
> "I used the time to wind down Orihon thoughtfully and to be selective about my next role. I wanted to find a position where I could build something meaningful, not just land anywhere quickly."

### Page Budget — Hard 2-Page Limit

| Section | Max budget |
|---------|-----------|
| Profile statement | 4-5 lines |
| Core Competencies | 5-6 items, 1-2 lines each |
| Most recent role (Gusto) | 4 bullets |
| Orihon | 2-3 bullets |
| Autodesk | 2-3 bullets |
| 2nd Address | 2-3 bullets |
| Singular | 2-3 bullets |
| Chartboost | 2-3 bullets |
| Apple + Ergo Tedium | 1 bullet each or omit |
| Education | 2 entries (UC Davis + ScrumMaster) |
| References | "Available upon request." |

**If in doubt, cut rather than squeeze.** Apple and Ergo Tedium are optional for senior roles.

## Recommended Section Order

**For BD/Partnerships/Solutions roles:**
1. Profile statement
2. Core Competencies
3. Professional Experience (reverse chronological)
4. Education + Certifications
5. References

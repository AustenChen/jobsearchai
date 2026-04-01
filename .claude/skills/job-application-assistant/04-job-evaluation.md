# Job Evaluation Framework — Austen Chen

## Scoring Dimensions

Evaluate each job posting against these five dimensions:

### 1. Technical Skills Match (0-100)
How well do the required/preferred skills align with Austen's capabilities?

| Score | Meaning |
|-------|---------|
| 80-100 | Core requirements are primary skills |
| 60-79 | Most requirements match, 1-2 gaps that are learnable |
| 40-59 | Partial match, significant upskilling needed |
| 0-39 | Fundamental mismatch |

**Strong match areas:**
- Business development, strategic partnerships, alliances
- Solutions architecture / partner engineering (pre-sales, API advising, technical demos)
- Revenue operations, GTM strategy, platform go-to-market
- Salesforce and HubSpot (CRM, pipelines, forecasting)
- B2B SaaS, embedded fintech/payroll, programmatic advertising/adtech, MarTech
- Contract negotiation, executive interfacing, cross-functional alignment
- 0→1 program building, first-of-kind integrations

**Moderate match areas:**
- Product marketing / platform marketing
- Chief of Staff (strong ops + exec interface, but limited formal CoS experience)
- Technical Account Management
- Data analytics and BI (Tableau, SQL — proficient but not primary)

**Weak match areas:**
- Deep software engineering / full-stack development
- Data science / ML engineering
- Finance / accounting / legal
- Pure enterprise sales (AE quota-carrying without partnerships component)

### 2. Experience Match (0-100)
Does work history align with what they're looking for?

| Score | Meaning |
|-------|---------|
| 80-100 | Direct experience in the same domain and role type |
| 60-79 | Related experience, transferable skills clear |
| 40-59 | Adjacent experience, would need to make the case |
| 0-39 | Unrelated experience |

**Strong direct experience:**
- Partnerships (BD, strategic alliances, ecosystem building) — 10+ years
- Solutions architecture / partner engineering — Gusto role directly
- B2B SaaS — Gusto, Singular, Chartboost, 2nd Address all SaaS-native
- API / platform ecosystem partnerships — Singular (ETL, CDN integrations), Chartboost (SDK/header bidding), Gusto (embedded payroll API)
- Enterprise deal-making — Chase, US Bank, FAANG, Target, Walmart, LinkedIn
- Startup / founding experience — Orihon (6 years), Ergo Tedium

**Moderate/adjacent experience:**
- Platform / product marketing (Autodesk) — strong GTM skills, less direct product marketing background
- Revenue operations and CRM management (2nd Address Salesforce overhaul)
- Team leadership (Singular: 10+ person distributed team)

**Gap areas:**
- Public company / large enterprise from day 1 (always joined in growth/scale phase)
- Formal P&L ownership (has influenced revenue but hasn't owned a budget line)

### 3. Behavioral/Culture Fit (0-100)
Does the role and company culture match the behavioral profile?

| Score | Meaning |
|-------|---------|
| 80-100 | Culture strongly matches behavioral preferences |
| 60-79 | Mixed signals but mostly compatible |
| 40-59 | Some friction areas |
| 0-39 | Significant culture mismatch |

**Strong culture fit signals:** Fast-moving, high-growth, startup or scale-up stage, builder culture, high ownership, direct access to leadership, cross-functional collaboration, mission-driven product

**Red flags to research:** Heavily bureaucratic processes, maintenance-only work, siloed teams, weak leadership advocacy, companies in decline, no growth path

Check Glassdoor, LinkedIn, and network contacts for insider perspective on culture and leadership style.

### 4. Location & Logistics (Pass/Fail + Notes)
- Remote (US): **PASS**
- SF Bay Area hybrid/in-person: **PASS**
- Relocation to another US city: **PASS** (willing to relocate)
- International relocation (without strong reason): **FLAG** — discuss with Austen

### 5. Career Alignment & Motivation (0-100)
Does this role advance career goals and contain tasks that energize?

| Score | Meaning |
|-------|---------|
| 80-100 | Strongly aligned with career direction, clear growth path |
| 60-79 | Good role but only partially aligned with long-term goals |
| 40-59 | Decent job but doesn't build toward career goals |
| 0-39 | Dead end or backwards step |

**Career goals:**
- Move into a senior-level BD/Partnerships or Solutions leadership role at a tech company with strong product-market fit
- Build and own a partnerships function or ecosystem from the ground up
- Work on products that have real impact — preferably in fintech, developer tools, or B2B SaaS

**Tasks that energize Austen:**
- Closing first-of-kind deals and integrations
- Building relationships with technical and executive partners
- Designing new programs, processes, and playbooks
- Working cross-functionally to launch new products or features with partners
- Learning new technical domains and translating them into business value

**Tasks that drain:**
- Repetitive account maintenance without growth opportunities
- Heavy internal meetings without external-facing outcomes
- Rigid process with no room for initiative

**Life situation alignment:**
- **Flexibility:** Open to full commitment — remote, hybrid, or in-office all work
- **Growth:** Prioritizes role scope and company trajectory over title inflation
- **Stability:** Ready to commit to a long-term position after the Orihon/Gusto period

### 6. Salary Benchmark (Optional)

If the salary lookup tool is configured (`salary_data.json` exists), look up the company:
```
python salary_lookup.py "<Company Name>" --json
```

If a city is known from the posting, add `--city "<City>"` to narrow results.

Present findings as:
```
### Salary Benchmark
| Metric | Value |
|--------|-------|
| [Category] index | XX.X (+/-X.X% vs baseline) |
| Overall index | XX.X (+/-X.X% vs baseline) |
```

Interpret results relative to the baseline defined in the data file's metadata.

If the salary tool is not configured, skip this section.

## Output Format

Present the evaluation as:

```
## Job Fit Evaluation: [Role] at [Company]

| Dimension | Score | Notes |
|-----------|-------|-------|
| Technical Skills | XX/100 | [brief note] |
| Experience Match | XX/100 | [brief note] |
| Behavioral Fit | XX/100 | [brief note] |
| Location | PASS/FAIL | [brief note] |
| Career Alignment | XX/100 | [brief note] |

**Overall Score: XX/100** (weighted average of scored dimensions)

### Verdict: [Strong Fit / Good Fit / Moderate Fit / Weak Fit / Poor Fit]

### Key Strengths for This Role
- [bullet points]

### Gaps to Address
- [bullet points]

### Recommendation
[1-2 sentences: apply/skip/apply with caveats]

### Company Research Checklist
- [ ] Checked company website (mission, values, recent news)
- [ ] Checked review sites (Glassdoor, Blind, etc.)
- [ ] Checked LinkedIn for team size, recent hires, connections
- [ ] Checked media for restructuring, growth, or workplace issues
- [ ] Identified network contacts who may know the team/manager
```

## Weighting
- Technical Skills: 30%
- Experience Match: 25%
- Behavioral Fit: 15%
- Career Alignment: 30%

(Location is pass/fail, not weighted)

## Thresholds
- **Strong Fit** (75+): Definitely apply, tailor everything
- **Good Fit** (60-74): Apply, address gaps in cover letter
- **Moderate Fit** (45-59): Consider carefully, discuss with Austen
- **Weak Fit** (30-44): Probably skip unless strategic reasons
- **Poor Fit** (<30): Skip

## Pre-Application: Call the Employer (Best Practice)

Before writing the application, consider whether Austen should call the contact person listed. **Only call if there are substantive questions** — never call just to "be remembered."

### When to Suggest Calling
- The posting has unclear or ambiguous requirements
- It's unclear which competencies are essential vs. nice-to-have
- The role description is vague about day-to-day scope
- There's a named contact person who invites questions

### Good Questions to Ask
- "What are the primary challenges in this role?"
- "How is time typically divided across the listed responsibilities?"
- "Which competencies are most critical for success in this position?"
- "What does success look like in the first 6-12 months?"

### Rules for the Call
- Prepare a 30-second pitch about Austen's background in case they ask
- The call's purpose is **gathering information**, not delivering a pitch
- Take notes — use what you learn to tailor the application
- Reference the conversation naturally in the cover letter ("After speaking with [name]...")

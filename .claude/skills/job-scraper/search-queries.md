# Search Queries for Job Scraper — Austen Chen

## Search Sites

Primary (US job market):
- **linkedin.com/jobs** - LinkedIn job listings (filter: United States / San Francisco)
- **ashbyhq.com** - Ashby ATS (use ashby-search skill for target companies)
- **lever.co** - Lever ATS (use lever-search skill for target companies)
- **smartrecruiters.com** - SmartRecruiters ATS (use smartrecruiters-search skill)
- **workable.com** - Workable ATS (use workable-search skill for target companies)

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for known target companies
- `site:greenhouse.io` for companies using Greenhouse ATS
- `site:jobs.lever.co` for Lever-hosted job pages
- `site:jobs.ashbyhq.com` for Ashby-hosted job pages

---

## Target Companies by ATS

Use the dedicated CLI skills to query these directly — faster and more structured than WebSearch.

### Lever (lever-search)
```
# Add/remove slugs based on your current target list:
# stripe, cloudflare, rippling, plaid, brex, gusto, figma, notion, linear
```

### Ashby (ashby-search)
```
# Add/remove slugs based on your current target list:
# anthropic, scale-ai, retool, mercury, vercel, runway, ramp, deel
```

### SmartRecruiters (smartrecruiters-search)
```
# Add/remove company IDs based on your current target list:
# Thoughtworks, Salesforce, HubSpot
```

### Workable (workable-search)
```
# Add/remove slugs based on your current target list:
# hubspot, intercom, gitlab, buffer
```

---

## Query Categories

### Priority 1: BD / Partnerships / Strategic Alliances

Core target — strongest match to Austen's background and goals.

```
site:linkedin.com/jobs "Director of Partnerships" "San Francisco" OR Remote
site:linkedin.com/jobs "Head of Partnerships" "San Francisco" OR Remote
site:linkedin.com/jobs "VP of Partnerships" "San Francisco" OR Remote
site:jobs.lever.co "Director of Partnerships" "San Francisco" OR Remote
site:jobs.ashbyhq.com "Head of Business Development" Remote
site:linkedin.com/jobs "Strategic Alliances Manager" tech "San Francisco"
site:greenhouse.io "Director of Strategic Partnerships" "San Francisco" OR Remote
```

### Priority 2: Solutions Engineering / Partner Solutions

Strong match — directly reflects the Gusto Embedded Payroll role.

```
site:linkedin.com/jobs "Solutions Engineer" partnerships "San Francisco" OR Remote
site:linkedin.com/jobs "Partner Solutions Manager" "San Francisco" OR Remote
site:jobs.lever.co "Partner Solutions Engineer" Remote
site:jobs.ashbyhq.com "Solutions Architect" partnerships Remote
site:greenhouse.io "Partner Engineer" "San Francisco" OR Remote
site:linkedin.com/jobs "Technical Account Manager" fintech "San Francisco" OR Remote
```

### Priority 3: Business Development (General)

Broader BD roles — especially at API-first, fintech, or developer tool companies.

```
site:linkedin.com/jobs "Director of Business Development" SaaS "San Francisco" OR Remote
site:jobs.lever.co "Head of Business Development" fintech
site:jobs.ashbyhq.com "Business Development" "San Francisco" OR Remote
site:linkedin.com/jobs "Business Development Manager" API "San Francisco"
site:greenhouse.io "Business Development" fintech "San Francisco" OR Remote
```

### Priority 4: Chief of Staff / Adjacent Roles

Adjacent roles worth monitoring — strong fit given operational + executive interface background.

```
site:linkedin.com/jobs "Chief of Staff" tech "San Francisco" OR Remote
site:jobs.lever.co "Chief of Staff" startup "San Francisco" OR Remote
site:jobs.ashbyhq.com "Chief of Staff" Remote
site:linkedin.com/jobs "Head of Operations" partnerships "San Francisco"
site:greenhouse.io "Chief of Staff" "Series B" OR "Series C" "San Francisco"
```

---

## Location Filter

Acceptable locations (Austen is open to all of the following):
- **Ideal:** San Francisco Bay Area (on-site or hybrid)
- **Strongly preferred:** Remote (US-based) — any time zone
- **Open to:** New York, Seattle, Los Angeles, Austin, Boston
- **Would consider for the right role:** Relocation to any major US city

Do not exclude any of the above. Only flag if the role requires immediate non-US relocation.

---

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If posting date cannot be determined, include it but flag as "date unknown."

---

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and generate 2-3 custom queries:

- `/scrape partnerships` → Priority 1 queries + custom queries for "strategic partnerships" and "alliances"
- `/scrape solutions` → Priority 2 queries + custom queries for "solutions architect" and "partner engineer"
- `/scrape fintech` → Cross-priority queries filtered to fintech/payments/embedded finance companies
- `/scrape [company]` → Use the relevant ATS CLI directly (e.g. `lever-search search --company stripe --format table`)

For target company searches, invoke the relevant ATS skill directly rather than using WebSearch:
```bash
# Example: check Stripe's Lever board for partnerships roles
bun run skills/lever-search/cli/src/cli.ts search --company stripe --team Partnerships --format table

# Example: check Anthropic's Ashby board
bun run skills/ashby-search/cli/src/cli.ts search --company anthropic --department Business --format table
```

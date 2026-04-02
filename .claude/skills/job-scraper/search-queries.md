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

## Target Companies

Search these companies directly using `site:` WebSearch queries. The previous CLI-based
approach (lever-search, ashby-search, etc.) is blocked by API-level IP restrictions
("Host not allowed" 403 errors) and should not be used.

### Lever-hosted companies
Use `site:jobs.lever.co/<slug>` queries:
```
site:jobs.lever.co/stripe partnerships OR "business development" OR "solutions"
site:jobs.lever.co/cloudflare partnerships OR "business development"
site:jobs.lever.co/rippling partnerships OR "business development"
site:jobs.lever.co/plaid partnerships OR "business development"
site:jobs.lever.co/brex partnerships OR "business development"
site:jobs.lever.co/figma partnerships OR "business development"
site:jobs.lever.co/notion partnerships OR "business development"
site:jobs.lever.co/linear partnerships OR "business development"
```

### Ashby-hosted companies
Use `site:jobs.ashbyhq.com/<slug>` queries:
```
site:jobs.ashbyhq.com/anthropic partnerships OR "business development"
site:jobs.ashbyhq.com/scale-ai partnerships OR "business development"
site:jobs.ashbyhq.com/retool partnerships OR "business development"
site:jobs.ashbyhq.com/mercury partnerships OR "business development"
site:jobs.ashbyhq.com/vercel partnerships OR "business development"
site:jobs.ashbyhq.com/runway partnerships OR "business development"
site:jobs.ashbyhq.com/ramp partnerships OR "business development"
site:jobs.ashbyhq.com/deel partnerships OR "business development"
```

### Greenhouse-hosted companies
Use `site:boards.greenhouse.io/<company>` or `site:job-boards.greenhouse.io/<company>` queries:
```
site:boards.greenhouse.io partnerships OR "business development" OR "strategic alliances"
site:job-boards.greenhouse.io partnerships OR "business development"
```

### Other target companies (direct career pages)
```
"<company> careers" partnerships OR "business development" "San Francisco" OR Remote
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

For target company searches, use WebSearch with `site:` filters rather than CLI tools:
```
# Example: check Stripe's Lever board for partnerships roles
WebSearch: site:jobs.lever.co/stripe partnerships OR "strategic alliances" OR "business development"

# Example: check Anthropic's Ashby board
WebSearch: site:jobs.ashbyhq.com/anthropic partnerships OR "business development" OR "solutions"
```

> **Note:** The CLI tools (`lever-search`, `ashby-search`, etc.) are blocked by "Host not
> allowed" 403 errors from the ATS APIs. These APIs reject requests from non-browser/datacenter
> IPs. WebSearch with `site:` queries is the recommended alternative. Be aware that results may
> be stale — always verify URLs are still live before applying.

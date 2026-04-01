# /scrape - Job Search Scraper

Search US job sites for new positions matching Austen Chen's profile. Deduplicate against previously seen jobs. Present results sorted by fit.

Optional arguments in `$ARGUMENTS`:
- A focus area, e.g. `/scrape partnerships` or `/scrape fintech` → prioritize queries for that category
- `broad` → run all 4 priority query categories instead of the default top 3

---

## Step 0: Load State

1. Read `job_scraper/seen_jobs.json` (create if missing — start with `{"seen": {}}`)
2. Read `job_search_tracker.csv` to extract already-applied companies + roles
3. Read `.claude/skills/job-scraper/search-queries.md` for the search strategy and target company lists

---

## Step 1: Search

Run **WebSearch** queries from `search-queries.md`. By default, run Priority 1, 2, and 3 categories. If `$ARGUMENTS` contains "broad", run all 4 categories.

If `$ARGUMENTS` specifies a focus area (e.g. "partnerships", "solutions", "fintech"), prioritize queries from the matching category and generate 2-3 additional custom queries for that focus.

For each WebSearch:
- Use site-specific queries as defined in `search-queries.md`
- Target San Francisco Bay Area and/or Remote (US)
- Look for postings from the last 14 days

For ATS target companies listed in `search-queries.md`, also run the dedicated CLI tools in parallel:
```bash
# Lever companies
bun run .agents/skills/lever-search/cli/src/cli.ts search --company <slug> --format json --limit 10

# Ashby companies
bun run .agents/skills/ashby-search/cli/src/cli.ts search --company <slug> --format json --limit 10
```

---

## Step 2: Fetch & Parse

For each promising result from Step 1:
- Use `WebFetch` to retrieve the job posting page
- Extract: **job title**, **company**, **location**, **posting date** (or "recent"), **URL**, **key requirements** (2-3 bullet summary), **application deadline** (if listed)
- Skip if the URL or company+title combo already exists in `seen_jobs.json`
- Skip if the company+role already appears in `job_search_tracker.csv`
- Be efficient — use search snippet text to pre-filter before fetching full pages

---

## Step 3: Quick Fit Assessment

For each new job, do a rapid fit check against Austen's profile (NOT the full evaluation — just a signal):

- **High match**: Director/Head/VP of Partnerships, BD, Solutions Engineering, Strategic Alliances, or Partner Solutions roles at a tech or fintech company
- **Medium match**: Adjacent roles — Chief of Staff, Technical Account Manager, Platform/Product Marketing, Revenue Ops
- **Low match**: Roles requiring skills Austen lacks (pure engineering, finance, non-tech sector)

---

## Step 4: Deduplicate & Store

Add ALL fetched jobs to `job_scraper/seen_jobs.json`:
```json
{
  "seen": {
    "<url_or_company_title_key>": {
      "title": "...",
      "company": "...",
      "url": "...",
      "first_seen": "YYYY-MM-DD",
      "fit": "high/medium/low",
      "status": "new/skipped/evaluated"
    }
  }
}
```

Only **present** jobs NOT already in the seen list or tracker.

---

## Step 5: Present Results

Present new jobs in a table sorted by fit (high first):

```
## New Job Matches — YYYY-MM-DD

Found X new positions (Y high, Z medium, W low match).

| # | Fit | Title | Company | Location | Posted | URL |
|---|-----|-------|---------|----------|--------|-----|
| 1 | High | ... | ... | ... | ... | [Link](...) |

### High-Match Highlights
For each high-match job, 2-3 bullets:
- Why it matches Austen's profile
- Key requirements to check
- Any red flags (culture, scope, stage)
```

After presenting, ask:
> "Want me to evaluate any of these in detail? Just give me the number(s)."

If the user picks a number, run the full `/apply` workflow (fit evaluation first, then CV + cover letter if approved).

---

## Step 6: Update Tracker (Optional)

If the user decides to apply, add a row to `job_search_tracker.csv`.

---

## Important Rules

1. **Never fabricate job postings.** Only present jobs found via actual WebSearch/WebFetch/CLI results.
2. **Respect deduplication.** Always check `seen_jobs.json` AND `job_search_tracker.csv` before presenting.
3. **Only open positions.** Skip postings with expired deadlines or marked as closed.
4. **Run searches in parallel** where possible to keep the run fast.

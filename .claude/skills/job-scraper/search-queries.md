# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->

## Search Sites

Primary (US job market):
- **linkedin.com/jobs** - LinkedIn job listings (filter: United States / your city)
- **ashbyhq.com** - Ashby ATS (use ashby-search skill for target companies)
- **lever.co** - Lever ATS (use lever-search skill for target companies)
- **smartrecruiters.com** - SmartRecruiters ATS (use smartrecruiters-search skill)
- **workable.com** - Workable ATS (use workable-search skill for target companies)

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for known target companies
- `site:greenhouse.io` for companies using Greenhouse ATS
- `site:jobs.lever.co` for Lever-hosted job pages
- `site:jobs.ashbyhq.com` for Ashby-hosted job pages

## Target Companies by ATS

<!-- SETUP: Add companies you're interested in, grouped by which ATS they use -->
<!-- The dedicated CLI skills (lever-search, ashby-search, etc.) can query these directly -->

### Lever (lever-search)
```
# Example slugs — replace with your actual target companies:
# stripe, cloudflare, figma, notion, openai, anduril-industries
```

### Ashby (ashby-search)
```
# Example slugs — replace with your actual target companies:
# anthropic, linear, retool, brex, mercury, vercel, scale-ai
```

### SmartRecruiters (smartrecruiters-search)
```
# Example company IDs — replace with your actual target companies:
# Thoughtworks, Criteo, Delivery
```

### Workable (workable-search)
```
# Example slugs — replace with your actual target companies:
# hubspot, gitlab, deel, buffer, intercom
```

## Query Categories

Queries are grouped by priority. Each query should be combined with your location terms (e.g. "New York", "San Francisco", "Remote") where the site supports it.

### Priority 1: [YOUR_PRIMARY_ROLE_TYPE]

These match your strongest and most desired career direction.

```
site:linkedin.com/jobs "[YOUR_PRIMARY_JOB_TITLE]" [YOUR_CITY] United States
site:jobs.lever.co "[YOUR_PRIMARY_JOB_TITLE]" [YOUR_CITY]
site:jobs.ashbyhq.com "[YOUR_PRIMARY_JOB_TITLE]" [YOUR_CITY]
"[YOUR_PRIMARY_JOB_TITLE]" site:greenhouse.io [YOUR_CITY]
```

### Priority 2: [YOUR_DOMAIN_EXPERTISE]

These match your domain expertise.

```
site:linkedin.com/jobs [YOUR_DOMAIN_KEYWORD_1] [YOUR_CITY] United States
site:jobs.lever.co [YOUR_DOMAIN_KEYWORD_1] [YOUR_CITY]
site:jobs.ashbyhq.com [YOUR_DOMAIN_KEYWORD_1] United States
```

### Priority 3: [YOUR_ADJACENT_ROLE_TYPE]

Adjacent roles you could pivot into.

```
site:linkedin.com/jobs "[YOUR_ADJACENT_TITLE_1]" [YOUR_KEY_SKILL] [YOUR_CITY]
site:jobs.lever.co "[YOUR_ADJACENT_TITLE_2]" [YOUR_KEY_SKILL]
site:jobs.ashbyhq.com "[YOUR_ADJACENT_TITLE_1]" [YOUR_KEY_SKILL]
```

### Priority 4: Broader Technical / Remote

Wider net for general technical roles, including remote-first.

```
site:linkedin.com/jobs "[YOUR_KEY_SKILL] developer" Remote United States
site:jobs.lever.co "[YOUR_KEY_SKILL]" Remote
site:jobs.ashbyhq.com "[YOUR_KEY_SKILL]" Remote
"[YOUR_KEY_SKILL]" "remote" site:greenhouse.io
```

## Location Filter

When evaluating results, verify the job location is within acceptable range. Define acceptable areas:
- [YOUR_CITY] and surrounding metro area
- [ACCEPTABLE_AREA_1]
- [ACCEPTABLE_AREA_2]
- Remote (US timezone compatible)
- [TOO_FAR] (exclude — relocation required)

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape [focus_area]" -> relevant category queries + custom focus-specific queries

For ATS-specific searches of target companies, invoke the relevant skill directly:
- `/scrape [company]` on Lever → `lever-search search --company [slug] --format table`
- `/scrape [company]` on Ashby → `ashby-search search --company [slug] --format table`

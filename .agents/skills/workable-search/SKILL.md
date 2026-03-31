---
name: workable-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for jobs at a specific company
  that uses Workable ATS, or when the user asks to check open positions at a company
  on workable.com. Trigger phrases include: workable jobs, workable.com,
  check workable, jobs at [company], open positions [company], hiring at [company],
  search workable, workable posting, workable careers, ATS workable.
context: fork
allowed-tools: Bash(bun run skills/workable-search/cli/src/cli.ts *)
---

# Workable Search Skill

Search live job listings from companies using [Workable ATS](https://workable.com). No authentication needed.
Workable is used by thousands of companies, particularly in tech and startups. Each company has a public jobs widget API.

## When to use this skill

Invoke this skill when the user wants to:

- Search open positions at a specific company that uses Workable ATS
- Filter jobs by department, location, or work type
- Get the full description of a specific Workable job posting
- Check multiple companies' Workable boards in sequence

## Finding the company slug

The slug is the company's Workable subdomain or short name, found in their careers URL:
`https://apply.workable.com/{slug}` or `https://{slug}.workable.com/jobs`

Examples: `hubspot`, `gitlab`, `deel`, `remote`, `buffer`, `intercom`

If unsure, try the company name in lowercase with hyphens (e.g. `the-trade-desk`).

## Commands

### Search job listings

```bash
bun run skills/workable-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--company <slug>` — **Required**. The company's Workable slug
- `--query <text>` — keyword search on job title (client-side)
- `--department <text>` — client-side filter by department name (partial match)
- `--location <text>` — client-side filter by office/location name (partial match)
- `--remote` — filter to remote-friendly roles only
- `--limit <n>` — cap total results returned (default: all)
- `--format json|table|plain` — output format (default: `json`)

### Fetch full job detail

```bash
bun run skills/workable-search/cli/src/cli.ts detail --company <slug> <shortcode>
```

`shortcode` is the job shortcode from `search` results (e.g. `ABC123`). Returns full description and application URL.

---

## How to use effectively

**Always specify `--company`.** This is a company-specific API — there is no global Workable search.

**Use `--query` to filter by title keyword.** E.g. `--query "software engineer"`.

**Use `--remote` to find remote-friendly positions.**

**Natural workflow: `search` → `detail`.**
1. Run `search` to find matching jobs and their shortcodes.
2. Run `detail --company <slug> <shortcode>` for the full description and apply link.

---

## Usage examples

### All open positions at HubSpot

```bash
bun run skills/workable-search/cli/src/cli.ts search \
  --company hubspot \
  --format table
```

### Engineering roles

```bash
bun run skills/workable-search/cli/src/cli.ts search \
  --company gitlab \
  --department Engineering \
  --format table
```

### Remote software roles

```bash
bun run skills/workable-search/cli/src/cli.ts search \
  --company buffer \
  --query "software" \
  --remote \
  --format table
```

### Filter by location

```bash
bun run skills/workable-search/cli/src/cli.ts search \
  --company intercom \
  --location "San Francisco" \
  --format table
```

### Get full details for a specific posting

```bash
bun run skills/workable-search/cli/src/cli.ts detail \
  --company hubspot \
  ABC123
```

---

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, data processing, passing shortcodes to `detail` |
| `table` | Quick human-readable overview and scanning |
| `plain` | Reading a single job's full details (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

---

## Notes

- Data is from the public Workable widget API — no credentials required.
- Not all companies use Workable. If a slug returns an error, try Lever, Ashby, or SmartRecruiters instead.
- All filtering (`--query`, `--department`, `--location`, `--remote`) is client-side.
- The Workable widget API returns all current openings in one request.
- The `detail` command fetches the full job page from `apply.workable.com/{company}/j/{shortcode}`.

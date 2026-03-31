---
name: lever-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for jobs at a specific company
  that uses Lever ATS, or when the user asks to check open positions at a company
  on lever.co. Trigger phrases include: lever jobs, lever.co, check lever,
  jobs at [company], open positions [company], hiring at [company],
  search lever, lever posting, lever careers, ATS lever.
context: fork
allowed-tools: Bash(bun run skills/lever-search/cli/src/cli.ts *)
---

# Lever Search Skill

Search live job listings from companies using [Lever ATS](https://lever.co). No authentication needed.
Lever is used by thousands of tech companies. Each company has a public jobs API endpoint.

## When to use this skill

Invoke this skill when the user wants to:

- Search open positions at a specific company that uses Lever ATS
- Filter jobs by team, location, or employment type at a Lever-based company
- Get the full description of a specific Lever job posting
- Check multiple companies' Lever boards in sequence

## Finding the company slug

The company slug is the subdomain used in the company's Lever jobs URL:
`https://jobs.lever.co/{slug}` or `https://api.lever.co/v0/postings/{slug}`

Examples: `netflix`, `stripe`, `openai`, `cloudflare`, `figma`, `notion`

If unsure, try the company name in lowercase with hyphens (e.g. `anduril-industries`).

## Commands

### Search job listings

```bash
bun run skills/lever-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--company <slug>` — **Required**. The company's Lever slug (e.g. `stripe`)
- `--team <text>` — filter by team name (e.g. `Engineering`, `Data`, `Sales`)
- `--location <text>` — filter by location (e.g. `San Francisco`, `Remote`)
- `--commitment <text>` — filter by type: `Full-time`, `Part-time`, `Internship`, `Contract`
- `--query <text>` — client-side keyword filter on job title
- `--limit <n>` — cap total results returned (default: all)
- `--format json|table|plain` — output format (default: `json`)

### Fetch full job detail

```bash
bun run skills/lever-search/cli/src/cli.ts detail --company <slug> <id>
```

`id` is the UUID from `search` results. Returns full description, application URL, and metadata.

---

## How to use effectively

**Always specify `--company`.** This is a company-specific API — there is no global Lever search.

**Use `--query` to filter by keyword.** Client-side filter on job title (e.g. `--query "machine learning"`).

**Use `--location Remote` to find remote roles.**

**Natural workflow: `search` → `detail`.**
1. Run `search` to find matching jobs and their IDs.
2. Run `detail --company <slug> <id>` for the full description and apply link.

---

## Usage examples

### All open positions at Stripe

```bash
bun run skills/lever-search/cli/src/cli.ts search \
  --company stripe \
  --format table
```

### Engineering roles at Cloudflare in San Francisco

```bash
bun run skills/lever-search/cli/src/cli.ts search \
  --company cloudflare \
  --team Engineering \
  --location "San Francisco" \
  --format table
```

### Remote ML roles at a company

```bash
bun run skills/lever-search/cli/src/cli.ts search \
  --company openai \
  --query "machine learning" \
  --location Remote \
  --format table
```

### Full-time data roles

```bash
bun run skills/lever-search/cli/src/cli.ts search \
  --company figma \
  --team Data \
  --commitment Full-time \
  --format table
```

### Get full details for a specific posting

```bash
bun run skills/lever-search/cli/src/cli.ts detail \
  --company stripe \
  abc12345-def6-7890-ghij-klmnopqrstuv
```

---

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, data processing, passing IDs to `detail` |
| `table` | Quick human-readable overview and scanning |
| `plain` | Reading a single job's full details (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

---

## Notes

- Data is from the public Lever API — no credentials required.
- Not all companies use Lever. If a company slug returns an error, try Ashby, Greenhouse, or Workable instead.
- The Lever API returns all postings in a single response (no pagination).
- `--team`, `--location`, and `--commitment` filters are applied server-side by Lever.
- `--query` is a client-side keyword filter on the job title.

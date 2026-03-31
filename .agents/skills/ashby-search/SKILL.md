---
name: ashby-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for jobs at a specific company
  that uses Ashby ATS, or when the user asks to check open positions at a company
  on ashbyhq.com. Trigger phrases include: ashby jobs, ashbyhq, check ashby,
  jobs at [company], open positions [company], hiring at [company],
  search ashby, ashby posting, ashby careers, ATS ashby.
context: fork
allowed-tools: Bash(bun run skills/ashby-search/cli/src/cli.ts *)
---

# Ashby Search Skill

Search live job listings from companies using [Ashby ATS](https://ashbyhq.com). No authentication needed.
Ashby is widely used by modern tech and startup companies. Each company has a public job board API.

## When to use this skill

Invoke this skill when the user wants to:

- Search open positions at a specific company that uses Ashby ATS
- Filter jobs by department or location at an Ashby-based company
- Get the full description of a specific Ashby job posting
- Check multiple companies' Ashby boards in sequence

## Finding the company slug

The slug is the company's hosted jobs page name, found in their Ashby careers URL:
`https://jobs.ashbyhq.com/{slug}` → slug is what comes after `jobs.ashbyhq.com/`

Examples: `anthropic`, `linear`, `retool`, `brex`, `mercury`, `vercel`

If unsure, try the company name in lowercase with hyphens (e.g. `scale-ai`).

## Commands

### Search job listings

```bash
bun run skills/ashby-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--company <slug>` — **Required**. The company's Ashby slug (e.g. `anthropic`)
- `--department <text>` — client-side filter by department name (case-insensitive, partial match)
- `--location <text>` — client-side filter by location name (case-insensitive, partial match)
- `--query <text>` — client-side keyword filter on job title
- `--limit <n>` — cap total results returned (default: all)
- `--format json|table|plain` — output format (default: `json`)

### Fetch full job detail

```bash
bun run skills/ashby-search/cli/src/cli.ts detail --company <slug> <id>
```

`id` is the UUID from `search` results. Returns full description and application URL.

---

## How to use effectively

**Always specify `--company`.** This is a company-specific API — there is no global Ashby search.

**Use `--query` to filter by keyword.** Client-side filter on job title (e.g. `--query "software engineer"`).

**Use `--location Remote` to find remote roles.**

**Natural workflow: `search` → `detail`.**
1. Run `search` to find matching jobs and their IDs.
2. Run `detail --company <slug> <id>` for the full description and apply link.

---

## Usage examples

### All open positions at Anthropic

```bash
bun run skills/ashby-search/cli/src/cli.ts search \
  --company anthropic \
  --format table
```

### Engineering roles at Linear

```bash
bun run skills/ashby-search/cli/src/cli.ts search \
  --company linear \
  --department Engineering \
  --format table
```

### Remote ML/AI roles

```bash
bun run skills/ashby-search/cli/src/cli.ts search \
  --company scale-ai \
  --query "machine learning" \
  --location Remote \
  --format table
```

### Get full details for a specific posting

```bash
bun run skills/ashby-search/cli/src/cli.ts detail \
  --company anthropic \
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

- Data is from the public Ashby Posting API — no credentials required.
- Not all companies use Ashby. If a slug returns an error, try Lever, Greenhouse, or Workable instead.
- `--department` and `--location` are client-side filters (Ashby API returns all postings at once).
- `--query` is a client-side keyword filter on the job title.
- The Ashby API returns all listed postings in a single response (no pagination).

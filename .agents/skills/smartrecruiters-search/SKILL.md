---
name: smartrecruiters-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search for jobs at a specific company
  that uses SmartRecruiters ATS, or when the user asks to check open positions at
  a company on smartrecruiters.com. Trigger phrases include: smartrecruiters jobs,
  smartrecruiters.com, check smartrecruiters, jobs at [company], open positions
  [company], hiring at [company], search smartrecruiters, smartrecruiters posting,
  smartrecruiters careers, ATS smartrecruiters.
context: fork
allowed-tools: Bash(bun run skills/smartrecruiters-search/cli/src/cli.ts *)
---

# SmartRecruiters Search Skill

Search live job listings from companies using [SmartRecruiters ATS](https://smartrecruiters.com). No authentication needed.
SmartRecruiters is used by many enterprise and mid-size companies. Each company has a public jobs API.

## When to use this skill

Invoke this skill when the user wants to:

- Search open positions at a specific company that uses SmartRecruiters ATS
- Filter jobs by keyword, department, or location
- Get the full description of a specific SmartRecruiters job posting
- Check multiple companies' SmartRecruiters boards in sequence

## Finding the company identifier

The SmartRecruiters company ID is usually the company name or identifier from their careers URL:
`https://careers.smartrecruiters.com/{CompanyId}` or `https://jobs.smartrecruiters.com/`

Examples: `IKEA`, `Bosch`, `Lidl`, `Thoughtworks`, `Delivery`, `Criteo`

The ID is case-sensitive in some cases. Try `CompanyName` (PascalCase) or all-caps.

## Commands

### Search job listings

```bash
bun run skills/smartrecruiters-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--company <id>` — **Required**. The SmartRecruiters company identifier
- `--query <text>` — keyword search (job title, skill)
- `--location <text>` — filter by city or country
- `--department <text>` — filter by department label (client-side partial match)
- `--limit <n>` — cap total results returned (default: 20)
- `--offset <n>` — pagination offset (default: 0)
- `--format json|table|plain` — output format (default: `json`)

### Fetch full job detail

```bash
bun run skills/smartrecruiters-search/cli/src/cli.ts detail --company <id> <posting-id>
```

`posting-id` is the ID from `search` results. Returns full description and application URL.

---

## How to use effectively

**Always specify `--company`.** This is a company-specific API.

**Use `--query` for keyword search** on the server side (job title, skills).

**Use `--limit` and `--offset` for pagination.** Default page size is 20.

**Natural workflow: `search` → `detail`.**
1. Run `search` to find matching jobs and their IDs.
2. Run `detail --company <id> <posting-id>` for the full description and apply link.

---

## Usage examples

### All open positions at Thoughtworks

```bash
bun run skills/smartrecruiters-search/cli/src/cli.ts search \
  --company Thoughtworks \
  --format table
```

### Engineering roles with keyword filter

```bash
bun run skills/smartrecruiters-search/cli/src/cli.ts search \
  --company Thoughtworks \
  --query "software engineer" \
  --format table
```

### Jobs in a specific city

```bash
bun run skills/smartrecruiters-search/cli/src/cli.ts search \
  --company Criteo \
  --location "New York" \
  --format table
```

### Paginate results (page 2 of 20)

```bash
bun run skills/smartrecruiters-search/cli/src/cli.ts search \
  --company IKEA \
  --limit 20 \
  --offset 20 \
  --format table
```

### Get full details for a specific posting

```bash
bun run skills/smartrecruiters-search/cli/src/cli.ts detail \
  --company Thoughtworks \
  abc123def456ghi
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

- Data is from the public SmartRecruiters API — no credentials required.
- Not all companies use SmartRecruiters. If a company ID returns an error, try Lever, Ashby, or Workable instead.
- Company IDs are case-sensitive. Check the careers URL if unsure.
- Default page size is 20; use `--offset` to paginate.
- `--department` is a client-side partial-match filter on the department label.

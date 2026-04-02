#!/usr/bin/env bun
/**
 * ashby-search CLI
 * Search job listings from companies using Ashby ATS (ashbyhq.com)
 *
 * Usage:
 *   bun run cli.ts search --company <slug> [--department <text>] [--location <text>]
 *                         [--query <text>] [--limit <n>] [--format json|table|plain]
 *   bun run cli.ts detail --company <slug> <id>
 */

const BOARD_API = "https://api.ashbyhq.com/posting-api/job-board"
const POSTING_API = "https://api.ashbyhq.com/posting-api/job-posting"

// ── Types ──────────────────────────────────────────────────────────────────

interface AshbyPosting {
  id: string
  title: string
  teamName: string | null
  departmentName: string | null
  locationName: string | null
  employmentType: string | null
  descriptionHtml: string | null
  descriptionSocial: string | null
  publishedDate: string // ISO date string
  externalLink: string | null
  isListed: boolean
  compensationTierSummary: string | null
  secondaryLocations: Array<{ locationName: string }> | null
}

interface AshbyBoardResponse {
  success: boolean
  data: {
    jobPostings: AshbyPosting[]
    organization: {
      name: string
      jobBoardUrl: string
    }
  }
}

interface AshbyPostingResponse {
  success: boolean
  data: AshbyPosting & {
    applicationFormDefinition?: unknown
  }
}

interface OutputJob {
  id: string
  title: string
  department: string
  location: string
  type: string
  posted: string
  url: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function writeError(error: string, code: string): never {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
  process.exit(1)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function postWithRetry<T>(url: string, body: unknown): Promise<T> {
  let delay = 500
  for (let attempt = 0; attempt <= 5; attempt++) {
    let res: Response
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; ashby-search-cli/1.0)",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (attempt === 5) writeError(`Network error: ${msg}`, "NETWORK_ERROR")
      await sleep(delay + Math.random() * 500)
      delay = Math.min(delay * 2, 5000)
      continue
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt === 5) writeError(`Request failed: ${res.status} ${res.statusText}`, "HTTP_ERROR")
      await sleep(delay + Math.random() * 500)
      delay = Math.min(delay * 2, 5000)
      continue
    }
    if (res.status === 404) writeError("Company not found on Ashby. Check the slug.", "NOT_FOUND")
    if (res.status === 403) {
      const text = await res.text()
      if (text.includes("Host not allowed")) {
        writeError(
          "Ashby API blocked this request (403 Host not allowed). " +
          "This happens when requests come from datacenter/server IPs. " +
          "Use WebSearch with 'site:jobs.ashbyhq.com/<company>' queries instead.",
          "HOST_BLOCKED"
        )
      }
      writeError(`Request failed: ${res.status} ${res.statusText}`, "HTTP_ERROR")
    }
    if (!res.ok) writeError(`Request failed: ${res.status} ${res.statusText}`, "HTTP_ERROR")
    const json = await res.json() as { success: boolean; error?: string }
    if (!json.success) writeError(json.error ?? "Ashby API returned success=false", "API_ERROR")
    return json as T
  }
  writeError("Request failed after max retries", "MAX_RETRIES")
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function toOutputJob(p: AshbyPosting, company: string): OutputJob {
  return {
    id: p.id,
    title: p.title,
    department: p.departmentName ?? p.teamName ?? "",
    location: p.locationName ?? "",
    type: p.employmentType ?? "",
    posted: p.publishedDate?.slice(0, 10) ?? "",
    url: p.externalLink ?? `https://jobs.ashbyhq.com/${company}/${p.id}`,
  }
}

// ── Formatters ─────────────────────────────────────────────────────────────

function printTable(jobs: OutputJob[]): void {
  if (jobs.length === 0) {
    console.log("No results found.")
    return
  }
  const cols = ["#", "Title", "Department", "Location", "Type", "Posted"]
  const rows = jobs.map((j, i) => [
    String(i + 1),
    j.title.length > 48 ? j.title.slice(0, 45) + "..." : j.title,
    j.department.length > 24 ? j.department.slice(0, 21) + "..." : j.department,
    j.location.length > 24 ? j.location.slice(0, 21) + "..." : j.location,
    j.type,
    j.posted,
  ])
  const widths = cols.map((c, i) =>
    Math.max(c.length, ...rows.map((r) => r[i].length))
  )
  const sep = widths.map((w) => "-".repeat(w)).join("-+-")
  const header = cols.map((c, i) => c.padEnd(widths[i])).join(" | ")
  console.log(header)
  console.log(sep)
  for (const row of rows) {
    console.log(row.map((c, i) => c.padEnd(widths[i])).join(" | "))
  }
  console.log(`\n${jobs.length} result(s)`)
}

function printPlainDetail(p: AshbyPosting, company: string): void {
  console.log(`Title:      ${p.title}`)
  console.log(`URL:        ${p.externalLink ?? `https://jobs.ashbyhq.com/${company}/${p.id}`}`)
  console.log(`Department: ${p.departmentName ?? p.teamName ?? "—"}`)
  console.log(`Location:   ${p.locationName ?? "—"}`)
  console.log(`Type:       ${p.employmentType ?? "—"}`)
  console.log(`Published:  ${p.publishedDate?.slice(0, 10) ?? "—"}`)
  if (p.compensationTierSummary) {
    console.log(`Comp:       ${p.compensationTierSummary}`)
  }
  if (p.secondaryLocations && p.secondaryLocations.length > 0) {
    console.log(`Also in:    ${p.secondaryLocations.map((l) => l.locationName).join(", ")}`)
  }
  if (p.descriptionHtml) {
    console.log(`\n--- Description ---\n`)
    console.log(stripHtml(p.descriptionHtml))
  } else if (p.descriptionSocial) {
    console.log(`\n--- Description ---\n`)
    console.log(p.descriptionSocial)
  }
}

// ── Arg parser ─────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { flags: Record<string, string | true>; positionals: string[] } {
  const flags: Record<string, string | true> = {}
  const positionals: string[] = []
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (!next || next.startsWith("-")) {
        flags[key] = true
        i++
      } else {
        flags[key] = next
        i += 2
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      const key = arg.slice(1)
      const next = argv[i + 1]
      if (!next || next.startsWith("-")) {
        flags[key] = true
        i++
      } else {
        flags[key] = next
        i += 2
      }
    } else {
      positionals.push(arg)
      i++
    }
  }
  return { flags, positionals }
}

// ── Commands ───────────────────────────────────────────────────────────────

async function cmdSearch(flags: Record<string, string | true>): Promise<void> {
  const company = flags["company"] as string
  if (!company) writeError("--company is required", "MISSING_COMPANY")

  const format = (flags["format"] as string) ?? "json"
  const limit = flags["limit"] ? parseInt(flags["limit"] as string, 10) : Infinity
  const queryFilter = (flags["query"] as string | undefined)?.toLowerCase()
  const deptFilter = (flags["department"] as string | undefined)?.toLowerCase()
  const locFilter = (flags["location"] as string | undefined)?.toLowerCase()

  const resp = await postWithRetry<AshbyBoardResponse>(BOARD_API, {
    organizationHostedJobsPageName: company,
  })

  let postings = resp.data.jobPostings.filter((p) => p.isListed)
  const orgName = resp.data.organization.name

  // Client-side filters
  if (queryFilter) {
    postings = postings.filter((p) => p.title.toLowerCase().includes(queryFilter))
  }
  if (deptFilter) {
    postings = postings.filter(
      (p) =>
        p.departmentName?.toLowerCase().includes(deptFilter) ||
        p.teamName?.toLowerCase().includes(deptFilter)
    )
  }
  if (locFilter) {
    postings = postings.filter((p) => p.locationName?.toLowerCase().includes(locFilter))
  }

  const total = postings.length
  if (isFinite(limit)) postings = postings.slice(0, limit)

  const output = postings.map((p) => toOutputJob(p, company))

  if (format === "json") {
    console.log(JSON.stringify({ meta: { total, returned: postings.length, company, orgName }, results: output }, null, 2))
  } else if (format === "table") {
    console.log(`Company: ${orgName} (${company})  |  ${postings.length} result(s)\n`)
    printTable(output)
  } else if (format === "plain") {
    console.log(`Company: ${orgName} (${company})  |  ${postings.length} result(s)\n`)
    for (const j of output) {
      console.log(`[${j.posted}] ${j.title} — ${j.department} — ${j.location} — ${j.type}`)
      console.log(`  ${j.url}\n`)
    }
  } else {
    writeError(`Unknown format: ${format}`, "INVALID_FORMAT")
  }
}

async function cmdDetail(flags: Record<string, string | true>, positionals: string[]): Promise<void> {
  const company = flags["company"] as string
  if (!company) writeError("--company is required", "MISSING_COMPANY")
  const id = positionals[0]
  if (!id) writeError("job ID is required as positional argument", "MISSING_ID")

  const format = (flags["format"] as string) ?? "plain"

  const resp = await postWithRetry<AshbyPostingResponse>(POSTING_API, { jobPostingId: id })
  const posting = resp.data

  if (format === "json") {
    console.log(JSON.stringify(posting, null, 2))
  } else {
    printPlainDetail(posting, company)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const { flags, positionals } = parseArgs(argv.slice(1))
const command = argv[0]

if (!command || command === "--help" || command === "-h") {
  console.log(`Usage:
  bun run cli.ts search --company <slug> [--department <text>] [--location <text>]
                        [--query <text>] [--limit <n>] [--format json|table|plain]
  bun run cli.ts detail --company <slug> <id> [--format json|plain]

Examples:
  bun run cli.ts search --company anthropic --format table
  bun run cli.ts search --company linear --department Engineering --location Remote
  bun run cli.ts detail --company anthropic abc12345-0000-0000-0000-000000000000
`)
  process.exit(0)
}

if (command === "search") {
  await cmdSearch(flags)
} else if (command === "detail") {
  await cmdDetail(flags, positionals)
} else {
  writeError(`Unknown command: ${command}. Use 'search' or 'detail'.`, "UNKNOWN_COMMAND")
}

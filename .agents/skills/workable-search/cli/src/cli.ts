#!/usr/bin/env bun
/**
 * workable-search CLI
 * Search job listings from companies using Workable ATS (workable.com)
 *
 * Usage:
 *   bun run cli.ts search --company <slug> [--query <text>] [--department <text>]
 *                         [--location <text>] [--remote] [--limit <n>]
 *                         [--format json|table|plain]
 *   bun run cli.ts detail --company <slug> <shortcode>
 */

const WIDGET_API = "https://apply.workable.com/api/v1/widget/accounts"

// ── Types ──────────────────────────────────────────────────────────────────

interface WorkableJob {
  id: string
  title: string
  code: string // shortcode, e.g. "ABC123"
  url: string
  state: string
  created_at: string // ISO date
  employment_type: string | null
  departments: string[]
  offices: Array<{ name: string; location: { country: string; city: string | null; region: string | null } }>
  remote: boolean
  education: string | null
  experience: string | null
}

interface WorkableResponse {
  results: WorkableJob[]
  total: number
}

interface WorkableDetailSection {
  title: string
  body: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function writeError(error: string, code: string): never {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
  process.exit(1)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchWithRetry<T>(url: string, options?: RequestInit): Promise<T> {
  let delay = 500
  for (let attempt = 0; attempt <= 5; attempt++) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; workable-search-cli/1.0)",
        "Accept": "application/json",
        ...(options?.headers ?? {}),
      },
    })
    if (res.status === 429 || res.status >= 500) {
      if (attempt === 5) writeError(`Request failed: ${res.status} ${res.statusText}`, "HTTP_ERROR")
      await sleep(delay + Math.random() * 500)
      delay = Math.min(delay * 2, 5000)
      continue
    }
    if (res.status === 404) writeError("Company not found on Workable. Check the slug.", "NOT_FOUND")
    if (!res.ok) writeError(`Request failed: ${res.status} ${res.statusText}`, "HTTP_ERROR")
    return res.json() as Promise<T>
  }
  writeError("Request failed after max retries", "MAX_RETRIES")
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/h[1-6]>/gi, "\n")
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

function formatOffices(offices: WorkableJob["offices"]): string {
  if (!offices || offices.length === 0) return ""
  return offices.map((o) => {
    const parts: string[] = []
    if (o.location?.city) parts.push(o.location.city)
    if (o.location?.region && o.location.region !== o.location.city) parts.push(o.location.region)
    if (o.location?.country) parts.push(o.location.country)
    return parts.length > 0 ? parts.join(", ") : o.name
  }).join(" / ")
}

interface OutputJob {
  id: string
  shortcode: string
  title: string
  department: string
  location: string
  type: string
  remote: boolean
  created: string
  url: string
}

function toOutputJob(j: WorkableJob): OutputJob {
  return {
    id: j.id,
    shortcode: j.code,
    title: j.title,
    department: j.departments?.join(", ") ?? "",
    location: formatOffices(j.offices),
    type: j.employment_type ?? "",
    remote: j.remote ?? false,
    created: j.created_at?.slice(0, 10) ?? "",
    url: j.url,
  }
}

// ── Formatters ─────────────────────────────────────────────────────────────

function printTable(jobs: OutputJob[]): void {
  if (jobs.length === 0) {
    console.log("No results found.")
    return
  }
  const cols = ["#", "Title", "Department", "Location", "Type", "Remote", "Created"]
  const rows = jobs.map((j, i) => [
    String(i + 1),
    j.title.length > 46 ? j.title.slice(0, 43) + "..." : j.title,
    j.department.length > 22 ? j.department.slice(0, 19) + "..." : j.department,
    j.location.length > 26 ? j.location.slice(0, 23) + "..." : j.location,
    j.type,
    j.remote ? "Yes" : "No",
    j.created,
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
  const remoteOnly = Boolean(flags["remote"])

  const url = `${WIDGET_API}/${encodeURIComponent(company)}/jobs`
  const resp = await fetchWithRetry<WorkableResponse>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "", location: [], department: [], worktype: [], remote: [] }),
  })

  let jobs = resp.results.filter((j) => j.state === "published")

  // Client-side filters
  if (queryFilter) {
    jobs = jobs.filter((j) => j.title.toLowerCase().includes(queryFilter))
  }
  if (deptFilter) {
    jobs = jobs.filter((j) =>
      j.departments?.some((d) => d.toLowerCase().includes(deptFilter))
    )
  }
  if (locFilter) {
    jobs = jobs.filter((j) => formatOffices(j.offices).toLowerCase().includes(locFilter))
  }
  if (remoteOnly) {
    jobs = jobs.filter((j) => j.remote)
  }

  const total = jobs.length
  if (isFinite(limit)) jobs = jobs.slice(0, limit)

  const output = jobs.map(toOutputJob)

  if (format === "json") {
    console.log(JSON.stringify({
      meta: { total, returned: jobs.length, company },
      results: output,
    }, null, 2))
  } else if (format === "table") {
    console.log(`Company: ${company}  |  ${jobs.length} result(s) (${resp.total ?? total} total open)\n`)
    printTable(output)
  } else if (format === "plain") {
    console.log(`Company: ${company}  |  ${jobs.length} result(s)\n`)
    for (const j of output) {
      console.log(`[${j.created}] ${j.title} — ${j.department} — ${j.location} — ${j.type}${j.remote ? " (Remote)" : ""}`)
      console.log(`  ${j.url}\n`)
    }
  } else {
    writeError(`Unknown format: ${format}`, "INVALID_FORMAT")
  }
}

async function cmdDetail(flags: Record<string, string | true>, positionals: string[]): Promise<void> {
  const company = flags["company"] as string
  if (!company) writeError("--company is required", "MISSING_COMPANY")
  const shortcode = positionals[0]
  if (!shortcode) writeError("job shortcode is required as positional argument", "MISSING_ID")

  const format = (flags["format"] as string) ?? "plain"

  // Fetch JSON from widget API
  const url = `${WIDGET_API}/${encodeURIComponent(company)}/jobs/${encodeURIComponent(shortcode)}`
  const job = await fetchWithRetry<WorkableJob & { sections?: WorkableDetailSection[]; description?: string }>(url)

  if (format === "json") {
    console.log(JSON.stringify(job, null, 2))
    return
  }

  // plain
  console.log(`Title:      ${job.title}`)
  console.log(`URL:        ${job.url}`)
  console.log(`Department: ${job.departments?.join(", ") ?? "—"}`)
  console.log(`Location:   ${formatOffices(job.offices)}`)
  console.log(`Remote:     ${job.remote ? "Yes" : "No"}`)
  console.log(`Type:       ${job.employment_type ?? "—"}`)
  console.log(`Experience: ${job.experience ?? "—"}`)
  console.log(`Education:  ${job.education ?? "—"}`)
  console.log(`Created:    ${job.created_at?.slice(0, 10) ?? "—"}`)

  if (job.sections && job.sections.length > 0) {
    for (const section of job.sections) {
      console.log(`\n--- ${section.title} ---\n`)
      console.log(stripHtml(section.body))
    }
  } else if (job.description) {
    console.log(`\n--- Description ---\n`)
    console.log(stripHtml(job.description))
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const { flags, positionals } = parseArgs(argv.slice(1))
const command = argv[0]

if (!command || command === "--help" || command === "-h") {
  console.log(`Usage:
  bun run cli.ts search --company <slug> [--query <text>] [--department <text>]
                        [--location <text>] [--remote] [--limit <n>]
                        [--format json|table|plain]
  bun run cli.ts detail --company <slug> <shortcode> [--format json|plain]

Examples:
  bun run cli.ts search --company hubspot --format table
  bun run cli.ts search --company gitlab --department Engineering --remote
  bun run cli.ts detail --company hubspot ABC123
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

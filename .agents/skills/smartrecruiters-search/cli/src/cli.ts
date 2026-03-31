#!/usr/bin/env bun
/**
 * smartrecruiters-search CLI
 * Search job listings from companies using SmartRecruiters ATS
 *
 * Usage:
 *   bun run cli.ts search --company <id> [--query <text>] [--location <text>]
 *                         [--department <text>] [--limit <n>] [--offset <n>]
 *                         [--format json|table|plain]
 *   bun run cli.ts detail --company <id> <posting-id>
 */

const BASE_URL = "https://api.smartrecruiters.com/v1/companies"

// ── Types ──────────────────────────────────────────────────────────────────

interface SRPosting {
  id: string
  name: string // job title
  department: { label: string } | null
  typeOfEmployment: { label: string } | null
  location: {
    city: string | null
    region: string | null
    country: string | null
    remote: boolean
  } | null
  releasedDate: string | null
  updateDate: string | null
  ref: string // URL to job posting page
}

interface SRSearchResponse {
  content: SRPosting[]
  totalFound: number
  limit: number
  offset: number
}

interface SRDetailResponse {
  id: string
  name: string
  department: { label: string } | null
  typeOfEmployment: { label: string } | null
  location: {
    city: string | null
    region: string | null
    country: string | null
    remote: boolean
  } | null
  releasedDate: string | null
  updateDate: string | null
  ref: string
  company: { name: string; identifier: string }
  jobAd: {
    sections: {
      companyDescription?: { title: string; text: string }
      jobDescription?: { title: string; text: string }
      qualifications?: { title: string; text: string }
      additionalInformation?: { title: string; text: string }
    }
  }
}

interface OutputJob {
  id: string
  title: string
  department: string
  location: string
  type: string
  remote: boolean
  released: string
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

async function fetchWithRetry<T>(url: string): Promise<T> {
  let delay = 500
  for (let attempt = 0; attempt <= 5; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; smartrecruiters-search-cli/1.0)",
        "Accept": "application/json",
      },
    })
    if (res.status === 429 || res.status >= 500) {
      if (attempt === 5) writeError(`Request failed: ${res.status} ${res.statusText}`, "HTTP_ERROR")
      await sleep(delay + Math.random() * 500)
      delay = Math.min(delay * 2, 5000)
      continue
    }
    if (res.status === 404) writeError("Company or posting not found on SmartRecruiters. Check the company ID.", "NOT_FOUND")
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

function formatLocation(loc: SRPosting["location"]): string {
  if (!loc) return ""
  const parts: string[] = []
  if (loc.remote) parts.push("Remote")
  if (loc.city) parts.push(loc.city)
  if (loc.region && loc.region !== loc.city) parts.push(loc.region)
  if (loc.country) parts.push(loc.country)
  return parts.join(", ")
}

function toOutputJob(p: SRPosting): OutputJob {
  return {
    id: p.id,
    title: p.name,
    department: p.department?.label ?? "",
    location: formatLocation(p.location),
    type: p.typeOfEmployment?.label ?? "",
    remote: p.location?.remote ?? false,
    released: p.releasedDate?.slice(0, 10) ?? "",
    url: p.ref,
  }
}

// ── Formatters ─────────────────────────────────────────────────────────────

function printTable(jobs: OutputJob[]): void {
  if (jobs.length === 0) {
    console.log("No results found.")
    return
  }
  const cols = ["#", "Title", "Department", "Location", "Type", "Released"]
  const rows = jobs.map((j, i) => [
    String(i + 1),
    j.title.length > 48 ? j.title.slice(0, 45) + "..." : j.title,
    j.department.length > 22 ? j.department.slice(0, 19) + "..." : j.department,
    j.location.length > 26 ? j.location.slice(0, 23) + "..." : j.location,
    j.type,
    j.released,
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

function printPlainDetail(p: SRDetailResponse): void {
  console.log(`Title:      ${p.name}`)
  console.log(`URL:        ${p.ref}`)
  console.log(`Company:    ${p.company?.name ?? "—"}`)
  console.log(`Department: ${p.department?.label ?? "—"}`)
  console.log(`Location:   ${formatLocation(p.location)}`)
  console.log(`Remote:     ${p.location?.remote ? "Yes" : "No"}`)
  console.log(`Type:       ${p.typeOfEmployment?.label ?? "—"}`)
  console.log(`Released:   ${p.releasedDate?.slice(0, 10) ?? "—"}`)
  const sections = p.jobAd?.sections
  if (sections) {
    if (sections.companyDescription?.text) {
      console.log(`\n--- ${sections.companyDescription.title ?? "Company Description"} ---\n`)
      console.log(stripHtml(sections.companyDescription.text))
    }
    if (sections.jobDescription?.text) {
      console.log(`\n--- ${sections.jobDescription.title ?? "Job Description"} ---\n`)
      console.log(stripHtml(sections.jobDescription.text))
    }
    if (sections.qualifications?.text) {
      console.log(`\n--- ${sections.qualifications.title ?? "Qualifications"} ---\n`)
      console.log(stripHtml(sections.qualifications.text))
    }
    if (sections.additionalInformation?.text) {
      console.log(`\n--- ${sections.additionalInformation.title ?? "Additional Information"} ---\n`)
      console.log(stripHtml(sections.additionalInformation.text))
    }
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
  const limit = flags["limit"] ? parseInt(flags["limit"] as string, 10) : 20
  const offset = flags["offset"] ? parseInt(flags["offset"] as string, 10) : 0
  const deptFilter = (flags["department"] as string | undefined)?.toLowerCase()

  const params = new URLSearchParams({
    limit: String(Math.min(limit, 100)),
    offset: String(offset),
  })
  if (flags["query"]) params.set("q", flags["query"] as string)
  if (flags["location"]) params.set("location", flags["location"] as string)

  const url = `${BASE_URL}/${encodeURIComponent(company)}/postings?${params.toString()}`
  const resp = await fetchWithRetry<SRSearchResponse>(url)

  let results = resp.content
  if (deptFilter) {
    results = results.filter((p) => p.department?.label.toLowerCase().includes(deptFilter))
  }

  const output = results.map(toOutputJob)

  if (format === "json") {
    console.log(JSON.stringify({
      meta: { totalFound: resp.totalFound, returned: results.length, limit: resp.limit, offset: resp.offset, company },
      results: output,
    }, null, 2))
  } else if (format === "table") {
    console.log(`Company: ${company}  |  ${results.length} result(s) (${resp.totalFound} total found)\n`)
    printTable(output)
  } else if (format === "plain") {
    console.log(`Company: ${company}  |  ${results.length} result(s) (${resp.totalFound} total)\n`)
    for (const j of output) {
      console.log(`[${j.released}] ${j.title} — ${j.department} — ${j.location} — ${j.type}`)
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
  if (!id) writeError("posting ID is required as positional argument", "MISSING_ID")

  const format = (flags["format"] as string) ?? "plain"
  const url = `${BASE_URL}/${encodeURIComponent(company)}/postings/${encodeURIComponent(id)}`
  const posting = await fetchWithRetry<SRDetailResponse>(url)

  if (format === "json") {
    console.log(JSON.stringify(posting, null, 2))
  } else {
    printPlainDetail(posting)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const { flags, positionals } = parseArgs(argv.slice(1))
const command = argv[0]

if (!command || command === "--help" || command === "-h") {
  console.log(`Usage:
  bun run cli.ts search --company <id> [--query <text>] [--location <text>]
                        [--department <text>] [--limit <n>] [--offset <n>]
                        [--format json|table|plain]
  bun run cli.ts detail --company <id> <posting-id> [--format json|plain]

Examples:
  bun run cli.ts search --company Thoughtworks --format table
  bun run cli.ts search --company Criteo --query "data engineer" --location "New York"
  bun run cli.ts detail --company Thoughtworks abc123def456
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

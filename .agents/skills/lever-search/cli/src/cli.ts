#!/usr/bin/env bun
/**
 * lever-search CLI
 * Search job listings from companies using Lever ATS (api.lever.co)
 *
 * Usage:
 *   bun run cli.ts search --company <slug> [--team <text>] [--location <text>]
 *                         [--commitment <text>] [--query <text>] [--limit <n>]
 *                         [--format json|table|plain]
 *   bun run cli.ts detail --company <slug> <id>
 */

const BASE_URL = "https://api.lever.co/v0/postings"

// ── Types ──────────────────────────────────────────────────────────────────

interface LeverPosting {
  id: string
  text: string // job title
  categories: {
    commitment: string
    department: string
    location: string
    team: string
    allLocations?: string[]
  }
  description: string // HTML
  descriptionPlain: string
  lists: Array<{ text: string; content: string }>
  additional: string // HTML - "additional information"
  additionalPlain: string
  hostedUrl: string
  applyUrl: string
  createdAt: number // ms since epoch
  updatedAt: number
}

interface OutputJob {
  id: string
  title: string
  team: string
  location: string
  commitment: string
  department: string
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

async function fetchWithRetry<T>(url: string): Promise<T> {
  let delay = 500
  for (let attempt = 0; attempt <= 5; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; lever-search-cli/1.0)",
        "Accept": "application/json",
      },
    })
    if (res.status === 429 || res.status >= 500) {
      if (attempt === 5) writeError(`Request failed: ${res.status} ${res.statusText}`, "HTTP_ERROR")
      await sleep(delay + Math.random() * 500)
      delay = Math.min(delay * 2, 5000)
      continue
    }
    if (res.status === 404) writeError("Company not found on Lever. Check the slug.", "NOT_FOUND")
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

function formatDate(ms: number): string {
  if (!ms) return ""
  return new Date(ms).toISOString().slice(0, 10)
}

function toOutputJob(p: LeverPosting): OutputJob {
  return {
    id: p.id,
    title: p.text,
    team: p.categories?.team ?? "",
    location: p.categories?.location ?? "",
    commitment: p.categories?.commitment ?? "",
    department: p.categories?.department ?? "",
    posted: formatDate(p.createdAt),
    url: p.hostedUrl,
  }
}

// ── Formatters ─────────────────────────────────────────────────────────────

function printTable(jobs: OutputJob[]): void {
  if (jobs.length === 0) {
    console.log("No results found.")
    return
  }
  const cols = ["#", "Title", "Team", "Location", "Type", "Posted"]
  const rows = jobs.map((j, i) => [
    String(i + 1),
    j.title.length > 48 ? j.title.slice(0, 45) + "..." : j.title,
    j.team.length > 24 ? j.team.slice(0, 21) + "..." : j.team,
    j.location.length > 24 ? j.location.slice(0, 21) + "..." : j.location,
    j.commitment,
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

function printPlainDetail(p: LeverPosting): void {
  console.log(`Title:       ${p.text}`)
  console.log(`Company URL: ${p.hostedUrl}`)
  console.log(`Apply URL:   ${p.applyUrl}`)
  console.log(`Team:        ${p.categories?.team ?? "—"}`)
  console.log(`Department:  ${p.categories?.department ?? "—"}`)
  console.log(`Location:    ${p.categories?.location ?? "—"}`)
  console.log(`Commitment:  ${p.categories?.commitment ?? "—"}`)
  console.log(`Posted:      ${formatDate(p.createdAt)}`)
  console.log(`Updated:     ${formatDate(p.updatedAt)}`)
  console.log(`\n--- Description ---\n`)
  const desc = p.descriptionPlain || stripHtml(p.description)
  console.log(desc)
  if (p.lists && p.lists.length > 0) {
    for (const list of p.lists) {
      console.log(`\n--- ${list.text} ---\n`)
      console.log(stripHtml(list.content))
    }
  }
  const additional = p.additionalPlain || stripHtml(p.additional || "")
  if (additional.trim()) {
    console.log(`\n--- Additional Information ---\n`)
    console.log(additional)
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

  // Build Lever API URL with server-side filters
  const params = new URLSearchParams({ mode: "json" })
  if (flags["team"]) params.set("team", flags["team"] as string)
  if (flags["location"]) params.set("location", flags["location"] as string)
  if (flags["commitment"]) params.set("commitment", flags["commitment"] as string)

  const url = `${BASE_URL}/${encodeURIComponent(company)}?${params.toString()}`
  const postings = await fetchWithRetry<LeverPosting[]>(url)

  // Client-side keyword filter
  let results = postings
  if (queryFilter) {
    results = results.filter((p) => p.text.toLowerCase().includes(queryFilter))
  }

  // Apply limit
  if (isFinite(limit)) results = results.slice(0, limit)

  const output = results.map(toOutputJob)

  if (format === "json") {
    console.log(JSON.stringify({ meta: { total: postings.length, returned: results.length, company }, results: output }, null, 2))
  } else if (format === "table") {
    console.log(`Company: ${company}  |  ${results.length} result(s) (${postings.length} total open)\n`)
    printTable(output)
  } else if (format === "plain") {
    console.log(`Company: ${company}  |  ${results.length} result(s)\n`)
    for (const j of output) {
      console.log(`[${j.posted}] ${j.title} — ${j.team} — ${j.location} — ${j.commitment}`)
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
  const url = `${BASE_URL}/${encodeURIComponent(company)}/${encodeURIComponent(id)}?mode=json`
  const posting = await fetchWithRetry<LeverPosting>(url)

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
  bun run cli.ts search --company <slug> [--team <text>] [--location <text>]
                        [--commitment <text>] [--query <text>] [--limit <n>]
                        [--format json|table|plain]
  bun run cli.ts detail --company <slug> <id> [--format json|plain]

Examples:
  bun run cli.ts search --company stripe --format table
  bun run cli.ts search --company cloudflare --team Engineering --location Remote
  bun run cli.ts detail --company stripe abc12345-0000-0000-0000-000000000000
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

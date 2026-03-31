/**
 * Tests for workable-search CLI
 *
 * Tests are grouped into:
 *   - Arg validation (no network required)
 *   - Error cases (network: invalid slugs)
 *   - Normal cases (network: real Workable API, uses "workable" — Workable's own board — as stable test company)
 *   - Edge cases (network: filtering, remote flag, output formats)
 *   - Detail command (network)
 *
 * Set SKIP_NETWORK_TESTS=1 to run only the offline tests.
 */

import { describe, it, expect, beforeAll } from "bun:test"
import { runCLI, parseJSON, parseError } from "./helpers"

const SKIP_NETWORK = Boolean(process.env.SKIP_NETWORK_TESTS)
// "workable" is Workable's own jobs page — reliable and always has openings
const TEST_COMPANY = "workable"

// ── Arg validation (offline) ───────────────────────────────────────────────

describe("arg validation (offline)", () => {
  it("prints usage and exits 0 with no args", async () => {
    const result = await runCLI([])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Usage:")
  })

  it("prints usage and exits 0 with --help", async () => {
    const result = await runCLI(["--help"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Usage:")
  })

  it("exits 1 with UNKNOWN_COMMAND for an unknown command", async () => {
    const result = await runCLI(["foobar"])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("UNKNOWN_COMMAND")
  })

  it("exits 1 with MISSING_COMPANY when search called without --company", async () => {
    const result = await runCLI(["search"])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("MISSING_COMPANY")
  })

  it("exits 1 with MISSING_COMPANY when detail called without --company", async () => {
    const result = await runCLI(["detail", "SOME123"])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("MISSING_COMPANY")
  })

  it("exits 1 with MISSING_ID when detail called without a shortcode", async () => {
    const result = await runCLI(["detail", "--company", TEST_COMPANY])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("MISSING_ID")
  })
})

// ── Error cases (network) ──────────────────────────────────────────────────

describe("error cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("exits 1 with NOT_FOUND for a nonexistent company slug", async () => {
    const result = await runCLI([
      "search", "--company", "this-company-does-not-exist-xyz-99999",
    ])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("NOT_FOUND")
  })

  it.skipIf(SKIP_NETWORK)("exits 1 for a valid company but invalid shortcode", async () => {
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, "XYZZY_INVALID_SHORTCODE_999",
    ])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toMatch(/NOT_FOUND|HTTP_ERROR/)
  })
})

// ── Search: normal cases (network) ─────────────────────────────────────────

describe("search command — normal cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("returns valid JSON with expected top-level structure", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ meta: unknown; results: unknown[] }>(result)
    expect(json).toHaveProperty("meta")
    expect(json).toHaveProperty("results")
    expect(Array.isArray(json.results)).toBe(true)
  })

  it.skipIf(SKIP_NETWORK)("each result has required fields with correct types", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    const json = parseJSON<{ results: Array<Record<string, unknown>> }>(result)
    if (json.results.length === 0) return
    for (const job of json.results) {
      expect(typeof job.id).toBe("string")
      expect(job.id.length).toBeGreaterThan(0)
      expect(typeof job.shortcode).toBe("string")
      expect((job.shortcode as string).length).toBeGreaterThan(0)
      expect(typeof job.title).toBe("string")
      expect(job.title.length).toBeGreaterThan(0)
      expect(typeof job.url).toBe("string")
      expect(job.url).toMatch(/^https?:\/\//)
      expect("department" in job).toBe(true)
      expect("location" in job).toBe(true)
      expect("type" in job).toBe(true)
      expect("remote" in job).toBe(true)
      expect("created" in job).toBe(true)
    }
  })

  it.skipIf(SKIP_NETWORK)("meta.company matches the requested slug", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    const json = parseJSON<{ meta: { company: string } }>(result)
    expect(json.meta.company).toBe(TEST_COMPANY)
  })

  it.skipIf(SKIP_NETWORK)("meta.returned matches results array length", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    const json = parseJSON<{ meta: { returned: number }; results: unknown[] }>(result)
    expect(json.meta.returned).toBe(json.results.length)
  })

  it.skipIf(SKIP_NETWORK)("result URLs point to apply.workable.com or company subdomain", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "json"])
    const json = parseJSON<{ results: Array<{ url: string }> }>(result)
    for (const job of json.results) {
      expect(job.url).toMatch(/workable\.com|apply\.workable\.com/)
    }
  })
})

// ── Search: edge cases (network) ───────────────────────────────────────────

describe("search command — edge cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("--limit caps the returned results", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "2", "--format", "json"])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ results: unknown[] }>(result)
    expect(json.results.length).toBeLessThanOrEqual(2)
  })

  it.skipIf(SKIP_NETWORK)("--query filters results by title substring", async () => {
    // Get some results first to find a reliable search term
    const listResult = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "5", "--format", "json"])
    const list = parseJSON<{ results: Array<{ title: string }> }>(listResult)
    if (list.results.length === 0) return

    const firstWord = list.results[0].title.split(" ")[0].toLowerCase()
    const filtered = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--query", firstWord,
      "--format", "json",
    ])
    expect(filtered.exitCode).toBe(0)
    const filteredJson = parseJSON<{ results: Array<{ title: string }> }>(filtered)
    for (const job of filteredJson.results) {
      expect(job.title.toLowerCase()).toContain(firstWord)
    }
  })

  it.skipIf(SKIP_NETWORK)("--query with no match returns empty results array", async () => {
    const result = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--query", "xyzzy_no_such_title_abc123_notajobtitle",
      "--format", "json",
    ])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ results: unknown[] }>(result)
    expect(json.results.length).toBe(0)
  })

  it.skipIf(SKIP_NETWORK)("--remote filters to only remote-friendly positions", async () => {
    const result = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--remote",
      "--format", "json",
    ])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ results: Array<{ remote: boolean }> }>(result)
    for (const job of json.results) {
      expect(job.remote).toBe(true)
    }
  })

  it.skipIf(SKIP_NETWORK)("--department applies client-side partial-match filter", async () => {
    const allResult = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    const all = parseJSON<{ results: Array<{ department: string }> }>(allResult)
    const withDept = all.results.find((j) => j.department.length >= 3)
    if (!withDept) return

    const deptPrefix = withDept.department.slice(0, 3).toLowerCase()
    const filtered = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--department", deptPrefix,
      "--format", "json",
    ])
    expect(filtered.exitCode).toBe(0)
    const filteredJson = parseJSON<{ results: Array<{ department: string }> }>(filtered)
    for (const job of filteredJson.results) {
      expect(job.department.toLowerCase()).toContain(deptPrefix)
    }
  })

  it.skipIf(SKIP_NETWORK)("--format table outputs column headers including Remote", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "table"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/Title/i)
    expect(result.stdout).toMatch(/Remote/i)
  })

  it.skipIf(SKIP_NETWORK)("--format plain outputs Company and URLs", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "plain"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Company:")
    expect(result.stdout).toMatch(/https?:\/\//)
  })
})

// ── Detail command (network) ───────────────────────────────────────────────

describe("detail command (network)", () => {
  let firstShortcode: string | null = null

  beforeAll(async () => {
    if (SKIP_NETWORK) return
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "1", "--format", "json"])
    if (result.exitCode === 0) {
      const json = parseJSON<{ results: Array<{ shortcode: string }> }>(result)
      firstShortcode = json.results[0]?.shortcode ?? null
    }
  })

  it.skipIf(SKIP_NETWORK)("returns plain text detail with expected labeled fields", async () => {
    if (!firstShortcode) {
      console.warn("Skipping: no shortcode from search")
      return
    }
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, firstShortcode, "--format", "plain",
    ])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Title:")
    expect(result.stdout).toContain("URL:")
    expect(result.stdout).toContain("Department:")
    expect(result.stdout).toContain("Remote:")
    expect(result.stdout).toContain("Type:")
    expect(result.stdout).toContain("Created:")
  })

  it.skipIf(SKIP_NETWORK)("returns valid JSON detail with --format json", async () => {
    if (!firstShortcode) {
      console.warn("Skipping: no shortcode from search")
      return
    }
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, firstShortcode, "--format", "json",
    ])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ title: string; code: string; url: string }>(result)
    expect(typeof json.title).toBe("string")
    expect(json.title.length).toBeGreaterThan(0)
    expect(json.code).toBe(firstShortcode)
    expect(json.url).toMatch(/^https?:\/\//)
  })

  it.skipIf(SKIP_NETWORK)("detail defaults to --format plain when --format is omitted", async () => {
    if (!firstShortcode) {
      console.warn("Skipping: no shortcode from search")
      return
    }
    const result = await runCLI(["detail", "--company", TEST_COMPANY, firstShortcode])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Title:")
  })
})

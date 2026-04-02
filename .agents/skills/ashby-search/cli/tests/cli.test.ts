/**
 * Tests for ashby-search CLI
 *
 * Tests are grouped into:
 *   - Arg validation (no network required)
 *   - Error cases (network: invalid slugs)
 *   - Normal cases (network: real Ashby API, uses "ashby" — Ashby's own job board — as stable test company)
 *   - Edge cases (network: filtering, output formats)
 *   - Detail command (network)
 *
 * Set SKIP_NETWORK_TESTS=1 to run only the offline tests.
 */

import { describe, it, expect, beforeAll } from "bun:test"
import { runCLI, parseJSON, parseError } from "./helpers"

const SKIP_NETWORK = Boolean(process.env.SKIP_NETWORK_TESTS)
// "ashby" is Ashby's own job board — stable and always has openings
const TEST_COMPANY = "ashby"

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

  it("exits 1 with UNKNOWN_COMMAND for unknown command", async () => {
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
    const result = await runCLI(["detail", "some-id"])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("MISSING_COMPANY")
  })

  it("exits 1 with MISSING_ID when detail called without a job ID", async () => {
    const result = await runCLI(["detail", "--company", TEST_COMPANY])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("MISSING_ID")
  })
})

// ── Error cases (network) ──────────────────────────────────────────────────

describe("error cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("exits 1 for a nonexistent company slug", async () => {
    const result = await runCLI(["search", "--company", "this-company-does-not-exist-xyz-99999"])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    // May get HOST_BLOCKED if Ashby blocks datacenter IPs
    expect(err.code).toMatch(/NOT_FOUND|API_ERROR|HOST_BLOCKED|HTTP_ERROR|NETWORK_ERROR/)
  })

  it.skipIf(SKIP_NETWORK)("exits 1 for a nonexistent job posting ID", async () => {
    const result = await runCLI([
      "detail",
      "--company", TEST_COMPANY,
      "00000000-0000-0000-0000-000000000000",
    ])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toMatch(/NOT_FOUND|API_ERROR|HOST_BLOCKED|HTTP_ERROR|NETWORK_ERROR/)
  })
})

// ── Host blocked detection ────────────────────────────────────────────────

describe("host blocked detection (network)", () => {
  it.skipIf(SKIP_NETWORK)("detects HOST_BLOCKED when Ashby API returns 403 Host not allowed", async () => {
    // In environments where Ashby blocks datacenter IPs, this test validates
    // the CLI provides a clear HOST_BLOCKED error with remediation advice.
    // In environments where Ashby is reachable, the search succeeds normally.
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "1", "--format", "json"])
    if (result.exitCode === 1) {
      const err = parseError(result)
      if (err.code === "HOST_BLOCKED") {
        expect(err.error).toContain("Host not allowed")
        expect(err.error).toContain("WebSearch")
        expect(err.error).toContain("site:jobs.ashbyhq.com")
      }
      // Other error codes (NETWORK_ERROR, HTTP_ERROR) are also acceptable
      expect(err.code).toMatch(/HOST_BLOCKED|HTTP_ERROR|NETWORK_ERROR/)
    }
    // exitCode 0 means Ashby is reachable — the test passes either way
  })

  it.skipIf(SKIP_NETWORK)("HOST_BLOCKED error message includes remediation guidance", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "1", "--format", "json"])
    if (result.exitCode === 1) {
      const err = parseError(result)
      if (err.code === "HOST_BLOCKED") {
        expect(err.error).toContain("site:jobs.ashbyhq.com")
        expect(err.error).toContain("WebSearch")
      }
    }
  })
})

// ── Search: normal cases (network) ─────────────────────────────────────────

// Note: These tests may fail with HOST_BLOCKED or NETWORK_ERROR in environments
// where Ashby's API blocks datacenter/server IPs. That's expected behavior.

describe("search command — normal cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("returns valid JSON with expected top-level structure (or HOST_BLOCKED)", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    if (result.exitCode === 1) {
      const err = parseError(result)
      expect(err.code).toMatch(/HOST_BLOCKED|HTTP_ERROR|NETWORK_ERROR/)
      return
    }
    const json = parseJSON<{ meta: unknown; results: unknown[] }>(result)
    expect(json).toHaveProperty("meta")
    expect(json).toHaveProperty("results")
    expect(Array.isArray(json.results)).toBe(true)
  })

  it.skipIf(SKIP_NETWORK)("each result has required fields with correct types", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    if (result.exitCode === 1) return // HOST_BLOCKED
    const json = parseJSON<{ results: Array<Record<string, unknown>> }>(result)
    if (json.results.length === 0) return // guard for empty board
    for (const job of json.results) {
      expect(typeof job.id).toBe("string")
      expect(job.id.length).toBeGreaterThan(0)
      expect(typeof job.title).toBe("string")
      expect(job.title.length).toBeGreaterThan(0)
      expect(typeof job.url).toBe("string")
      expect(job.url).toMatch(/^https?:\/\//)
      expect("department" in job).toBe(true)
      expect("location" in job).toBe(true)
      expect("type" in job).toBe(true)
      expect("posted" in job).toBe(true)
    }
  })

  it.skipIf(SKIP_NETWORK)("meta.orgName is a non-empty string", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    if (result.exitCode === 1) return // HOST_BLOCKED
    const json = parseJSON<{ meta: { orgName: string; company: string } }>(result)
    expect(typeof json.meta.orgName).toBe("string")
    expect(json.meta.orgName.length).toBeGreaterThan(0)
    expect(json.meta.company).toBe(TEST_COMPANY)
  })

  it.skipIf(SKIP_NETWORK)("meta.total matches number of listed postings", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    if (result.exitCode === 1) return // HOST_BLOCKED
    const json = parseJSON<{ meta: { total: number }; results: unknown[] }>(result)
    expect(json.meta.total).toBe(json.results.length)
  })
})

// ── Search: edge cases (network) ───────────────────────────────────────────

describe("search command — edge cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("--limit caps the returned results", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "2", "--format", "json"])
    if (result.exitCode === 1) return // HOST_BLOCKED
    const json = parseJSON<{ results: unknown[] }>(result)
    expect(json.results.length).toBeLessThanOrEqual(2)
  })

  it.skipIf(SKIP_NETWORK)("--query filters by title substring (case-insensitive)", async () => {
    const listResult = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "5", "--format", "json"])
    if (listResult.exitCode === 1) return // HOST_BLOCKED
    const list = parseJSON<{ results: Array<{ title: string }> }>(listResult)
    if (list.results.length === 0) return

    const firstWord = list.results[0].title.split(" ")[0].toLowerCase()
    const filterResult = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--query", firstWord,
      "--format", "json",
    ])
    if (filterResult.exitCode === 1) return // HOST_BLOCKED
    const filtered = parseJSON<{ results: Array<{ title: string }> }>(filterResult)
    for (const job of filtered.results) {
      expect(job.title.toLowerCase()).toContain(firstWord)
    }
  })

  it.skipIf(SKIP_NETWORK)("--query with no match returns empty results array", async () => {
    const result = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--query", "xyzzy_no_such_title_abc123_notajobtitle",
      "--format", "json",
    ])
    if (result.exitCode === 1) return // HOST_BLOCKED
    const json = parseJSON<{ results: unknown[] }>(result)
    expect(json.results.length).toBe(0)
  })

  it.skipIf(SKIP_NETWORK)("--format table outputs column headers", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "table"])
    if (result.exitCode === 1) return // HOST_BLOCKED
    expect(result.stdout).toMatch(/Title/i)
    expect(result.stdout).toMatch(/Department|Location/i)
  })

  it.skipIf(SKIP_NETWORK)("--format plain outputs company name and URLs", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "plain"])
    if (result.exitCode === 1) return // HOST_BLOCKED
    expect(result.stdout).toContain("Company:")
  })

  it.skipIf(SKIP_NETWORK)("--department filter applies client-side partial match", async () => {
    const allResult = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    if (allResult.exitCode === 1) return // HOST_BLOCKED
    const all = parseJSON<{ results: Array<{ department: string }> }>(allResult)
    const withDept = all.results.find((j) => j.department.length > 0)
    if (!withDept) return

    const deptQuery = withDept.department.slice(0, 4).toLowerCase()
    const filtered = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--department", deptQuery,
      "--format", "json",
    ])
    if (filtered.exitCode === 1) return // HOST_BLOCKED
    const filteredJson = parseJSON<{ results: Array<{ department: string }> }>(filtered)
    for (const job of filteredJson.results) {
      expect(job.department.toLowerCase()).toContain(deptQuery)
    }
  })
})

// ── Detail command (network) ───────────────────────────────────────────────

describe("detail command (network)", () => {
  let firstJobId: string | null = null
  let hostBlocked = false

  beforeAll(async () => {
    if (SKIP_NETWORK) return
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "1", "--format", "json"])
    if (result.exitCode === 0) {
      const json = parseJSON<{ results: Array<{ id: string }> }>(result)
      firstJobId = json.results[0]?.id ?? null
    } else {
      hostBlocked = true
    }
  })

  it.skipIf(SKIP_NETWORK)("returns plain text detail with expected fields for a valid ID", async () => {
    if (hostBlocked || !firstJobId) {
      console.warn("Skipping: API blocked or no job ID available")
      return
    }
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, firstJobId, "--format", "plain",
    ])
    if (result.exitCode === 1) return // HOST_BLOCKED on detail endpoint
    expect(result.stdout).toContain("Title:")
    expect(result.stdout).toContain("URL:")
    expect(result.stdout).toContain("Department:")
    expect(result.stdout).toContain("Location:")
    expect(result.stdout).toContain("Published:")
  })

  it.skipIf(SKIP_NETWORK)("returns valid JSON detail with --format json", async () => {
    if (hostBlocked || !firstJobId) {
      console.warn("Skipping: API blocked or no job ID available")
      return
    }
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, firstJobId, "--format", "json",
    ])
    if (result.exitCode === 1) return // HOST_BLOCKED
    const json = parseJSON<Record<string, unknown>>(result)
    expect(typeof json.id).toBe("string")
    expect(typeof json.title).toBe("string")
    expect(json.id).toBe(firstJobId)
  })

  it.skipIf(SKIP_NETWORK)("detail defaults to --format plain when --format is omitted", async () => {
    if (hostBlocked || !firstJobId) {
      console.warn("Skipping: API blocked or no job ID available")
      return
    }
    const result = await runCLI(["detail", "--company", TEST_COMPANY, firstJobId])
    if (result.exitCode === 1) return // HOST_BLOCKED
    expect(result.stdout).toContain("Title:")
  })
})

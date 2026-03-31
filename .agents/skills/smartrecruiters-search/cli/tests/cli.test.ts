/**
 * Tests for smartrecruiters-search CLI
 *
 * Tests are grouped into:
 *   - Arg validation (no network required)
 *   - Error cases (network: invalid company IDs)
 *   - Normal cases (network: real SmartRecruiters API, uses "Thoughtworks" as stable test company)
 *   - Edge cases (network: filtering, pagination, output formats)
 *   - Detail command (network)
 *
 * Set SKIP_NETWORK_TESTS=1 to run only the offline tests.
 */

import { describe, it, expect, beforeAll } from "bun:test"
import { runCLI, parseJSON, parseError } from "./helpers"

const SKIP_NETWORK = Boolean(process.env.SKIP_NETWORK_TESTS)
// Thoughtworks is a large consultancy with a stable SmartRecruiters board and many roles
const TEST_COMPANY = "Thoughtworks"

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
    const result = await runCLI(["detail", "some-id"])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("MISSING_COMPANY")
  })

  it("exits 1 with MISSING_ID when detail called without a posting ID", async () => {
    const result = await runCLI(["detail", "--company", TEST_COMPANY])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("MISSING_ID")
  })
})

// ── Error cases (network) ──────────────────────────────────────────────────

describe("error cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("exits 1 with NOT_FOUND for a nonexistent company ID", async () => {
    const result = await runCLI([
      "search", "--company", "ThisCompanyDoesNotExistXYZ99999Fake",
    ])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("NOT_FOUND")
  })

  it.skipIf(SKIP_NETWORK)("exits 1 for a valid company but nonexistent posting ID", async () => {
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY,
      "000000000000000000000000",
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
      expect(typeof job.title).toBe("string")
      expect(job.title.length).toBeGreaterThan(0)
      expect(typeof job.url).toBe("string")
      expect(job.url).toMatch(/^https?:\/\//)
      expect("department" in job).toBe(true)
      expect("location" in job).toBe(true)
      expect("type" in job).toBe(true)
      expect("released" in job).toBe(true)
      expect("remote" in job).toBe(true)
    }
  })

  it.skipIf(SKIP_NETWORK)("meta.company matches requested company ID", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "5", "--format", "json"])
    const json = parseJSON<{ meta: { company: string; totalFound: number } }>(result)
    expect(json.meta.company).toBe(TEST_COMPANY)
    expect(typeof json.meta.totalFound).toBe("number")
  })

  it.skipIf(SKIP_NETWORK)("meta.returned matches results array length", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    const json = parseJSON<{ meta: { returned: number }; results: unknown[] }>(result)
    expect(json.meta.returned).toBe(json.results.length)
  })
})

// ── Search: edge cases (network) ───────────────────────────────────────────

describe("search command — edge cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("--limit caps results returned", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "json"])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ results: unknown[] }>(result)
    expect(json.results.length).toBeLessThanOrEqual(3)
  })

  it.skipIf(SKIP_NETWORK)("--offset skips results (pagination)", async () => {
    // Fetch page 1 (first 5) and page 2 (next 5) and verify no overlap
    const page1 = await runCLI([
      "search", "--company", TEST_COMPANY, "--limit", "5", "--offset", "0", "--format", "json",
    ])
    const page2 = await runCLI([
      "search", "--company", TEST_COMPANY, "--limit", "5", "--offset", "5", "--format", "json",
    ])
    expect(page1.exitCode).toBe(0)
    expect(page2.exitCode).toBe(0)
    const ids1 = new Set(parseJSON<{ results: Array<{ id: string }> }>(page1).results.map((j) => j.id))
    const ids2 = parseJSON<{ results: Array<{ id: string }> }>(page2).results.map((j) => j.id)
    for (const id of ids2) {
      expect(ids1.has(id)).toBe(false)
    }
  })

  it.skipIf(SKIP_NETWORK)("--query performs server-side keyword search", async () => {
    const result = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--query", "consultant",
      "--format", "json",
    ])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ results: unknown[] }>(result)
    // Just verify it runs without error; SmartRecruiters does server-side search
    expect(Array.isArray(json.results)).toBe(true)
  })

  it.skipIf(SKIP_NETWORK)("--query with no matching keyword returns empty results", async () => {
    const result = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--query", "xyzzy_no_such_title_abc123_notajobtitle",
      "--format", "json",
    ])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ results: unknown[] }>(result)
    expect(json.results.length).toBe(0)
  })

  it.skipIf(SKIP_NETWORK)("--format table outputs column headers", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "table"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/Title/i)
    expect(result.stdout).toMatch(/Department|Location/i)
  })

  it.skipIf(SKIP_NETWORK)("--format plain outputs company and URLs", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "plain"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Company:")
    // Each job line should end with a URL
    expect(result.stdout).toMatch(/https?:\/\//)
  })

  it.skipIf(SKIP_NETWORK)("--department applies client-side partial-match filter", async () => {
    // Get all results to find a real department name to filter on
    const allResult = await runCLI(["search", "--company", TEST_COMPANY, "--format", "json"])
    const all = parseJSON<{ results: Array<{ department: string }> }>(allResult)
    const withDept = all.results.find((j) => j.department.length >= 4)
    if (!withDept) return

    const deptPrefix = withDept.department.slice(0, 4).toLowerCase()
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
})

// ── Detail command (network) ───────────────────────────────────────────────

describe("detail command (network)", () => {
  let firstJobId: string | null = null

  beforeAll(async () => {
    if (SKIP_NETWORK) return
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "1", "--format", "json"])
    if (result.exitCode === 0) {
      const json = parseJSON<{ results: Array<{ id: string }> }>(result)
      firstJobId = json.results[0]?.id ?? null
    }
  })

  it.skipIf(SKIP_NETWORK)("returns plain text detail with expected labeled fields", async () => {
    if (!firstJobId) {
      console.warn("Skipping: no job ID from search")
      return
    }
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, firstJobId, "--format", "plain",
    ])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Title:")
    expect(result.stdout).toContain("URL:")
    expect(result.stdout).toContain("Company:")
    expect(result.stdout).toContain("Department:")
    expect(result.stdout).toContain("Location:")
    expect(result.stdout).toContain("Released:")
  })

  it.skipIf(SKIP_NETWORK)("returns valid JSON detail with --format json", async () => {
    if (!firstJobId) {
      console.warn("Skipping: no job ID from search")
      return
    }
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, firstJobId, "--format", "json",
    ])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ id: string; name: string }>(result)
    expect(json.id).toBe(firstJobId)
    expect(typeof json.name).toBe("string") // SmartRecruiters calls it "name"
    expect(json.name.length).toBeGreaterThan(0)
  })

  it.skipIf(SKIP_NETWORK)("detail includes job description sections when present", async () => {
    if (!firstJobId) {
      console.warn("Skipping: no job ID from search")
      return
    }
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, firstJobId, "--format", "plain",
    ])
    expect(result.exitCode).toBe(0)
    // At least one section header should appear (Job Description, Qualifications, etc.)
    expect(result.stdout).toMatch(/---\s+.*\s+---/)
  })
})

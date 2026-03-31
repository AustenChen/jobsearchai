/**
 * Tests for lever-search CLI
 *
 * Tests are grouped into:
 *   - Arg validation (no network required)
 *   - Normal cases (network: real Lever API, uses "stripe" as a stable test company)
 *   - Edge cases (network: filtering, empty results, output formats)
 *   - Detail command (network)
 *
 * Set SKIP_NETWORK_TESTS=1 to run only the offline tests.
 */

import { describe, it, expect, beforeAll } from "bun:test"
import { runCLI, parseJSON, parseError } from "./helpers"

const SKIP_NETWORK = Boolean(process.env.SKIP_NETWORK_TESTS)
// stripe is a large company with a stable Lever board and many open roles
const TEST_COMPANY = "stripe"

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

  it("exits 1 with INVALID_FORMAT for unknown --format value", async () => {
    // This will hit the network but the format check happens after fetch.
    // Skip if network tests are disabled.
    if (SKIP_NETWORK) return
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--format", "csv"])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("INVALID_FORMAT")
  })
})

// ── Error cases (network) ──────────────────────────────────────────────────

describe("error cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("exits 1 with NOT_FOUND for a nonexistent company slug", async () => {
    const result = await runCLI(["search", "--company", "this-company-does-not-exist-xyz-99999"])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("NOT_FOUND")
  })

  it.skipIf(SKIP_NETWORK)("exits 1 with NOT_FOUND when detail called with invalid company", async () => {
    const result = await runCLI([
      "detail",
      "--company", "this-company-does-not-exist-xyz-99999",
      "00000000-0000-0000-0000-000000000000",
    ])
    expect(result.exitCode).toBe(1)
    const err = parseError(result)
    expect(err.code).toBe("NOT_FOUND")
  })
})

// ── Search: normal cases (network) ─────────────────────────────────────────

describe("search command — normal cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("returns valid JSON with expected structure", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "json"])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ meta: unknown; results: unknown[] }>(result)
    expect(json).toHaveProperty("meta")
    expect(json).toHaveProperty("results")
    expect(Array.isArray(json.results)).toBe(true)
  })

  it.skipIf(SKIP_NETWORK)("each result has required fields", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "5", "--format", "json"])
    const json = parseJSON<{ results: Array<Record<string, unknown>> }>(result)
    for (const job of json.results) {
      expect(typeof job.id).toBe("string")
      expect(typeof job.title).toBe("string")
      expect(job.title.length).toBeGreaterThan(0)
      expect(typeof job.url).toBe("string")
      expect(job.url).toMatch(/^https?:\/\//)
      // team, location, commitment, department, posted may be empty strings but must exist
      expect("team" in job).toBe(true)
      expect("location" in job).toBe(true)
      expect("commitment" in job).toBe(true)
      expect("department" in job).toBe(true)
      expect("posted" in job).toBe(true)
    }
  })

  it.skipIf(SKIP_NETWORK)("meta.returned matches results array length", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "json"])
    const json = parseJSON<{ meta: { returned: number }; results: unknown[] }>(result)
    expect(json.meta.returned).toBe(json.results.length)
  })

  it.skipIf(SKIP_NETWORK)("meta.company matches the requested company slug", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "1", "--format", "json"])
    const json = parseJSON<{ meta: { company: string } }>(result)
    expect(json.meta.company).toBe(TEST_COMPANY)
  })
})

// ── Search: edge cases (network) ───────────────────────────────────────────

describe("search command — edge cases (network)", () => {
  it.skipIf(SKIP_NETWORK)("--limit caps results returned", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "2", "--format", "json"])
    const json = parseJSON<{ results: unknown[] }>(result)
    expect(json.results.length).toBeLessThanOrEqual(2)
  })

  it.skipIf(SKIP_NETWORK)("--query filters results client-side by title substring", async () => {
    const result = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--query", "engineer",
      "--format", "json",
    ])
    const json = parseJSON<{ results: Array<{ title: string }> }>(result)
    for (const job of json.results) {
      expect(job.title.toLowerCase()).toContain("engineer")
    }
  })

  it.skipIf(SKIP_NETWORK)("--query with no matching title returns empty results array", async () => {
    const result = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--query", "xyzzy_no_such_title_abc123",
      "--format", "json",
    ])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ results: unknown[] }>(result)
    expect(json.results.length).toBe(0)
  })

  it.skipIf(SKIP_NETWORK)("--format table outputs readable text with column headers", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "table"])
    expect(result.exitCode).toBe(0)
    // Should contain table column headers
    expect(result.stdout).toMatch(/Title/i)
    expect(result.stdout).toMatch(/Team|Location|Type/i)
  })

  it.skipIf(SKIP_NETWORK)("--format plain outputs human-readable lines", async () => {
    const result = await runCLI(["search", "--company", TEST_COMPANY, "--limit", "3", "--format", "plain"])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Company:")
    // Each job should include a https:// URL
    expect(result.stdout).toMatch(/https?:\/\//)
  })

  it.skipIf(SKIP_NETWORK)("--commitment filter passes through to Lever API", async () => {
    const result = await runCLI([
      "search", "--company", TEST_COMPANY,
      "--commitment", "Full-time",
      "--format", "json",
    ])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<{ results: unknown[] }>(result)
    // Lever filters server-side; we just verify no error and valid JSON
    expect(Array.isArray(json.results)).toBe(true)
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

  it.skipIf(SKIP_NETWORK)("returns plain text detail for a valid job ID", async () => {
    if (!firstJobId) {
      console.warn("Skipping detail test: no job ID available from search")
      return
    }
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, firstJobId, "--format", "plain",
    ])
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("Title:")
    expect(result.stdout).toContain("URL:")
    expect(result.stdout).toContain("Team:")
    expect(result.stdout).toContain("Location:")
  })

  it.skipIf(SKIP_NETWORK)("returns valid JSON detail with --format json", async () => {
    if (!firstJobId) {
      console.warn("Skipping detail test: no job ID available from search")
      return
    }
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY, firstJobId, "--format", "json",
    ])
    expect(result.exitCode).toBe(0)
    const json = parseJSON<Record<string, unknown>>(result)
    expect(typeof json.id).toBe("string")
    expect(typeof json.text).toBe("string") // raw Lever field name
    expect(json.id).toBe(firstJobId)
  })

  it.skipIf(SKIP_NETWORK)("exits 1 for a valid company but nonexistent job UUID", async () => {
    const result = await runCLI([
      "detail", "--company", TEST_COMPANY,
      "00000000-0000-0000-0000-000000000000",
    ])
    expect(result.exitCode).toBe(1)
    // Lever returns 404 for unknown IDs
    const err = parseError(result)
    expect(err.code).toMatch(/NOT_FOUND|HTTP_ERROR/)
  })
})

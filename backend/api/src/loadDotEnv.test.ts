import { existsSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { afterEach, describe, expect, test } from "vitest"
import { loadDotEnv } from "./loadDotEnv.js"

const testEnvVar = "MEMONEO_TEST_ENV"

describe("loadDotEnv", () => {
  afterEach(() => {
    delete process.env[testEnvVar]
  })

  test("missing file is optional", () => {
    const missingPath = join(tmpdir(), `memoneo-missing-${Date.now()}.env`)
    expect(existsSync(missingPath)).toBe(false)
    expect(() => loadDotEnv(missingPath)).not.toThrow()
  })

  test("loads existing file", () => {
    const envPath = join(tmpdir(), `memoneo-test-${Date.now()}.env`)
    writeFileSync(envPath, `${testEnvVar}=loaded\n`)

    try {
      delete process.env[testEnvVar]
      loadDotEnv(envPath)
      expect(process.env[testEnvVar]).toBe("loaded")
    } finally {
      unlinkSync(envPath)
    }
  })
})

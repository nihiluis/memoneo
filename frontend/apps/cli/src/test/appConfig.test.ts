import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { DEFAULT_APP_CONFIG, loadAppConfig } from "../constants/appConfig.js"

describe("loadAppConfig", () => {
  let cwd: string

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), "memoneo-config-"))
  })

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true })
  })

  it("prefers config.json in the working directory", () => {
    fs.writeFileSync(
      path.join(cwd, "config.json"),
      JSON.stringify({ authApiUrl: { dev: "d", prod: "https://local/auth" } })
    )

    const config = loadAppConfig(cwd, () => ({
      authApiUrl: { dev: "d", prod: "https://package/auth" },
    }))

    expect(config.authApiUrl.prod).toBe("https://local/auth")
    expect(config.apiUrl).toEqual(DEFAULT_APP_CONFIG.apiUrl)
  })

  it("falls back to the package config", () => {
    const config = loadAppConfig(cwd, () => ({
      apiUrl: { dev: "d", prod: "https://package/api" },
    }))

    expect(config.apiUrl.prod).toBe("https://package/api")
  })

  it("uses the defaults when no config can be loaded", () => {
    const config = loadAppConfig(cwd, () => {
      throw new Error("Cannot find module")
    })

    expect(config).toEqual(DEFAULT_APP_CONFIG)
  })
})

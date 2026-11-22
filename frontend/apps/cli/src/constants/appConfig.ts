import * as fs from "fs"
import * as path from "path"

interface EnvValues {
  dev: string
  prod: string
}

export interface AppConfig {
  baseDirectory: string
  defaultDirectory: string
  basePath: EnvValues
  productName: string
  authApiUrl: EnvValues
  apiUrl: EnvValues
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  baseDirectory: "_testdata",
  defaultDirectory: "_unassigned",
  basePath: {
    dev: "/",
    prod: "/web",
  },
  productName: "Memoneo",
  authApiUrl: {
    dev: "http://localhost:8089",
    prod: "https://auth.memoneo2.yourdomain.com",
  },
  apiUrl: {
    dev: "http://localhost:8094",
    prod: "https://api.memoneo2.yourdomain.com",
  },
}

/**
 * Reads config.json from the working directory, the same file loadConfig
 * uses. Falls back to the config shipped next to the package (source builds),
 * then to the defaults, so the standalone binary only needs a local file.
 */
export function loadAppConfig(
  cwd: string,
  loadPackageConfig: () => unknown
): AppConfig {
  const localPath = path.join(cwd, "config.json")
  if (fs.existsSync(localPath)) {
    return {
      ...DEFAULT_APP_CONFIG,
      ...JSON.parse(fs.readFileSync(localPath, "utf-8")),
    }
  }

  try {
    return { ...DEFAULT_APP_CONFIG, ...(loadPackageConfig() as object) }
  } catch {
    return DEFAULT_APP_CONFIG
  }
}

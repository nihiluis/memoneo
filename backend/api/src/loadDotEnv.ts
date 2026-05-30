import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"

const defaultEnvPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env")

export function loadDotEnv(filename = defaultEnvPath): void {
  if (!existsSync(filename)) {
    return
  }

  const result = config({ path: filename })
  if (result.error) {
    throw result.error
  }
}

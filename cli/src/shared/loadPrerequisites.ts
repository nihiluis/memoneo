import protect from "await-protect"
import { AuthResult } from "../lib/auth.js"
import { createApiClient, MemoneoApiClient } from "../lib/api.js"
import {
  loadConfig,
  loadInternalConfig,
  MemoneoConfig,
  MemoneoInternalConfig,
} from "./config.js"
import { MemoneoFileCache, reloadOrCreateFileCache } from "./fileCache.js"
import { loadKey } from "./loadKey.js"
import { validateAuth } from "./validateAuth.js"
import * as dotenv from "dotenv"

interface Prerequisites {
  internalConfig: MemoneoInternalConfig
  config: MemoneoConfig
  auth: AuthResult
  cache: MemoneoFileCache
  key: CryptoKey
  gqlClient: MemoneoApiClient
}

export default async function loadPrerequisites(): Promise<Prerequisites> {
  dotenv.config()
  
  const internalConfig = await loadInternalConfig()
  if (!internalConfig) {
    throw new Error("Initialize first via the init command")
  }
  const [config, configErr] = await protect(loadConfig())
  if (configErr || !config) {
    throw configErr ?? new Error("Config null")
  }

  const cache = await reloadOrCreateFileCache()

  const key = await loadKey()

  const [auth, authValidationError] = await protect(
    validateAuth(internalConfig)
  )
  if (authValidationError || !auth) {
    throw authValidationError ?? new Error("Unable to retrieve auth")
  }

  const gqlClient = createApiClient(auth.token)

  return { cache, key, auth, config, gqlClient, internalConfig }
}

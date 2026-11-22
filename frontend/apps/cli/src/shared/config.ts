import protect from "await-protect"
import * as fs from "fs/promises"
import { DEFAULT_APP_CONFIG } from "../constants/appConfig.js"

export interface MemoneoInternalConfig {
  mail: string
  userId: string
}

export interface MemoneoConfig {
  baseDirectory: string
  defaultDirectory: string
}

export async function loadInternalConfig(): Promise<
  MemoneoInternalConfig | undefined
> {
  const [configBuffer, err] = await protect(
    fs.readFile("./.memoneo/config.json")
  )
  if (!configBuffer) {
    return undefined
  }

  const config = JSON.parse(configBuffer.toString("utf-8"))

  // TODO validate config

  return config
}

export async function loadConfig(): Promise<MemoneoConfig> {
  const [_, err] = await protect(fs.stat("./config.json"))

  const configExists = !err
  if (configExists) {
    const configBuffer = await fs.readFile("./config.json")

    const config = JSON.parse(configBuffer.toString("utf-8"))

    return config
  } else {
    const defaultConfig = DEFAULT_APP_CONFIG
    await fs.writeFile("./config.json", JSON.stringify(defaultConfig), {
      encoding: "utf-8",
    })

    return defaultConfig
  }
}

import { Command } from "@oclif/core"
import {
  saveFileCache,
} from "../../shared/fileCache.js"
import { validateAuth } from "../../shared/validateAuth.js"
import { downloadNotes, writeNewNotes } from "../../shared/note/download.js"
import loadPrerequisites from "../../shared/loadPrerequisites.js"

export default class Download extends Command {
  static description =
    "Download remote notes and write missing notes into the configured base directory"

  static examples = []

  static flags = {}

  static args = {}

  validateAuth = validateAuth.bind(this)

  async run(): Promise<void> {
    const {
      config,
      auth,
      key,
      internalConfig,
      cache,
      apiClient,
    } = await loadPrerequisites()

    const downloadConfig = {
      apiClient,
      auth,
      key,
      config,
      internalConfig,
      cache,
      command: this,
    }

    const notes = await downloadNotes(downloadConfig)
    await writeNewNotes(notes, downloadConfig)

    await saveFileCache(this, cache)
  }
}

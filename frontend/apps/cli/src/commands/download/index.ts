import { Command } from "@oclif/core"
import * as fs from "fs/promises"
import { saveFileCache } from "../../shared/fileCache.js"
import { validateAuth } from "../../shared/validateAuth.js"
import { downloadNotes, writeNewNotes } from "../../shared/note/download.js"
import loadPrerequisites from "../../shared/loadPrerequisites.js"
import { getAllMarkdownFiles } from "../../lib/files.js"
import { cliUx } from "../../lib/reexports.js"
import { toError } from "../../shared/errors.js"

export default class Download extends Command {
  static description =
    "Download remote notes and write missing notes into the configured base directory"

  static examples = []

  static flags = {}

  static args = {}

  validateAuth = validateAuth.bind(this)

  async run(): Promise<void> {
    await this.parse(Download)

    const {
      config,
      auth,
      key,
      internalConfig,
      cache,
      apiClient,
    } = await loadPrerequisites()

    let localNoteIds: string[] = []
    const baseDirectoryExists = await fs
      .stat(config.baseDirectory)
      .then(stat => {
        if (!stat.isDirectory()) {
          this.error(
            toError(
              `Configured base directory ${config.baseDirectory} is no valid directory`
            )
          )
        }

        return true
      })
      .catch(error => {
        if (error && error.code === "ENOENT") {
          return false
        }

        throw error
      })

    if (baseDirectoryExists) {
      cliUx.action.start(`Loading markdown files from ${config.baseDirectory}`)
      const mdFiles = await getAllMarkdownFiles(
        config.baseDirectory,
        config.baseDirectory
      )
      cliUx.action.stop()

      localNoteIds = mdFiles
        .map(mdFile => mdFile.metadata.id)
        .filter((id): id is string => !!id)
    }

    const downloadConfig = {
      apiClient,
      auth,
      key,
      config,
      internalConfig,
      cache,
      command: this,
      localNoteIds,
    }

    const notes = await downloadNotes(downloadConfig)
    await writeNewNotes(notes, downloadConfig)

    await saveFileCache(this, cache)
  }
}

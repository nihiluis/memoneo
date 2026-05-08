import { Args, Command } from "@oclif/core"
import { saveFileCache } from "../../shared/fileCache.js"
import * as fs from "fs/promises"
import { getAllMarkdownFiles } from "../../lib/files.js"
import { uploadNewNotes } from "../../shared/note/upload.js"
import loadPrerequisites from "../../shared/loadPrerequisites.js"
import { downloadNotes, writeNewNotes } from "../../shared/note/download.js"
import { syncNotes } from "../../shared/note/sync.js"
import { cliUx } from "../../lib/reexports.js"
import { toError } from "../../shared/errors.js"

export default class Sync extends Command {
  static description =
    "Synchronize remote notes with local markdown files, including new local notes"

  static examples = []

  static flags = {}

  static args = {
    dir: Args.string({
      description:
        "Directory to scan recursively for .md files. Defaults to the configured base directory. Files without a Memoneo id may be uploaded as new notes.",
      required: false,
    }),
  }

  async run(): Promise<void> {
    const { args } = await this.parse(Sync)

    const { config, auth, key, internalConfig, cache, apiClient } =
      await loadPrerequisites()

    const targetDirectory: string = args["dir"] || config.baseDirectory
    const targetDirectoryStat = await fs.stat(targetDirectory)
    if (!targetDirectoryStat.isDirectory()) {
      this.error(
        toError(
          `Provided target directory ${targetDirectory} is no valid directory`
        )
      )
    }

    cliUx.action.start(`Loading markdown files from ${targetDirectory}`)
    const mdFiles = await getAllMarkdownFiles(
      config.baseDirectory,
      targetDirectory
    )
    cliUx.action.stop()

    const downloadConfig = {
      auth,
      key,
      config,
      internalConfig,
      cache,
      apiClient,
      command: this,
    }

    const notes = await downloadNotes(downloadConfig)
    await saveFileCache(this, cache, { logMessage: false })

    await writeNewNotes(notes, downloadConfig)
    await saveFileCache(this, cache, { logMessage: false })

    await uploadNewNotes({ existingNotes: notes, mdFiles, ...downloadConfig })
    await saveFileCache(this, cache, { logMessage: false })

    await syncNotes({ notes, mdFiles, ...downloadConfig })
    await saveFileCache(this, cache, { logMessage: true })
  }
}

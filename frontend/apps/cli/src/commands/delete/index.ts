import { Args, Command } from "@oclif/core"
import { saveFileCache } from "../../shared/fileCache.js"
import * as fs from "fs/promises"
import { getAllMarkdownFiles } from "../../lib/files.js"
import loadPrerequisites from "../../shared/loadPrerequisites.js"
import { cliUx } from "../../lib/reexports.js"
import { deleteRemovedNotes } from "../../shared/note/delete.js"
import { NoteIdAndTitle } from "../../shared/note/index.js"
import { toError } from "../../shared/errors.js"

export default class Delete extends Command {
  static description =
    "Delete remote notes whose Memoneo ids are no longer present locally"

  static examples = []

  static flags = {}

  static args = {
    dir: Args.string({
      description:
        "Directory to scan recursively for .md files. Defaults to the configured base directory. Remote notes with ids missing from this local scan are candidates for deletion.",
      required: false,
    }),
  }

  async run(): Promise<void> {
    const { args } = await this.parse(Delete)

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

    cliUx.action.start(`Loading remote notes`)
    const { data, error } = await apiClient.getNoteIds()

    if (!data || error) {
      this.error(toError("Unable to retrieve note ids from the API", error))
    }

    cliUx.action.stop()

    const deleteConfig = {
      auth,
      key,
      config,
      internalConfig,
      cache,
      apiClient,
      command: this,
    }

    // could use Zod here
    const noteIds = data as NoteIdAndTitle[]
    if (noteIds.length === 0) {
      cliUx.warn("Didn't find any notes on remote")
      return
    }

    await deleteRemovedNotes(noteIds, mdFiles, deleteConfig)

    await saveFileCache(this, cache)
  }
}

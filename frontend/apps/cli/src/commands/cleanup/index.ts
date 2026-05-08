import { Args, Command } from "@oclif/core"
import * as fs from "fs/promises"
import { getAllMarkdownFiles } from "../../lib/files.js"
import loadPrerequisites from "../../shared/loadPrerequisites.js"
import { cliUx } from "../../lib/reexports.js"
import { promptConfirmation } from "../../shared/confirmation.js"
import { limitTitleLength } from "../../shared/note/noteTitle.js"
import { removeIdFromMetadataInFile } from "../../shared/note/write.js"
import { toError } from "../../shared/errors.js"
import { validate as isUuid } from "uuid"

export default class Cleanup extends Command {
  static description =
    "Remove Memoneo ids from local markdown files and delete those notes remotely"

  static examples = []

  static flags = {}

  static args = {
    dir: Args.string({
      description:
        "Directory to scan recursively for .md files. Every scanned file with a Memoneo id is cleaned locally and deleted remotely.",
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { args } = await this.parse(Cleanup)

    const { config, apiClient } = await loadPrerequisites()

    const targetDirectory = args["dir"]
    if (!targetDirectory) {
      this.error(toError("Please provide a target directory"))
    }

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

    const filesWithIds = mdFiles.filter(mdFile => {
      const id = mdFile.metadata.id
      return typeof id === "string" && id.length > 0
    })
    const invalidIdFiles = filesWithIds.filter(
      mdFile => !isUuid(mdFile.metadata.id ?? "")
    )
    const noteIds = filesWithIds
      .map(mdFile => mdFile.metadata.id)
      .filter((id): id is string => typeof id === "string" && isUuid(id))

    if (invalidIdFiles.length > 0) {
      cliUx.warn(
        `Skipping ${invalidIdFiles.length} invalid Memoneo id(s) for remote deletion. They will still be removed from local metadata.`
      )
    }

    mdFiles.forEach(mdFile =>
      this.log(
        `* ${limitTitleLength(mdFile.metadata.title ?? "! Title missing")}`
      )
    )

    await promptConfirmation(
      this,
      "Are you sure you want to cleanup these notes?\n" +
        "This will remove the ids from the metadata in the files and delete the notes on remote.",
      { exit: true }
    )

    if (noteIds.length > 0) {
      const { data, error } = await apiClient.deleteNotes(noteIds)

      if (!data || error) {
        this.error(toError("Unable to delete notes through the API", error))
      }
    }

    for (const mdFile of filesWithIds) {
      const noteId = mdFile.metadata.id
      if (!noteId) {
        continue
      }

      await removeIdFromMetadataInFile(mdFile, config)
    }
  }
}

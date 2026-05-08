import { Args, Command } from "@oclif/core"
import { saveFileCache } from "../../shared/fileCache.js"
import * as fs from "fs/promises"
import { getAllMarkdownFiles } from "../../lib/files.js"
import { uploadNewNotes } from "../../shared/note/upload.js"
import loadPrerequisites from "../../shared/loadPrerequisites.js"
import { toError } from "../../shared/errors.js"

export default class Upload extends Command {
  static description =
    "Upload local markdown files that do not already have a Memoneo id"

  static examples = []

  static flags = {}

  static args = {
    dir: Args.string({
      description:
        "Directory to scan recursively for .md files. Defaults to the configured base directory. Files with an id in their frontmatter are treated as already uploaded and skipped.",
      required: false,
    }),
  }

  async run(): Promise<void> {
    const { args } = await this.parse(Upload)

    const {
      config,
      apiClient,
      auth,
      key,
      internalConfig,
      cache,
    } = await loadPrerequisites()

    const targetDirectory: string = args["dir"] || config.baseDirectory
    const targetDirectoryStat = await fs.stat(targetDirectory)
    if (!targetDirectoryStat.isDirectory()) {
      this.error(
        toError(
          `Provided target directory ${targetDirectory} is no valid directory`
        )
      )
    }

    this.log(`Loading markdown files from ${targetDirectory}`)
    const mdFiles = await getAllMarkdownFiles(
      config.baseDirectory,
      targetDirectory
    )

    await uploadNewNotes({
      mdFiles,
      apiClient,
      auth,
      key,
      config,
      internalConfig,
      cache,
      command: this,
      existingNotes: [],
    })

    await saveFileCache(this, cache)
  }
}

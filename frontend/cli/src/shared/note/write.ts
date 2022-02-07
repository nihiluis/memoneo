import * as fs from "fs/promises"
import * as path from "path"
import { Note, NoteFileData } from "."
import { dedent } from "../../lib/dedent"
import { MarkdownFileInfo } from "../../lib/files"
import { MemoneoConfig } from "../config"

export async function deleteMdFile(
  mdFile: MarkdownFileInfo,
  config: MemoneoConfig
) {
  await fs.rm(
    path.join(config.baseDirectory, mdFile.path, mdFile.fileName + ".md")
  )
}

export async function writeNoteToFile(
  note: Note,
  config: MemoneoConfig,
  fileInfo: NoteFileData
) {
  const fileText = dedent`---
  id: ${note.id}
  title: ${note.title}
  date: ${note.date}
  version: ${note.version}
  ---
  ${note.body}
  ` as string

  const targetFilePath = path.join(
    config.baseDirectory,
    fileInfo.path,
    `${fileInfo.title}.md`
  )

  await fs.mkdir(path.join(config.baseDirectory, fileInfo.path), {
    recursive: true,
  })

  console.log(`writing ${targetFilePath}`)
  await fs.writeFile(targetFilePath, fileText)
}

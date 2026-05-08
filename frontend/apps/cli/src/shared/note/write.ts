import * as fs from "fs/promises"
import * as path from "path"
import { Note, NoteFileData } from "./index.js"
import { dedent } from "../../lib/dedent.js"
import { MarkdownFileInfo } from "../../lib/files.js"
import { MemoneoConfig } from "../config.js"

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
  decryptedBody: string,
  config: MemoneoConfig,
  fileInfo: NoteFileData
) {
  // Create metadata section with dedent to keep it clean
  const metadata = dedent`---
  id: ${note.id}
  title: ${note.title}
  date: ${note.date}
  version: ${note.version}
  ---`

  // Combine metadata with body, preserving body's whitespace
  const fileText = `${metadata}\n${decryptedBody.trim()}`

  const targetFilePath = path.join(
    config.baseDirectory,
    fileInfo.path,
    `${fileInfo.title}.md`
  )

  await fs.mkdir(path.join(config.baseDirectory, fileInfo.path), {
    recursive: true,
  })

  await fs.writeFile(targetFilePath, fileText)
}

export async function removeIdFromMetadataInFile(
  mdFile: MarkdownFileInfo,
  config: MemoneoConfig
) {
  const metadata = dedent`---
  title: ${mdFile.metadata.title}
  date: ${mdFile.metadata.date}
  version: ${mdFile.metadata.version}
  ---`

  // Combine metadata with body, preserving body's whitespace
  const fileText = `${metadata}\n${mdFile.text}`

  const targetFilePath = path.join(
    config.baseDirectory,
    mdFile.path,
    `${mdFile.fileName}.md`
  )

  await fs.mkdir(path.join(config.baseDirectory, mdFile.path), {
    recursive: true,
  })

  await fs.writeFile(targetFilePath, fileText)
}

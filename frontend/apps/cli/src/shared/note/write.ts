import { serializeMarkdownNote } from "@memoneo/shared"
import * as fs from "fs/promises"
import * as path from "path"
import { Note, NoteFileData } from "./index.js"
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
  const fileText = serializeMarkdownNote(note, decryptedBody)

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
  const fileText = serializeMarkdownNote(
    {
      id: "",
      title: mdFile.metadata.title ?? mdFile.fileName,
      date: mdFile.metadata.date ?? mdFile.modifiedTime.toISOString(),
      version: mdFile.metadata.version ?? 0,
    } as Note,
    mdFile.text
  )

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

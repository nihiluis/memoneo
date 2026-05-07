import { Command } from "@oclif/core"
import { SingleBar } from "cli-progress"
import { Note, NoteFileData } from "./index.js"
import { AuthResult } from "../../lib/auth.js"
import { MarkdownFileInfo, md5HashText } from "../../lib/files.js"
import { encryptText } from "../../lib/key.js"
import { cliUx, generateUuid } from "../../lib/reexports.js"
import { decodeBase64String, encodeBase64String } from "../base64.js"
import { MemoneoConfig, MemoneoInternalConfig } from "../config.js"
import { MemoneoFileCache } from "../fileCache.js"
import { InsertNoteFileDataMutation, InsertNoteMutation } from "./mutation.js"
import { writeNoteToFile } from "./write.js"
import { isValidFilename } from "./file.js"
import { limitTitleLength } from "./noteTitle.js"
import { promptConfirmation } from "../confirmation.js"
import { MemoneoApiClient } from "../../lib/api.js"

interface UploadNewNotesConfig {
  mdFiles: MarkdownFileInfo[]
  auth: AuthResult
  key: CryptoKey
  internalConfig: MemoneoInternalConfig
  config: MemoneoConfig
  cache: MemoneoFileCache
  command: Command
  gqlClient: MemoneoApiClient
  existingNotes: Note[]
}

export async function uploadNewNotes({
  gqlClient,
  mdFiles,
  auth,
  key,
  config,
  internalConfig,
  cache,
  command,
}: UploadNewNotesConfig) {
  const newNotes: Partial<Note>[] = []
  const newMdFiles = mdFiles.filter(
    mdFile => !mdFile.metadata.hasOwnProperty("id")
  )

  if (newMdFiles.length === 0) {
    command.log("No new notes to upload found.")
    return
  }

  command.log("Notes to upload:")
  newMdFiles.forEach(mdFile =>
    command.log(
      `* ${limitTitleLength(mdFile.fileName ?? "! Filename missing")}`
    )
  )
  command.log("")
  const yes = await promptConfirmation(
    command,
    "Do you want to upload these notes to remote?"
  )
  if (!yes) {
    return
  }

  const progress = new SingleBar({
    format: "Encrypting... | {bar} | {value}/{total} notes",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  })

  progress.start(newMdFiles.length, 0)
  for (let mdFile of newMdFiles) {
    const encryptedText = await encryptText(mdFile.text, key)

    const uuid = generateUuid()
    mdFile.willBeCreated = uuid

    const title = mdFile.metadata.title ?? mdFile.fileName
    const date = mdFile.metadata.date ?? mdFile.modifiedTime.toISOString()

    if (!isValidFilename(title)) {
      throw new Error(
        `${title} has an invalid filename - can only have alphanumeric characters and spaces`
      )
    }

    const note = {
      id: uuid,
      body: encodeBase64String(encryptedText.ctStr),
      body_iv: encodeBase64String(encryptedText.ivStr),
      title,
      date,
      archived: false,
      version: 1,
      user_id: internalConfig.userId,
    }
    newNotes.push(note)

    // unique constraints are disabled. I don't think I will need this code
    // const uniqueConstraint = `${date}:${title}`

    // if (newNoteUniqueConstraintMap.hasOwnProperty(uniqueConstraint)) {
    //   throw new Error(
    //     `Notes must have a unique title and date combination: ${uniqueConstraint} already exists locally`
    //   )
    // }

    // newNoteUniqueConstraintMap[uniqueConstraint] = note

    progress.increment()
  }
  progress.stop()

  // for (let existingNote of existingNotes) {
  //   const uniqueConstraint = `${existingNote.date}:${existingNote.title}`

  //   if (newNoteUniqueConstraintMap.hasOwnProperty(uniqueConstraint)) {
  //     throw new Error(
  //       `Notes must have a unique title and date combination: ${uniqueConstraint} already exists remotely`
  //     )
  //   }
  // }

  cliUx.action.start("Uploading new notes")
  const { data, error } = await gqlClient
    .mutation(InsertNoteMutation, { inputs: newNotes })
    .toPromise()
  if (error) {
    throw error
  }

  if (!data) {
    throw new Error("data not found")
  }

  cliUx.action.stop()

  const insertedNotes: Note[] = data.insert_note.returning
  const noteFileData: NoteFileData[] = []

  const progress2 = new SingleBar({
    format: "Updating metadata... | {bar} | {value}/{total} notes",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  })

  progress2.start(insertedNotes.length, 0)
  for (let note of insertedNotes) {
    const mdFile = mdFiles.find(mdFile => mdFile.willBeCreated === note.id)

    // dayjs(mdFile.time).format("YYYY-MM-DD") === note.date &&

    if (!mdFile) {
      throw new Error(
        `Unable to find mdFile for note ${note.id}. Resync necessary.`
      )
    }

    const decryptedBody = mdFile.text

    const fileData = {
      title: note.title,
      path: mdFile.path,
      note_id: note.id,
    }

    await writeNoteToFile(note, decryptedBody, config, fileData)

    noteFileData.push(fileData)

    cache.trackedNoteIds.push(note.id)

    const noteCacheData = cache.getOrCreateNoteCacheData(note.id)
    noteCacheData.lastMd5Hash = md5HashText(decryptedBody)

    progress2.increment()
  }
  progress2.stop()

  const { error: error2 } = await gqlClient
    .mutation(InsertNoteFileDataMutation, { inputs: noteFileData })
    .toPromise()
  if (error2) {
    throw error2
  }
}

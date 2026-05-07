import { Command } from "@oclif/core"
import { Note } from "./index.js"
import { AuthResult } from "../../lib/auth.js"
import { decryptText } from "../../lib/key.js"
import { cliUx } from "../../lib/reexports.js"
import { decodeBase64String } from "../base64.js"
import { MemoneoConfig, MemoneoInternalConfig } from "../config.js"
import { MemoneoFileCache } from "../fileCache.js"
import { DownloadQuery } from "./query.js"
import { writeNoteToFile } from "./write.js"
import { SingleBar } from "cli-progress"
import { promptConfirmation } from "../confirmation.js"
import { formatNoteDate, limitTitleLength } from "./noteTitle.js"
import { MemoneoApiClient } from "../../lib/api.js"

interface DownloadNotesConfig {
  auth: AuthResult
  key: CryptoKey
  internalConfig: MemoneoInternalConfig
  config: MemoneoConfig
  cache: MemoneoFileCache
  command: Command
  gqlClient: MemoneoApiClient
}

export async function downloadNotes({
  gqlClient,
  command,
}: DownloadNotesConfig): Promise<Note[]> {
  cliUx.action.start("Downloading notes")

  const { data, error } = await gqlClient.query(DownloadQuery, {}).toPromise()
  if (error) {
    command.error(error)
    command.exit()
  }

  if (!data) {
    command.error("Unable to retrieve data from the GQL API")
    command.exit()
  }

  cliUx.action.stop()

  const notes: Note[] = data.note

  return notes
}

export async function decryptNotes(
  notes: Note[],
  { auth, key }: DownloadNotesConfig
): Promise<Note[]> {
  const progress = new SingleBar({
    format: "Decrypting... | {bar} | {value}/{total} notes",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  })

  progress.start(notes.length, 0)
  for (let note of notes) {
    const decryptedBody = await decryptText(
      decodeBase64String(note.body),
      decodeBase64String(note.body_iv),
      key
    )
    progress.increment()
    note.decryptedBody = decryptedBody
  }
  progress.stop()

  return notes
}

export async function writeNewNotes(
  notes: Note[],
  downloadConfig: DownloadNotesConfig
): Promise<Note[]> {
  const { config, cache, command } = downloadConfig

  const newNotes: Note[] = notes.filter(
    note => !note.archived && !cache.trackedNoteIds.includes(note.id)
  )

  if (newNotes.length === 0) {
    command.log("No new notes to download found.")
    return []
  }

  command.log("")
  command.log("Notes to download:")
  newNotes.forEach(note =>
    command.log(`* ${limitTitleLength(note.title)} (${formatNoteDate(note)})`)
  )
  command.log("")
  command.log("Do you want to save these notes locally?")
  const yes = await promptConfirmation(command)
  if (!yes) {
    return []
  }

  await decryptNotes(newNotes, downloadConfig)

  const progress = new SingleBar({
    format: "Writing new notes... | {bar} | {value}/{total} notes",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  })

  progress.start(newNotes.length, 0)
  for (let note of newNotes) {
    const decryptedBody = note.decryptedBody
    if (!decryptedBody) {
      command.error(`Note ${note.id} has no decrypted body`)
      command.exit()
      continue
    }

    await writeNoteToFile(note, decryptedBody, config, {
      title: note.file?.title ?? note.title,
      path: note.file?.path ?? config.defaultDirectory,
    })
    cache.trackedNoteIds.push(note.id)
    progress.increment()
  }
  progress.stop()

  return newNotes
}

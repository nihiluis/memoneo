import { AuthResult } from "../../lib/auth.js"
import { MemoneoConfig, MemoneoInternalConfig } from "../config.js"
import { MemoneoFileCache } from "../fileCache.js"
import { Command } from "@oclif/core"
import { NoteIdAndTitle } from "./index.js"
import { cliUx } from "../../lib/reexports.js"
import { MarkdownFileInfo } from "../../lib/files.js"
import { promptConfirmation } from "../confirmation.js"
import { limitTitleLength } from "./noteTitle.js"
import { MemoneoApiClient } from "@memoneo/shared"

interface DeleteNotesConfig {
  auth: AuthResult
  key: CryptoKey
  internalConfig: MemoneoInternalConfig
  config: MemoneoConfig
  cache: MemoneoFileCache
  command: Command
  apiClient: MemoneoApiClient
}

export async function deleteRemovedNotes(
  notes: NoteIdAndTitle[],
  markdownFiles: MarkdownFileInfo[],
  { command, cache, apiClient }: DeleteNotesConfig
) {
  cliUx.action.start(`Finding superfluous notes`)

  const noteMap = notes.reduce((dict, note) => {
    dict[note.id] = note
    return dict
  }, {} as { [key: string]: NoteIdAndTitle })
  const usedLocalNoteMap = {} as { [key: string]: boolean }

  markdownFiles.forEach(mdFile => {
    const id = mdFile.metadata.id

    if (!id) {
      return
    }

    usedLocalNoteMap[id] = true
  })

  const superfluousNotes: NoteIdAndTitle[] = Object.values(noteMap).filter(
    note => !(note.id in usedLocalNoteMap)
  )

  cliUx.action.stop()

  command.log("")
  if (superfluousNotes.length === 0) {
    command.log(`No superfluous notes to delete found.`)
    return
  }

  command.log(`Found ${superfluousNotes.length} superfluous note(s):`)
  superfluousNotes.forEach(note =>
    command.log(`* ${limitTitleLength(note.title)}`)
  )

  command.log("")

  command.log("These files will be archived on remote.")
  const yes = await promptConfirmation(command)
  if (!yes) {
    return
  }

  const { error: archiveError } = await apiClient.archiveNotes(
    superfluousNotes.map(note => note.id)
  )
  if (archiveError) {
    throw archiveError
  }

  cliUx.action.start(
    `Archiving ${superfluousNotes.length} locally removed notes on remote`
  )

  superfluousNotes.forEach(note => {
    const currentIdx = cache.trackedNoteIds.indexOf(note.id)
    if (currentIdx >= 0) {
      cache.trackedNoteIds.splice(currentIdx, 1)
    }

    delete cache.notes[note.id]
  })
}

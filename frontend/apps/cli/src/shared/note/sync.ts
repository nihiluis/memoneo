import { Command } from "@oclif/core"
import dayjs, { Dayjs } from "dayjs"
import { Note } from "./index.js"
import { AuthResult } from "../../lib/auth.js"
import { MarkdownFileInfo, md5HashText } from "../../lib/files.js"
import { encryptText, decryptText } from "../../lib/key.js"
import { decodeBase64String, encodeBase64String } from "../base64.js"
import { MemoneoConfig, MemoneoInternalConfig } from "../config.js"
import { MemoneoFileCache, NoteCacheData } from "../fileCache.js"
import { deleteMdFile, writeNoteToFile } from "./write.js"
import { SingleBar } from "cli-progress"
import { limitTitleLength } from "./noteTitle.js"
import { promptConfirmation } from "../confirmation.js"
import { cliUx } from "../../lib/reexports.js"
import { MemoneoApiClient } from "@memoneo/shared"

interface SyncNotesConfig {
  notes: Note[]
  mdFiles: MarkdownFileInfo[]
  auth: AuthResult
  key: CryptoKey
  internalConfig: MemoneoInternalConfig
  config: MemoneoConfig
  cache: MemoneoFileCache
  command: Command
  apiClient: MemoneoApiClient
}

interface MarkdownFileSyncData {
  outdatedType: OutdatedType | null
  outdatedReason: string
  hasNewMd5Hash: boolean
  isMdFileNew: boolean
  // The local md5hash of the text in the md file.
  localMd5Hash: string
  // The last md5hash of the text that was written to remote.
  lastMd5Hash: string
  note: Note
  noteDate: Dayjs
  mdFileDate: Dayjs
  noteCacheData: NoteCacheData
  mdFile: MarkdownFileInfo
  newFileNameOrPath: boolean
}

export async function syncNotes({
  notes,
  mdFiles,
  auth,
  key,
  config,
  cache,
  command,
  apiClient,
}: SyncNotesConfig) {
  const noteMap: Record<string, Note> = {}
  const mdFileMap: Record<string, MarkdownFileInfo> = {}

  for (let note of notes) {
    noteMap[note.id] = note
  }

  cliUx.action.start("Retrieving local and remote changes to notes")

  const mdFileData: MarkdownFileSyncData[] = []

  const cacheUpdates: Record<string, NoteCacheData> = {}
  for (const mdFile of mdFiles) {
    const id = mdFile.metadata.id
    if (!id) {
      continue
    }

    mdFileMap[id] = mdFile

    if (!noteMap.hasOwnProperty(id)) {
      command.warn(
        `Found local note ${id} which does not exist on remote. Skipping sync. Manual fix is necessary.`
      )
      continue
    }

    const noteCacheData = cache.getOrCreateNoteCacheData(id)

    const currentRemoteNoteData = noteMap[id]

    const noteDate = dayjs(currentRemoteNoteData.updated_at)
    const mdFileDate = dayjs(mdFile.modifiedTime)

    const localMd5Hash = md5HashText(mdFile.text)
    const lastMd5Hash = noteCacheData.lastMd5Hash

    let hasNewMd5Hash = localMd5Hash !== lastMd5Hash
    const hasLastMd5Hash = lastMd5Hash !== ""

    const noteCacheDataWithChanges = { ...noteCacheData }

    if (!hasLastMd5Hash) {
      command.warn(
        `Local note ${id} has no lastMd5Hash. This is unexpected. Fixing cache...`
      )

      noteCacheDataWithChanges.lastMd5Hash = localMd5Hash

      const decryptedRemoteText = await decryptText(
        decodeBase64String(currentRemoteNoteData.body),
        decodeBase64String(currentRemoteNoteData.body_iv),
        key
      )
      const remoteMd5Hash = md5HashText(decryptedRemoteText)

      hasNewMd5Hash = localMd5Hash !== remoteMd5Hash
    } else if (hasNewMd5Hash) {
      const decryptedText = await decryptText(
        decodeBase64String(currentRemoteNoteData.body),
        decodeBase64String(currentRemoteNoteData.body_iv),
        key
      )
      const currentMd5Hash = md5HashText(decryptedText)

      if (localMd5Hash === currentMd5Hash) {
        command.warn(
          `Local file matches remote file content but has different hash for note ${id}. This is unexpected. Updating lastMd5Hash in cache.`
        )
        noteCacheDataWithChanges.lastMd5Hash = currentMd5Hash
        hasNewMd5Hash = false
      }
    }

    const newFileName = mdFile.fileName !== currentRemoteNoteData.file?.title
    const newFilePath = mdFile.path !== currentRemoteNoteData.file?.path
    const newFileNameOrPath = newFileName || newFilePath

    let outdatedType: OutdatedType | null = null
    let outdatedReason = ""
    if (hasNewMd5Hash) {
      outdatedType = "Modified"
      outdatedReason =
        "Local file has a different md5 hash than the remote file."
      noteCacheDataWithChanges.lastMd5Hash = localMd5Hash
    } else if (newFileNameOrPath) {
      outdatedType = "LocationChanged"
      if (newFileName) {
        outdatedReason = `File name changed from ${currentRemoteNoteData.file?.title} to ${mdFile.fileName}`
      } else {
        outdatedReason = `File path changed from ${currentRemoteNoteData.file?.path} to ${mdFile.path}`
      }
    }

    mdFileData.push({
      outdatedType,
      hasNewMd5Hash,
      isMdFileNew: false,
      localMd5Hash,
      lastMd5Hash,
      note: currentRemoteNoteData,
      noteDate,
      mdFileDate,
      noteCacheData,
      mdFile,
      newFileNameOrPath,
      outdatedReason,
    } satisfies MarkdownFileSyncData)

    cacheUpdates[id] = noteCacheDataWithChanges
  }

  cliUx.action.stop()

  const { promptYes, fileSyncData: updatedLocalNotes } =
    await writeUpdatedNotesFromLocalToRemote(
      mdFileData,
      command,
      config,
      auth,
      key,
      apiClient
    )
  if (!promptYes) {
    return
  }

  Object.entries(cacheUpdates).forEach(([id, cacheUpdate]) => {
    cache.updateNoteCacheData(id, cacheUpdate)
  })

  const updatedLocalNotesIds = updatedLocalNotes.map(note => note.note.id)

  const filteredMdFileData = mdFileData.filter(
    data => !updatedLocalNotesIds.includes(data.note.id)
  )

  await writeUpdatedNotesFromRemoteToLocal(
    filteredMdFileData,
    command,
    config,
    auth,
    key
  )
}

async function writeUpdatedNotesFromRemoteToLocal(
  mdFileData: MarkdownFileSyncData[],
  command: Command,
  config: MemoneoConfig,
  auth: AuthResult,
  key: CryptoKey
) {
  const updatedRemoteNotes = mdFileData.filter(
    ({ note, mdFile }) => note.file && note.version > mdFile.metadata.version!
  )

  // TODO what happens if a note is outdated from remote but was updated locally, what takes precedence?
  if (updatedRemoteNotes.length === 0) {
    command.log("No remote note changes found to apply to local.")
    return
  }

  command.log("")
  // The notes that have been updated remotely
  command.log("Updated remote notes:")
  updatedRemoteNotes.forEach(note =>
    command.log(`* ${limitTitleLength(note.note.title ?? "! Title missing")}`)
  )
  command.log("")
  command.log("Do you want to write the changes to local?")
  await promptConfirmation(command)
  const progress2 = new SingleBar({
    format: "Update outdated local notes... | {bar} | {value}/{total} notes",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  })
  progress2.start(updatedRemoteNotes.length, 0)
  for (let localData of updatedRemoteNotes) {
    const { note, mdFile, noteCacheData, localMd5Hash } = localData

    const updateFileName = note.file!.title !== mdFile.fileName
    const updatePath = note.file!.path !== mdFile.path

    const decryptedBody = await decryptText(
      decodeBase64String(note.body),
      decodeBase64String(note.body_iv),
      key
    )
    await writeNoteToFile(note, decryptedBody, config, {
      path: note.file!.path,
      title: note.file!.title,
    })

    noteCacheData.lastSync = note.updated_at
    noteCacheData.lastMd5Hash = md5HashText(decryptedBody)

    if (updateFileName || updatePath) {
      await deleteMdFile(mdFile, config)
    }
    progress2.increment()
  }

  progress2.stop()
}

type OutdatedType = "Modified" | "New" | "LocationChanged"

interface WriteResult {
  promptYes: boolean
  fileSyncData: MarkdownFileSyncData[]
}

/**
 * @returns the notes that were outdated from remote and were updated locally
 */
async function writeUpdatedNotesFromLocalToRemote(
  mdFileData: MarkdownFileSyncData[],
  command: Command,
  config: MemoneoConfig,
  auth: AuthResult,
  key: CryptoKey,
  apiClient: MemoneoApiClient
): Promise<WriteResult> {
  const outdatedLocalNotes = mdFileData.filter(data => !!data.outdatedType)

  // TODO what happens if a note is outdated from remote but was updated locally, what takes precedence?
  if (outdatedLocalNotes.length === 0) {
    command.log("No note changes found that could be written to remote.")
    return { promptYes: false, fileSyncData: [] }
  }

  command.log("")
  command.log("Local notes that are outdated on remote:")
  outdatedLocalNotes.forEach(note =>
    command.log(
      `* ${limitTitleLength(note.note.title ?? "! Title missing")} - ${
        note.outdatedType
      } - ${note.outdatedReason}`
    )
  )
  command.log("")
  command.log("Do you want to write these changes to remote?")
  const yes = await promptConfirmation(command)
  if (!yes) {
    return { promptYes: false, fileSyncData: [] }
  }

  const progress = new SingleBar({
    format: "Update outdated remote notes... | {bar} | {value}/{total} notes",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
  })
  progress.start(outdatedLocalNotes.length, 0)
  // set local content to remote
  for (let localData of outdatedLocalNotes) {
    const {
      mdFile,
      note,
      noteCacheData,
      localMd5Hash,
      hasNewMd5Hash,
      isMdFileNew,
      newFileNameOrPath,
    } = localData

    const noteFileData = {
      title: mdFile.fileName,
      path: mdFile.path,
      note_id: note.id,
    }

    if (hasNewMd5Hash || isMdFileNew) {
      note.version += 1
      const decryptedBody = mdFile.text

      // I'm not sure why this is done here, for the version?
      await writeNoteToFile(note, decryptedBody, config, noteFileData)

      const encryptedBody = await encryptText(mdFile.text, key)

      const { data, error } = await apiClient.updateNote(note.id, {
        title: mdFile.metadata.title,
        body: encodeBase64String(encryptedBody.ctStr),
        body_iv: encodeBase64String(encryptedBody.ivStr),
        date: mdFile.metadata.date,
        version: note.version,
      })
      if (error) {
        throw error
      }
      if (!data) {
        throw new Error("Unable to update note on remote")
      }

      noteCacheData.lastMd5Hash = localMd5Hash
      noteCacheData.lastSync = data.updated_at
    }

    if (newFileNameOrPath || isMdFileNew) {
      const { error: error2 } = await apiClient.upsertNoteFiles([noteFileData])
      if (error2) {
        throw error2
      }
    }

    progress.increment()
  }
  progress.stop()

  return { promptYes: true, fileSyncData: outdatedLocalNotes }
}

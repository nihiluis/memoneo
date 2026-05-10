import {
  createApiClient,
  MarkdownFileInfo,
  type Note,
  type NoteFileData,
  type NoteInput,
} from "@memoneo/shared"
import { randomUUID } from "expo-crypto"

import enckey from "@/modules/enckey"
import { getApiUrl } from "@/lib/settings/urls"

import { loadNoteCache, saveNoteCache } from "./cache"
import {
  deleteLocalMarkdownFile,
  listLocalMarkdownFiles,
  writeLocalNote,
} from "./local"
import { md5HashText } from "./hash"

type SyncAuth = {
  token: string
  userId: string
}

type SyncResult = {
  downloaded: number
  uploaded: number
  updatedLocal: number
  updatedRemote: number
}

export async function downloadRemoteNotes(auth: SyncAuth): Promise<SyncResult> {
  const client = createApiClient(auth.token, getApiUrl(""))
  const remoteNotes = await getRemoteNotes(client)
  const localFiles = await listLocalMarkdownFiles()
  const localIds = new Set(localFiles.map(file => file.metadata.id).filter(Boolean))
  let downloaded = 0

  for (const note of remoteNotes) {
    if (note.archived || localIds.has(note.id)) {
      continue
    }

    await writeRemoteNoteToLocal(note)
    downloaded += 1
  }

  return { downloaded, uploaded: 0, updatedLocal: 0, updatedRemote: 0 }
}

export async function uploadLocalNotes(auth: SyncAuth): Promise<SyncResult> {
  const client = createApiClient(auth.token, getApiUrl(""))
  const localFiles = await listLocalMarkdownFiles()
  const cache = await loadNoteCache()
  let uploaded = 0

  for (const file of localFiles.filter(file => !file.metadata.id)) {
    const id = randomUUID()
    const note = await localFileToNewNote(file, id, auth.userId)
    const { data, error } = await client.upsertNotes([note])
    if (error) {
      throw error
    }

    const inserted = data?.[0]
    if (!inserted) {
      throw new Error("Unable to upload local note")
    }

    const fileData = noteFileData(file, inserted.id)
    const { error: fileError } = await client.upsertNoteFiles([fileData])
    if (fileError) {
      throw fileError
    }

    await writeLocalNote(inserted, file.text, fileData)
    cache[inserted.id] = {
      lastMd5Hash: await md5HashText(file.text),
      lastSync: inserted.updated_at,
    }
    uploaded += 1
  }

  await saveNoteCache(cache)
  return { downloaded: 0, uploaded, updatedLocal: 0, updatedRemote: 0 }
}

export async function syncNotes(auth: SyncAuth): Promise<SyncResult> {
  const client = createApiClient(auth.token, getApiUrl(""))
  const result: SyncResult = {
    downloaded: 0,
    uploaded: 0,
    updatedLocal: 0,
    updatedRemote: 0,
  }

  const downloadResult = await downloadRemoteNotes(auth)
  result.downloaded += downloadResult.downloaded

  const uploadResult = await uploadLocalNotes(auth)
  result.uploaded += uploadResult.uploaded

  const remoteNotes = await getRemoteNotes(client)
  const remoteById = new Map(remoteNotes.map(note => [note.id, note]))
  const localFiles = await listLocalMarkdownFiles()
  const cache = await loadNoteCache()
  const localUpdatedIds = new Set<string>()

  for (const file of localFiles) {
    const id = file.metadata.id
    if (!id) {
      continue
    }

    const remote = remoteById.get(id)
    if (!remote) {
      continue
    }

    const localHash = await md5HashText(file.text)
    const lastHash = cache[id]?.lastMd5Hash ?? ""
    let hasLocalContentChange = localHash !== lastHash

    if (!lastHash) {
      const remoteBody = await decryptRemoteNote(remote)
      hasLocalContentChange = localHash !== (await md5HashText(remoteBody))
    }

    const locationChanged =
      file.fileName !== remote.file?.title || file.path !== remote.file?.path

    if (hasLocalContentChange || locationChanged) {
      const nextVersion = remote.version + (hasLocalContentChange ? 1 : 0)
      const nextRemote = {
        ...remote,
        title: file.metadata.title ?? file.fileName,
        date: file.metadata.date ?? remote.date,
        version: nextVersion,
      }

      if (hasLocalContentChange) {
        const encrypted = await enckey.encryptText(file.text)
        const { data, error } = await client.updateNote(remote.id, {
          title: nextRemote.title,
          body: encrypted.substring(16),
          body_iv: encrypted.substring(0, 16),
          date: nextRemote.date,
          version: nextVersion,
        })
        if (error) {
          throw error
        }
        if (!data) {
          throw new Error("Unable to update remote note")
        }

        await writeLocalNote(data, file.text, noteFileData(file, remote.id))
        cache[id] = {
          lastMd5Hash: localHash,
          lastSync: data.updated_at,
        }
      }

      if (locationChanged) {
        const { error } = await client.upsertNoteFiles([
          noteFileData(file, remote.id),
        ])
        if (error) {
          throw error
        }
      }

      localUpdatedIds.add(id)
      result.updatedRemote += 1
    }
  }

  for (const file of localFiles) {
    const id = file.metadata.id
    if (!id || localUpdatedIds.has(id)) {
      continue
    }

    const remote = remoteById.get(id)
    if (!remote?.file || remote.version <= (file.metadata.version ?? 0)) {
      continue
    }

    await writeRemoteNoteToLocal(remote)
    if (file.fileName !== remote.file.title || file.path !== remote.file.path) {
      await deleteLocalMarkdownFile(file)
    }
    cache[id] = {
      lastMd5Hash: await md5HashText(await decryptRemoteNote(remote)),
      lastSync: remote.updated_at,
    }
    result.updatedLocal += 1
  }

  await saveNoteCache(cache)
  return result
}

async function getRemoteNotes(client: ReturnType<typeof createApiClient>) {
  const { data, error } = await client.getNotes()
  if (error) {
    throw error
  }
  return data ?? []
}

async function localFileToNewNote(
  file: MarkdownFileInfo,
  id: string,
  userId: string
): Promise<NoteInput> {
  const title = file.metadata.title ?? file.fileName
  const date = file.metadata.date ?? file.modifiedTime.toISOString()
  const encrypted = await enckey.encryptText(file.text)

  return {
    id,
    body: encrypted.substring(16),
    body_iv: encrypted.substring(0, 16),
    title,
    date,
    archived: false,
    version: 1,
    user_id: userId,
  }
}

async function writeRemoteNoteToLocal(note: Note) {
  const body = await decryptRemoteNote(note)
  await writeLocalNote(note, body, {
    title: note.file?.title ?? note.title,
    path: note.file?.path ?? "",
    note_id: note.id,
  })
}

async function decryptRemoteNote(note: Note) {
  return enckey.decryptText(note.body, note.body_iv)
}

function noteFileData(file: MarkdownFileInfo, noteId: string): NoteFileData {
  return {
    title: file.fileName,
    path: file.path,
    note_id: noteId,
  }
}

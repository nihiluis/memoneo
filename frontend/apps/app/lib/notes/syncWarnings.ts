import type { MarkdownFileInfo, Note } from "@memoneo/shared"

export type SingleNoteOverwriteWarning = {
  title: string
  message: string
  confirmText: string
}

export function getUploadOverwriteWarning(
  remote: Note,
  file: MarkdownFileInfo,
  cacheEntry?: { lastSync?: string }
): SingleNoteOverwriteWarning | null {
  const localVersion = file.metadata.version ?? 0
  if (
    remote.version <= localVersion &&
    !isAfter(remote.updated_at, cacheEntry?.lastSync)
  ) {
    return null
  }

  return {
    title: "Overwrite newer remote note?",
    message:
      "The remote note appears newer than this local copy. Uploading this note will overwrite the remote data.",
    confirmText: "Upload anyway",
  }
}

export function getDownloadOverwriteWarning(
  remote: Note,
  file: MarkdownFileInfo,
  cacheEntry?: { lastSync?: string }
): SingleNoteOverwriteWarning | null {
  if (
    !isAfter(file.modifiedTime.toISOString(), cacheEntry?.lastSync) &&
    !isAfter(file.modifiedTime.toISOString(), remote.updated_at)
  ) {
    return null
  }

  return {
    title: "Overwrite newer local note?",
    message:
      "This local note appears newer than the remote copy. Syncing this note will overwrite the local data.",
    confirmText: "Sync anyway",
  }
}

function isAfter(value: string | undefined, reference: string | undefined) {
  if (!value || !reference) {
    return false
  }

  return new Date(value).getTime() > new Date(reference).getTime()
}

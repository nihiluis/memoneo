import { localNoteId, type MarkdownFileInfo, type Note } from "@memoneo/shared"

export type TransferAction = "upload" | "download" | "sync"
export type TransferNote = {
  id: string
  title: string
  path: string
  location: string
}
export const transferId = (file: MarkdownFileInfo) =>
  file.metadata.id || localNoteId(file)

export function getTransferNotes(
  action: TransferAction,
  files: MarkdownFileInfo[],
  remote: Note[]
): TransferNote[] {
  const localIds = new Set(files.map(transferId))
  const local =
    action === "download"
      ? []
      : files
          .filter(file => action === "sync" || !file.metadata.id)
          .map(file => ({
            id: transferId(file),
            title: file.metadata.title || file.fileName,
            path: file.path,
            location: "On this device",
          }))
  const missing =
    action === "upload"
      ? []
      : remote
          .filter(note => !note.archived && !localIds.has(note.id))
          .map(note => ({
            id: note.id,
            title: note.title,
            path: note.file?.path || "",
            location: "Remote only",
          }))
  return [...local, ...missing].sort((a, b) => a.title.localeCompare(b.title))
}

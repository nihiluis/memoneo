import {
  createUnsavedNote,
  markdownFileToNote,
  parseMarkdownNoteFile,
  serializeMarkdownNote,
  type MarkdownFileInfo,
  type Note,
  type NoteFileData,
} from "@memoneo/shared"
import {
  clearRecords,
  deleteRecord,
  listRecords,
  putRecord,
} from "@/lib/web/database"

type StoredNote = {
  id: string
  text: string
  fileName: string
  path: string
  createdAt: number
  updatedAt: number
}
const segment = (value: string) =>
  value
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Untitled"
const folderPath = (path: string) =>
  path.split("/").filter(Boolean).map(segment).join("/")
const fileId = (path: string, title: string) =>
  [path, title].filter(Boolean).join("/")

export async function listLocalMarkdownFiles(): Promise<MarkdownFileInfo[]> {
  return (await listRecords<StoredNote>("notes")).map(file => {
    const parsed = parseMarkdownNoteFile(file.text)
    return {
      fileName: file.fileName,
      path: file.path,
      text: parsed.content.trim(),
      metadata: parsed.metadata,
      createdTime: new Date(file.createdAt),
      modifiedTime: new Date(file.updatedAt),
      uri: file.id,
    }
  })
}
export async function listLocalFolderPaths(): Promise<string[]> {
  return (await listRecords<{ id: string }>("folders"))
    .map(folder => folder.id)
    .sort()
}
export async function listLocalNotes(): Promise<Note[]> {
  return (await listLocalMarkdownFiles())
    .map(markdownFileToNote)
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
}
async function ensureFolders(path: string) {
  const parts = path.split("/").filter(Boolean)
  for (let i = 1; i <= parts.length; i++)
    await putRecord("folders", { id: parts.slice(0, i).join("/") })
}
export async function writeLocalNote(
  note: Note,
  body: string,
  fileInfo?: NoteFileData
) {
  const title = segment(fileInfo?.title ?? note.file?.title ?? note.title)
  const path = folderPath(fileInfo?.path ?? note.file?.path ?? "")
  const id = fileId(path, title)
  const existing = await listRecords<StoredNote>("notes")
  await ensureFolders(path)
  await putRecord("notes", {
    id,
    fileName: title,
    path,
    text: serializeMarkdownNote({ ...note, title: note.title || title }, body),
    createdAt: Date.parse(note.created_at) || existing.find(file => file.id === id)?.createdAt || Date.now(),
    updatedAt: Date.parse(note.updated_at) || Date.now(),
  })
}
export async function createLocalNote(title: string, body: string, path = "") {
  path = folderPath(path)
  const existing = new Set(
    (await listLocalMarkdownFiles())
      .filter(file => file.path === path)
      .map(file => file.fileName)
  )
  const base = segment(title)
  let fileTitle = base
  for (let i = 2; existing.has(fileTitle); i++) fileTitle = `${base} ${i}`
  const note: Note = {
    ...createUnsavedNote(),
    id: `local:${fileId(path, fileTitle)}`,
    title: title || fileTitle,
    body,
    decryptedBody: body,
    file: { title: fileTitle, path },
  }
  await writeLocalNote(note, body)
  return note
}
export async function createLocalFolder(parentPath = "", name = "New folder") {
  const parent = folderPath(parentPath)
  const existing = new Set(await listLocalFolderPaths())
  const base = segment(name)
  let path = fileId(parent, base)
  for (let i = 2; existing.has(path); i++) path = fileId(parent, `${base} ${i}`)
  await ensureFolders(path)
  return path
}
export async function deleteLocalMarkdownFile(file: MarkdownFileInfo) {
  await deleteRecord("notes", file.uri ?? fileId(file.path, file.fileName))
}
export async function deleteLocalNote(note: Note) {
  if (note.file?.title)
    await deleteRecord("notes", fileId(note.file.path ?? "", note.file.title))
}
export async function deleteAllLocalNotes() {
  await clearRecords("notes")
  await clearRecords("folders")
}

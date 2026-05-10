import {
  createUnsavedNote,
  markdownFileToNote,
  MarkdownFileInfo,
  parseMarkdownNoteFile,
  serializeMarkdownNote,
  type Note,
  type NoteFileData,
} from "@memoneo/shared"
import { Directory, File, Paths } from "expo-file-system"

const NOTES_DIR_NAME = "notes"
const DEFAULT_NOTE_FILE_NAME = "Untitled"

export function getNotesDir() {
  return new Directory(Paths.document, NOTES_DIR_NAME)
}

export function ensureNotesDir() {
  const dir = getNotesDir()
  if (!dir.exists) {
    dir.create({ intermediates: true })
  }
  return dir
}

export async function listLocalMarkdownFiles(): Promise<MarkdownFileInfo[]> {
  const dir = ensureNotesDir()
  return listMarkdownFilesInDirectory(dir, "")
}

export async function listLocalNotes(): Promise<Note[]> {
  const files = await listLocalMarkdownFiles()
  return files.map(markdownFileToNote).sort((a, b) => getNoteTime(b) - getNoteTime(a))
}

export async function writeLocalNote(
  note: Note,
  body: string,
  fileInfo?: NoteFileData
) {
  const notesDir = ensureNotesDir()
  const title = sanitizeFileSegment(fileInfo?.title ?? note.file?.title ?? note.title)
  const relativePath = fileInfo?.path ?? note.file?.path ?? ""
  const targetDir = ensureRelativeDirectory(notesDir, relativePath)
  const file = new File(targetDir, `${title || DEFAULT_NOTE_FILE_NAME}.md`)
  const text = serializeMarkdownNote(
    {
      id: note.id,
      title: note.title || title || DEFAULT_NOTE_FILE_NAME,
      date: note.date,
      version: note.version,
    },
    body
  )

  if (!file.exists) {
    file.create({ intermediates: true, overwrite: true })
  }
  file.write(text)
}

export async function createLocalNote(title: string, body: string) {
  const now = new Date()
  const fileTitle = await uniqueFileTitle(title || DEFAULT_NOTE_FILE_NAME)
  const note = {
    ...createUnsavedNote(now),
    id: `local:${fileTitle}`,
    title: title || fileTitle,
    body,
    decryptedBody: body,
    file: {
      title: fileTitle,
      path: "",
    },
  } satisfies Note

  await writeLocalNote(note, body, { title: fileTitle, path: "" })
  return note
}

export async function deleteLocalMarkdownFile(fileInfo: MarkdownFileInfo) {
  if (!fileInfo.uri) {
    return
  }

  const file = new File(fileInfo.uri)
  if (file.exists) {
    file.delete()
  }
}

export async function deleteLocalNote(note: Note) {
  const fileTitle = note.file?.title
  if (!fileTitle) {
    return
  }

  const notesDir = ensureNotesDir()
  const targetDir = ensureRelativeDirectory(notesDir, note.file?.path ?? "")
  const file = new File(targetDir, `${fileTitle}.md`)
  if (file.exists) {
    file.delete()
  }
}

async function listMarkdownFilesInDirectory(
  dir: Directory,
  relativePath: string
): Promise<MarkdownFileInfo[]> {
  const files: MarkdownFileInfo[] = []

  for (const item of dir.list()) {
    if (item instanceof Directory) {
      files.push(
        ...(await listMarkdownFilesInDirectory(
          item,
          joinRelativePath(relativePath, item.name)
        ))
      )
      continue
    }

    if (!item.name.endsWith(".md")) {
      continue
    }

    const text = await item.text()
    const parsed = parseMarkdownNoteFile(text)

    files.push({
      fileName: item.name.slice(0, -".md".length),
      path: relativePath,
      text: parsed.content.trim(),
      modifiedTime: new Date(item.modificationTime ?? Date.now()),
      createdTime: new Date(item.creationTime ?? item.modificationTime ?? Date.now()),
      metadata: parsed.metadata,
      uri: item.uri,
    })
  }

  return files
}

function ensureRelativeDirectory(root: Directory, relativePath: string) {
  let current = root
  for (const segment of relativePath.split("/").filter(Boolean)) {
    current = new Directory(current, sanitizeFileSegment(segment))
    if (!current.exists) {
      current.create({ intermediates: true })
    }
  }
  return current
}

async function uniqueFileTitle(title: string) {
  const notes = await listLocalNotes()
  const existing = new Set(notes.map(note => note.file?.title).filter(Boolean))
  const base = sanitizeFileSegment(title) || DEFAULT_NOTE_FILE_NAME
  let next = base
  let index = 2

  while (existing.has(next)) {
    next = `${base} ${index}`
    index += 1
  }

  return next
}

function sanitizeFileSegment(value: string | null | undefined) {
  return (value || DEFAULT_NOTE_FILE_NAME)
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function joinRelativePath(base: string, segment: string) {
  return [base, segment].filter(Boolean).join("/")
}

function getNoteTime(note: Note) {
  return new Date(note.updated_at ?? note.created_at ?? note.date).getTime()
}

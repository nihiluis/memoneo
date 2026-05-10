import type { Note, NoteFileData } from "./api.js"

export interface MarkdownFileMetadata {
  id?: string
  title?: string
  date?: string
  version?: number
}

export interface MarkdownFileInfo {
  fileName: string
  path: string
  text: string
  modifiedTime: Date
  createdTime: Date
  metadata: MarkdownFileMetadata
  uri?: string
  willBeCreated?: string
}

export function parseMarkdownNoteFile(text: string): {
  content: string
  metadata: MarkdownFileMetadata
} {
  const newline = text.includes("\r\n") ? "\r\n" : "\n"
  const frontmatterStart = `---${newline}`

  if (!text.startsWith(frontmatterStart)) {
    return { content: text, metadata: {} }
  }

  const frontmatterEnd = `${newline}---`
  const endIndex = text.indexOf(frontmatterEnd, frontmatterStart.length)

  if (endIndex === -1) {
    return { content: text, metadata: {} }
  }

  const metadataText = text.slice(frontmatterStart.length, endIndex)
  const contentStart = endIndex + frontmatterEnd.length
  const content = text.slice(
    text.startsWith(newline, contentStart)
      ? contentStart + newline.length
      : contentStart
  )

  return {
    content,
    metadata: parseMarkdownMetadata(metadataText),
  }
}

export function serializeMarkdownNote(
  note: Pick<Note, "id" | "title" | "date" | "version">,
  body: string
) {
  const metadataLines = ["---"]
  if (note.id && note.id !== "unsaved" && !note.id.startsWith("local:")) {
    metadataLines.push(`id: ${note.id}`)
  }
  metadataLines.push(
    `title: ${note.title}`,
    `date: ${note.date}`,
    `version: ${note.version}`,
    "---"
  )
  const metadata = metadataLines.join("\n")

  return `${metadata}\n${body.trim()}`
}

export function markdownFileToNote(file: MarkdownFileInfo): Note {
  const title = file.metadata.title ?? file.fileName
  const date = file.metadata.date ?? file.modifiedTime.toISOString()
  const id = file.metadata.id ?? localNoteId(file)

  return {
    id,
    user_id: "",
    title,
    body: file.text,
    body_iv: "",
    date,
    archived: false,
    version: file.metadata.version ?? 0,
    created_at: file.createdTime.toISOString(),
    updated_at: file.modifiedTime.toISOString(),
    decryptedBody: file.text,
    file: {
      note_id: file.metadata.id,
      title: file.fileName,
      path: file.path,
    } satisfies NoteFileData,
  }
}

export function localNoteId(file: Pick<MarkdownFileInfo, "path" | "fileName">) {
  return `local:${[file.path, file.fileName].filter(Boolean).join("/")}`
}

export function getNoteFileTitle(note: Pick<Note, "title" | "file">) {
  return note.file?.title ?? note.title ?? "Untitled"
}

export function createUnsavedNote(now = new Date()): Note {
  const iso = now.toISOString()

  return {
    id: "unsaved",
    user_id: "",
    title: "",
    body: "",
    body_iv: "",
    date: iso,
    archived: false,
    version: 0,
    created_at: iso,
    updated_at: iso,
    decryptedBody: "",
  }
}

function parseMarkdownMetadata(text: string): MarkdownFileMetadata {
  const metadata: MarkdownFileMetadata = {}

  for (const line of text.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (key === "id") {
      metadata.id = value
    } else if (key === "title") {
      metadata.title = value
    } else if (key === "date") {
      metadata.date = value
    } else if (key === "version") {
      const version = Number(value)
      if (Number.isFinite(version)) {
        metadata.version = version
      }
    }
  }

  return metadata
}

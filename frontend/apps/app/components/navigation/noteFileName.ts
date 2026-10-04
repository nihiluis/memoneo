import type { Note } from "@memoneo/shared"

export function getNoteFileName(note: Note) {
  return `${note.file?.title ?? (note.title || "Untitled")}.md`
}

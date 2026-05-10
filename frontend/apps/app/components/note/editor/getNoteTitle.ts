import type { Note } from "@memoneo/shared"

export function getNoteTitle(note: Note | null) {
  return note?.file?.title ?? note?.title ?? ""
}

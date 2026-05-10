import type { Note } from "@memoneo/shared"
import { atom } from "jotai"

export const selectedNoteIdAtom = atom<string>("")
export const selectedFolderIdAtom = atom<string>("")

const selectedNoteValueAtom = atom<Note | null>(null)

export const selectedNoteAtom = atom(
  get => get(selectedNoteValueAtom),
  (_get, set, note: Note | null) => {
    set(selectedNoteValueAtom, note)
    set(selectedFolderIdAtom, note ? getNoteParentFolderId(note) : "")
  }
)

function getNoteParentFolderId(note: Note) {
  return note.file?.path?.trim().split(/[\\/]/).filter(Boolean).join("/") ?? ""
}

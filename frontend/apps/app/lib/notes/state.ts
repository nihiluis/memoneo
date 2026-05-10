import type { Note } from "@memoneo/shared"
import { atom } from "jotai"

export const selectedNoteIdAtom = atom<string>("")
export const selectedNoteAtom = atom<Note | null>(null)
export const selectedFolderIdAtom = atom<string>("")

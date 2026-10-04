import type { Note } from "@memoneo/shared"
import type { NoteOptionsSheetProps } from "./NoteOptionsSheet"
export type WebNoteOptionsDialogProps = Omit<NoteOptionsSheetProps, "note"> & {
  note: Note | null
  onClose: () => void
}
export function WebNoteOptionsDialog(_props: WebNoteOptionsDialogProps) {
  return null
}

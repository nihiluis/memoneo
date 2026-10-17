export type DraftSnapshot = {
  noteId: string
  title: string
  body: string
}

export function draftsEqual(a: DraftSnapshot, b: DraftSnapshot) {
  return a.noteId === b.noteId && a.title === b.title && a.body === b.body
}

export function isDraftDirty(
  savedDraft: DraftSnapshot | null,
  currentDraft: DraftSnapshot | null,
) {
  return !!savedDraft && !!currentDraft && !draftsEqual(savedDraft, currentDraft)
}

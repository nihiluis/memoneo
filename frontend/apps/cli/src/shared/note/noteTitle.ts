import { Note } from "./index.js"

export function limitTitleLength(title: string): string {
  if (title.length >= 19) {
    return title.substring(0, 16) + "..."
  }
  return title
}


export function formatNoteDate(note: Note): string {
  const date = new Date(note.updated_at)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}
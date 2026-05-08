import { Note } from "./index.js"

export function limitTitleLength(title: string): string {
  if (title.length >= 19) {
    return title.substring(0, 16) + "..."
  }
  return title
}


export function formatNoteDate(note: Note): string {
  const dateOnlyMatch = note.date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return `${day}-${month}-${year}`
  }

  const date = new Date(note.date)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

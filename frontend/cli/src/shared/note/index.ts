export interface Note {
  id: string
  date: string
  body: string
  archived: boolean
  version: number
  title: string
  file?: NoteFileData
  user_id: string
  updated_at: string
}

export interface NoteFileData {
  title: string
  path: string
  note_id?: string
}

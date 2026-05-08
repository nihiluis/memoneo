import { and, eq, inArray, sql as drizzleSql } from "drizzle-orm"
import { z } from "zod"
import { db } from "./db/index.js"
import { noteFileData, notes } from "./db/schema.js"

export const noteInputSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  title: z.string().min(1),
  body: z.string(),
  body_iv: z.string(),
  date: z.string(),
  archived: z.boolean().default(false),
  version: z.number().int().positive().default(1),
})

export const noteFileDataSchema = z.object({
  title: z.string().min(1),
  path: z.string().min(1),
  note_id: z.string().uuid().optional(),
})

export type NoteInput = z.input<typeof noteInputSchema>
export type NoteFileDataInput = z.input<typeof noteFileDataSchema>

export function serializeNote(row: any) {
  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    body: row.body,
    body_iv: row.bodyIv,
    date: row.date?.toISOString?.() ?? row.date,
    archived: row.archived,
    version: row.version,
    created_at: row.createdAt?.toISOString?.() ?? row.createdAt,
    updated_at: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    file: row.file
      ? {
          note_id: row.file.noteId,
          title: row.file.title,
          path: row.file.path,
        }
      : undefined,
  }
}

export function toNoteRow(input: NoteInput, userId: string) {
  return {
    id: input.id,
    userId,
    title: input.title,
    body: input.body,
    bodyIv: input.body_iv,
    date: new Date(input.date),
    archived: input.archived ?? false,
    version: input.version ?? 1,
    updatedAt: new Date(),
  }
}

export async function listNotes(userId: string) {
  const rows = await db.query.notes.findMany({
    where: and(eq(notes.userId, userId), eq(notes.archived, false)),
    with: { file: true },
  })
  return rows.map(serializeNote)
}

export async function listNoteIds(userId: string) {
  return db
    .select({ id: notes.id, title: notes.title })
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.archived, false)))
}

export async function upsertNotes(userId: string, inputs: NoteInput[]) {
  if (inputs.length === 0) {
    return []
  }

  const rows = inputs.map(input => toNoteRow(input, userId))
  const returning = await db
    .insert(notes)
    .values(rows)
    .onConflictDoUpdate({
      target: notes.id,
      set: {
        title: drizzleSql`excluded.title`,
        body: drizzleSql`excluded.body`,
        bodyIv: drizzleSql`excluded.body_iv`,
        date: drizzleSql`excluded.date`,
        archived: drizzleSql`excluded.archived`,
        version: drizzleSql`excluded.version`,
        updatedAt: new Date(),
      },
    })
    .returning()

  return returning.map(serializeNote)
}

export async function updateNote(userId: string, id: string, input: Partial<NoteInput>) {
  const returning = await db
    .update(notes)
    .set({
      title: input.title,
      body: input.body,
      bodyIv: input.body_iv,
      date: input.date ? new Date(input.date) : undefined,
      archived: input.archived,
      version: input.version,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning()

  return returning[0] ? serializeNote(returning[0]) : null
}

export async function archiveNote(userId: string, id: string, archived = true) {
  return updateNote(userId, id, { archived })
}

export async function archiveNotes(userId: string, ids: string[]) {
  if (ids.length === 0) {
    return []
  }
  return db
    .update(notes)
    .set({ archived: true, updatedAt: new Date() })
    .where(and(eq(notes.userId, userId), inArray(notes.id, ids)))
    .returning({ id: notes.id })
}

export async function deleteNotes(userId: string, ids: string[]) {
  if (ids.length === 0) {
    return []
  }

  const ownedNotes = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.userId, userId), inArray(notes.id, ids)))
  const ownedIds = ownedNotes.map(note => note.id)
  if (ownedIds.length === 0) {
    return []
  }

  await db
    .delete(noteFileData)
    .where(inArray(noteFileData.noteId, ownedIds))

  return db
    .delete(notes)
    .where(and(eq(notes.userId, userId), inArray(notes.id, ownedIds)))
    .returning({ id: notes.id })
}

export async function upsertNoteFile(userId: string, noteId: string, input: NoteFileDataInput) {
  const owned = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1)
  if (!owned[0]) {
    return null
  }

  const returning = await db
    .insert(noteFileData)
    .values({ noteId, title: input.title, path: input.path })
    .onConflictDoUpdate({
      target: noteFileData.noteId,
      set: { title: input.title, path: input.path },
    })
    .returning()
  return returning[0]
}

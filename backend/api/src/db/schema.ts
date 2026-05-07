import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  bodyIv: text("body_iv").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  archived: boolean("archived").notNull().default(false),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const noteFileData = pgTable("note_file_data", {
  noteId: uuid("note_id").primaryKey().references(() => notes.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  path: text("path").notNull(),
})

export const notesRelations = relations(notes, ({ one }) => ({
  file: one(noteFileData, {
    fields: [notes.id],
    references: [noteFileData.noteId],
  }),
}))

export const noteFileDataRelations = relations(noteFileData, ({ one }) => ({
  note: one(notes, {
    fields: [noteFileData.noteId],
    references: [notes.id],
  }),
}))

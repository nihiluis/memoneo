import { Elysia } from "elysia"
import { swagger } from "@elysiajs/swagger"
import { PORT } from "./env.js"
import { verifyAuthorization } from "./auth.js"
import {
  archiveNote,
  archiveNotes,
  deleteNotes,
  listNoteIds,
  listNotes,
  noteFileDataSchema,
  noteInputSchema,
  updateNote,
  upsertNoteFile,
  upsertNotes,
} from "./notes.js"

const requireUser = async (headers: Record<string, string | undefined>) => {
  try {
    return await verifyAuthorization(headers.authorization)
  } catch {
    throw new Response(JSON.stringify({ message: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
  }
}

const app = new Elysia()
  .use(swagger({ path: "/openapi" }))
  .get("/health", () => ({ status: "ok" }))
  .get("/", () => ({ status: "ok" }))
  .get("/notes", async ({ headers }: any) => {
    const { userId } = await requireUser(headers)
    const notes = await listNotes(userId)
    return { note: notes, notes }
  })
  .get("/notes/ids", async ({ headers }: any) => {
    const { userId } = await requireUser(headers)
    const ids = await listNoteIds(userId)
    return { note: ids, notes: ids }
  })
  .post("/notes/bulk", async ({ headers, body }: any) => {
    const { userId } = await requireUser(headers)
    const parsed = noteInputSchema.array().parse(Array.isArray(body) ? body : (body as any).inputs)
    const inserted = await upsertNotes(userId, parsed)
    return { insert_note: { returning: inserted }, notes: inserted }
  })
  .put("/note", async ({ headers, body }: any) => {
    const { userId } = await requireUser(headers)
    const parsed = noteInputSchema.parse(body)
    const inserted = await upsertNotes(userId, [parsed])
    return { insert_note: { returning: inserted }, notes: inserted }
  })
  .put("/notes/:id", async ({ headers, params, body }: any) => {
    const { userId } = await requireUser(headers)
    const parsed = noteInputSchema.partial().parse(body)
    const note = await updateNote(userId, params.id, parsed)
    if (!note) return new Response(null, { status: 404 })
    return { update_note_by_pk: note, note }
  })
  .patch("/notes/:id/archive", async ({ headers, params, body }: any) => {
    const { userId } = await requireUser(headers)
    const note = await archiveNote(userId, params.id, (body as any)?.archived ?? true)
    if (!note) return new Response(null, { status: 404 })
    return { update_note_by_pk: note, note }
  })
  .delete("/notes", async ({ headers, body }: any) => {
    const { userId } = await requireUser(headers)
    const ids = zIds(body)
    const deleted = await deleteNotes(userId, ids)
    return { delete_note: { returning: deleted }, notes: deleted }
  })
  .post("/notes/archive", async ({ headers, body }: any) => {
    const { userId } = await requireUser(headers)
    const archived = await archiveNotes(userId, zIds(body))
    return { update_note: { returning: archived }, notes: archived }
  })
  .put("/notes/:id/file", async ({ headers, params, body }: any) => {
    const { userId } = await requireUser(headers)
    const parsed = noteFileDataSchema.parse(body)
    const file = await upsertNoteFile(userId, params.id, parsed)
    if (!file) return new Response(null, { status: 404 })
    return { insert_note_file_data: { returning: [file] }, file }
  })
  .listen(PORT)

console.log(
  `Running at ${app.server?.hostname}:${app.server?.port}`
)

function zIds(body: unknown) {
  const ids = (body as any)?.ids
  if (!Array.isArray(ids) || !ids.every(id => typeof id === "string")) {
    throw new Response(JSON.stringify({ message: "ids must be an array of strings" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }
  return ids
}

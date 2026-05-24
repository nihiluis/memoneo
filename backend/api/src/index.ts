import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Elysia, t } from "elysia"
import { openapi } from "@elysia/openapi"
import { node } from "@elysiajs/node"
import { PORT } from "./env.js"
import { verifyAuthorization } from "./auth.js"
import { createLogger } from "./logger.js"
import {
  archiveNote,
  archiveNotes,
  deleteNotes,
  listNoteIds,
  listNotes,
  updateNote,
  upsertNoteFile,
  upsertNotes,
} from "./notes.js"

const logger = createLogger()

const authHeadersSchema = t.Object({
  authorization: t.Optional(t.String()),
})

const noteIdParamsSchema = t.Object({
  id: t.String({ format: "uuid" }),
})

const noteFileDataSchemaBody = t.Object({
  title: t.String({ minLength: 1 }),
  path: t.String({ minLength: 1 }),
  note_id: t.Optional(t.String({ format: "uuid" })),
})

const noteInputSchemaBody = t.Object({
  id: t.String({ format: "uuid" }),
  user_id: t.Optional(t.String({ format: "uuid" })),
  title: t.String({ minLength: 1 }),
  body: t.String(),
  body_iv: t.String(),
  date: t.String(),
  archived: t.Optional(t.Boolean()),
  version: t.Optional(t.Number({ minimum: 1 })),
})

const idsBodySchema = t.Object({
  ids: t.Array(t.String({ format: "uuid" })),
})

const noteFileDataResponseSchema = t.Object({
  note_id: t.Optional(t.String()),
  title: t.String(),
  path: t.String(),
})

const noteResponseSchema = t.Object({
  id: t.String(),
  user_id: t.String(),
  title: t.String(),
  body: t.String(),
  body_iv: t.String(),
  date: t.String(),
  archived: t.Boolean(),
  version: t.Number(),
  created_at: t.String(),
  updated_at: t.String(),
  file: t.Optional(noteFileDataResponseSchema),
})

const noteIdResponseSchema = t.Object({
  id: t.String(),
  title: t.String(),
})

const deletedNoteResponseSchema = t.Object({
  id: t.String(),
})

const okResponse = { status: "ok" } as const

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

export const app = new Elysia({ adapter: node() })
  .use(openapi({ path: "/openapi" }))
  .onError(({ code, error, request, set }) => {
    logger.error(
      {
        err: error,
        code,
        status: set.status,
        method: request.method,
        url: request.url,
      },
      "request failed"
    )
  })
  .get("/health", () => okResponse, {
    response: t.Object({ status: t.Literal("ok") }),
  })
  .get("/", () => okResponse, {
    response: t.Object({ status: t.Literal("ok") }),
  })
  .get("/notes", async ({ headers }) => {
    const { userId } = await requireUser(headers)
    const notes = await listNotes(userId)
    return notes
  }, {
    headers: authHeadersSchema,
    response: t.Array(noteResponseSchema),
  })
  .get("/notes/ids", async ({ headers }) => {
    const { userId } = await requireUser(headers)
    const ids = await listNoteIds(userId)
    return ids
  }, {
    headers: authHeadersSchema,
    response: t.Array(noteIdResponseSchema),
  })
  .post("/notes/bulk", async ({ headers, body }) => {
    const { userId } = await requireUser(headers)
    const inserted = await upsertNotes(userId, body)
    return inserted
  }, {
    headers: authHeadersSchema,
    body: t.Array(noteInputSchemaBody),
    response: t.Array(noteResponseSchema),
  })
  .put("/note", async ({ headers, body }) => {
    const { userId } = await requireUser(headers)
    const inserted = await upsertNotes(userId, [body])
    return inserted[0]
  }, {
    headers: authHeadersSchema,
    body: noteInputSchemaBody,
    response: noteResponseSchema,
  })
  .put("/notes/:id", async ({ headers, params, body, set }) => {
    const { userId } = await requireUser(headers)
    const note = await updateNote(userId, params.id, body)
    if (!note) {
      set.status = 404
      return null
    }
    return note
  }, {
    headers: authHeadersSchema,
    params: noteIdParamsSchema,
    body: t.Partial(noteInputSchemaBody),
    response: {
      200: noteResponseSchema,
      404: t.Null(),
    },
  })
  .patch("/notes/:id/archive", async ({ headers, params, body, set }) => {
    const { userId } = await requireUser(headers)
    const note = await archiveNote(userId, params.id, body.archived ?? true)
    if (!note) {
      set.status = 404
      return null
    }
    return note
  }, {
    headers: authHeadersSchema,
    params: noteIdParamsSchema,
    body: t.Object({
      archived: t.Optional(t.Boolean()),
    }),
    response: {
      200: noteResponseSchema,
      404: t.Null(),
    },
  })
  .delete("/notes", async ({ headers, body }) => {
    const { userId } = await requireUser(headers)
    return deleteNotes(userId, body.ids)
  }, {
    headers: authHeadersSchema,
    body: idsBodySchema,
    response: t.Array(deletedNoteResponseSchema),
  })
  .post("/notes/archive", async ({ headers, body }) => {
    const { userId } = await requireUser(headers)
    return archiveNotes(userId, body.ids)
  }, {
    headers: authHeadersSchema,
    body: idsBodySchema,
    response: t.Array(deletedNoteResponseSchema),
  })
  .put("/notes/:id/file", async ({ headers, params, body, set }) => {
    const { userId } = await requireUser(headers)
    const file = await upsertNoteFile(userId, params.id, body)
    if (!file) {
      set.status = 404
      return null
    }
    return {
      note_id: file.noteId,
      title: file.title,
      path: file.path,
    }
  }, {
    headers: authHeadersSchema,
    params: noteIdParamsSchema,
    body: noteFileDataSchemaBody,
    response: {
      200: noteFileDataResponseSchema,
      404: t.Null(),
    },
  })

const isEntrypoint =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])

if (isEntrypoint) {
  app.listen(Number(PORT))

  console.log(`Running at http://localhost:${PORT}`)
}

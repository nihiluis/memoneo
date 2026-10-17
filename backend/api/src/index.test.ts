import { describe, expect, test } from "vitest"
import { app } from "./index.js"
import { noteFileDataSchema } from "./notes.js"

describe("notes route validation", () => {
  test("accepts an empty path for root-level note files", async () => {
    const file = { title: "Root note", path: "" }

    expect(noteFileDataSchema.parse(file)).toEqual(file)

    const response = await app.handle(
      new Request("http://localhost/notes/00000000-0000-4000-8000-000000000001/file", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(file),
      })
    )

    // Valid input reaches authentication instead of failing body validation.
    expect(response.status).toBe(401)
  })

  test("rejects malformed UUIDs when deleting notes", async () => {
    const response = await app.handle(
      new Request("http://localhost/notes", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ids: ["not-a-uuid"],
        }),
      })
    )

    expect(response.status).toBe(422)
  })
})

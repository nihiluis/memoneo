import { describe, expect, test } from "vitest"
import { app } from "./index.js"

describe("notes route validation", () => {
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

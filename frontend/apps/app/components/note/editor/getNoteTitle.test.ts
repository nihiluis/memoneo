import { describe, expect, it } from "vitest"

import { getNoteTitle } from "./getNoteTitle"

describe("getNoteTitle", () => {
  it("prefers the local file title", () => {
    expect(
      getNoteTitle({
        id: "note-1",
        title: "Remote title",
        file: { title: "Local title", path: "" },
      } as never)
    ).toBe("Local title")
  })

  it("falls back through note title and empty string", () => {
    expect(getNoteTitle({ title: "Remote title" } as never)).toBe("Remote title")
    expect(getNoteTitle(null)).toBe("")
  })
})

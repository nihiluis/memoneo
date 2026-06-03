import { describe, expect, it } from "vitest"

import { normalizeNoteBody } from "./markdownInputMode"

describe("normalizeNoteBody", () => {
  it("converts escaped newline sequences to actual line breaks", () => {
    expect(normalizeNoteBody("## Goals\\n- robotics\\r\\n- drones")).toBe(
      "## Goals\n- robotics\n- drones"
    )
  })

  it("leaves existing line breaks intact", () => {
    expect(normalizeNoteBody("## Goals\n- robotics")).toBe(
      "## Goals\n- robotics"
    )
  })

  it("does not rewrite escaped sequences when the body already has line breaks", () => {
    expect(normalizeNoteBody("```ts\nconst value = \"\\n\"\n```")).toBe(
      "```ts\nconst value = \"\\n\"\n```"
    )
  })
})

import { describe, expect, it } from "vitest"

import {
  escapeMarkdownForPlainEditing,
  normalizeNoteBody,
  shouldEditAsPlainMarkdown,
} from "./markdownInputMode"

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

describe("shouldEditAsPlainMarkdown", () => {
  it("detects unsupported block markdown", () => {
    expect(shouldEditAsPlainMarkdown("## Goals\n- robotics")).toBe(true)
    expect(shouldEditAsPlainMarkdown("## Goals\n-❌ robotics")).toBe(true)
    expect(shouldEditAsPlainMarkdown("1. robotics")).toBe(true)
  })

  it("allows inline-only markdown to use enriched serialization", () => {
    expect(shouldEditAsPlainMarkdown("Some **bold** text")).toBe(false)
  })
})

describe("escapeMarkdownForPlainEditing", () => {
  it("escapes block markers so the enriched input displays raw markdown", () => {
    expect(escapeMarkdownForPlainEditing("## Goals\n- robotics\n1. drones")).toBe(
      "\\## Goals\n\\- robotics\n\\1. drones"
    )
    expect(escapeMarkdownForPlainEditing("-❌ robotics")).toBe("\\-❌ robotics")
  })
})

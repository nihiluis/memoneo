import { describe, expect, it } from "vitest"

import {
  isSelectionInBoldMarkdown,
  parseBoldMarkdownSegments,
  toggleBoldMarkdown,
} from "./boldMarkdown"

describe("parseBoldMarkdownSegments", () => {
  it("keeps markdown markers visible and bolds only wrapped text", () => {
    expect(parseBoldMarkdownSegments("Some **bold** text")).toEqual([
      { bold: false, text: "Some " },
      { bold: false, text: "**" },
      { bold: true, text: "bold" },
      { bold: false, text: "**" },
      { bold: false, text: " text" },
    ])
  })

  it("leaves unmatched markdown as bold text after the opening marker", () => {
    expect(parseBoldMarkdownSegments("Some **bold")).toEqual([
      { bold: false, text: "Some " },
      { bold: false, text: "**" },
      { bold: true, text: "bold" },
    ])
  })
})

describe("isSelectionInBoldMarkdown", () => {
  it("detects whether the cursor is inside paired bold markers", () => {
    expect(
      isSelectionInBoldMarkdown("Some **bold** text", { start: 8, end: 8 })
    ).toBe(true)
    expect(
      isSelectionInBoldMarkdown("Some **bold** text", { start: 15, end: 15 })
    ).toBe(false)
  })
})

describe("toggleBoldMarkdown", () => {
  it("wraps the selected text with bold markers", () => {
    expect(toggleBoldMarkdown("Some text", { start: 5, end: 9 })).toEqual({
      body: "Some **text**",
      selection: { start: 7, end: 11 },
    })
  })

  it("places the cursor between inserted markers when no text is selected", () => {
    expect(toggleBoldMarkdown("Some text", { start: 5, end: 5 })).toEqual({
      body: "Some ****text",
      selection: { start: 7, end: 7 },
    })
  })

  it("unwraps text that is already directly surrounded by bold markers", () => {
    expect(toggleBoldMarkdown("Some **text**", { start: 7, end: 11 })).toEqual({
      body: "Some text",
      selection: { start: 5, end: 9 },
    })
  })
})

import { describe, expect, it } from "vitest"

import {
  DEFAULT_MARKDOWN_TOOLBAR_HEIGHT,
  EDITOR_BASE_BOTTOM_PADDING,
  MARKDOWN_TOOLBAR_GAP,
  getEditorBottomPadding,
} from "./editorInsets"

describe("getEditorBottomPadding", () => {
  it("reserves space for the default toolbar and its gap", () => {
    expect(getEditorBottomPadding(0, 0)).toBe(
      EDITOR_BASE_BOTTOM_PADDING +
        DEFAULT_MARKDOWN_TOOLBAR_HEIGHT +
        MARKDOWN_TOOLBAR_GAP,
    )
  })

  it("uses the measured toolbar height and bottom inset", () => {
    expect(getEditorBottomPadding(72, 8)).toBe(
      EDITOR_BASE_BOTTOM_PADDING + 72 + MARKDOWN_TOOLBAR_GAP + 8,
    )
  })

  it("does not reduce clearance for smaller measurements or invalid insets", () => {
    expect(getEditorBottomPadding(24, -10)).toBe(
      EDITOR_BASE_BOTTOM_PADDING +
        DEFAULT_MARKDOWN_TOOLBAR_HEIGHT +
        MARKDOWN_TOOLBAR_GAP,
    )
  })
})

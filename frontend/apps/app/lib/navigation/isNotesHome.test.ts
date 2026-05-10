import { describe, expect, it } from "vitest"

import { isFocusedRouteNotesHome } from "./isNotesHome"

describe("isFocusedRouteNotesHome", () => {
  it("is true for tabs group only (index as default)", () => {
    expect(isFocusedRouteNotesHome(["(tabs)"])).toBe(true)
  })

  it("is true for explicit index segment", () => {
    expect(isFocusedRouteNotesHome(["(tabs)", "index"])).toBe(true)
  })

  it("is false for other tab screens", () => {
    expect(isFocusedRouteNotesHome(["(tabs)", "settings"])).toBe(false)
    expect(isFocusedRouteNotesHome(["(tabs)", "records"])).toBe(false)
  })

  it("is false outside tabs", () => {
    expect(isFocusedRouteNotesHome([])).toBe(false)
    expect(isFocusedRouteNotesHome(["auth", "login"])).toBe(false)
  })
})

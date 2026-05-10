import { describe, expect, it } from "vitest"

import { cn } from "./utils"

describe("cn", () => {
  it("merges conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("px-2 text-sm", false && "hidden", "px-4")).toBe("text-sm px-4")
  })
})

import React from "react"
import { describe, expect, it } from "vitest"

import { testingLibrary } from "../../test/react-native-testing"

const { Input } = await import("./Input")
const { render } = testingLibrary

describe("Input", () => {
  it("renders a text input with the default placeholder color", () => {
    const result = render(<Input placeholder="Email" value="pablo@example.com" />)

    const input = result.UNSAFE_getByType("TextInput")
    expect(input.props.placeholder).toBe("Email")
    expect(input.props.placeholderTextColor).toBe("#71717a")
  })

  it("marks non-editable inputs visually disabled", () => {
    const result = render(<Input editable={false} />)

    expect(result.UNSAFE_getByType("TextInput").props.className).toContain(
      "opacity-50"
    )
  })
})

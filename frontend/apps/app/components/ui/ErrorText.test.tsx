import React from "react"
import { describe, expect, it } from "vitest"

import { testingLibrary } from "../../test/react-native-testing"

const { ErrorText } = await import("./ErrorText")
const { render } = testingLibrary

describe("ErrorText", () => {
  it("renders destructive text with custom classes preserved", () => {
    const result = render(<ErrorText className="mt-2">Required</ErrorText>)

    const text = result.getByText("Required")
    expect(text.props.className).toContain("font-medium")
    expect(text.props.className).toContain("text-destructive")
    expect(text.props.className).toContain("mt-2")
  })
})

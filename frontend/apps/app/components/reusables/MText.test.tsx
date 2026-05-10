import React from "react"
import { describe, expect, it } from "vitest"

import { testingLibrary } from "../../test/react-native-testing"

const { MText, TextClassContext } = await import("./MText")
const { render } = testingLibrary

describe("MText", () => {
  it("merges default, context, and explicit class names", () => {
    const result = render(
      <TextClassContext.Provider value="font-semibold text-red-500">
        <MText className="text-blue-500">Label</MText>
      </TextClassContext.Provider>
    )

    const text = result.getByText("Label")
    expect(text.props.className).toContain("text-base")
    expect(text.props.className).toContain("font-semibold")
    expect(text.props.className).toContain("text-blue-500")
    expect(text.props.className).not.toContain("text-red-500")
  })
})

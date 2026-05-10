import React from "react"
import { describe, expect, it, vi } from "vitest"

import { testingLibrary } from "../../test/react-native-testing"

const { MText } = await import("./MText")
const { Button } = await import("./Button")
const { fireEvent, render } = testingLibrary

describe("Button", () => {
  it("renders children and calls onPress", () => {
    const onPress = vi.fn()

    const result = render(
      <Button onPress={onPress}>
        <MText>Save</MText>
      </Button>
    )

    fireEvent.press(result.getByText("Save"))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it("disables presses when marked disabled", () => {
    const onPress = vi.fn()

    const result = render(
      <Button isDisabled onPress={onPress}>
        <MText>Save</MText>
      </Button>
    )

    expect(result.UNSAFE_getByType("Pressable").props.disabled).toBe(true)
  })
})

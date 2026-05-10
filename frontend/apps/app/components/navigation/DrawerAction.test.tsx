import React from "react"
import { describe, expect, it, vi } from "vitest"

import { testingLibrary } from "../../test/react-native-testing"

const { DrawerAction } = await import("./DrawerAction")
const { fireEvent, render } = testingLibrary

describe("DrawerAction", () => {
  it("renders a button and calls onPress", () => {
    const onPress = vi.fn()
    const result = render(
      <DrawerAction icon={<React.Fragment />} label="Sync" onPress={onPress} />
    )

    fireEvent.press(result.getByText("Sync"))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it("is disabled when no onPress is supplied", () => {
    const result = render(<DrawerAction icon={<React.Fragment />} label="Sync" />)

    expect(result.UNSAFE_getByType("Pressable").props.disabled).toBe(true)
  })
})

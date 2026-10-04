import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { testingLibrary } from "../react-native-testing"

const { auth } = vi.hoisted(() => ({
  auth: { isAuthenticated: false, error: "" },
}))

vi.mock("@/lib/auth/state", () => ({
  authAtom: "auth",
  tokenAtom: "token",
}))
vi.mock("jotai", () => ({
  useAtom: (atom: string) => [atom === "auth" ? auth : "", vi.fn()],
}))
vi.mock("@/lib/auth/api", () => ({ apiLogin: vi.fn() }))
vi.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => ({ colorScheme: "dark" }),
}))
vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ isPending: false, mutate: vi.fn() }),
}))
vi.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: vi.fn() }),
}))
vi.mock("@/components/Logo", () => ({ default: () => null }))

const { default: LoginScreen } = await import("../../app/auth/login")
const { render } = testingLibrary

describe("LoginScreen", () => {
  beforeEach(() => {
    auth.error = ""
  })

  it("does not pass raw text to a View when there is no auth error", () => {
    const result = render(<LoginScreen />)

    // Inspect props because the renderer can omit empty text nodes from its tree.
    for (const view of result.UNSAFE_getAllByType("View")) {
      const children = React.Children.toArray(view.props.children)
      expect(children.filter(child => typeof child === "string")).toEqual([])
    }
    expect(result.getByText("Sign In")).toBeTruthy()
  })

  it("renders an auth error inside Text", () => {
    auth.error = "Sign in failed."
    const result = render(<LoginScreen />)

    expect(result.getByText("Sign in failed.").type).toBe("Text")
  })
})

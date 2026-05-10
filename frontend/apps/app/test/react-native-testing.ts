import { createRequire } from "node:module"

import { vi } from "vitest"

import * as reactNativeMock from "./mocks/react-native"

const iconMock = new Proxy(
  {},
  {
    get: () => {
      const React = require("react")
      return ({ testID = "icon" }: { testID?: string }) =>
        React.createElement(reactNativeMock.Text, { testID }, "icon")
    },
  }
)

const require = createRequire(import.meta.url)
const Module = require("module") as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown
}

const originalLoad = Module._load

Module._load = function loadWithReactNativeMock(
  request: string,
  parent: unknown,
  isMain: boolean
) {
  if (request === "react-native") {
    return reactNativeMock
  }
  if (request === "lucide-react-native") {
    return iconMock
  }
  return originalLoad.call(this, request, parent, isMain)
}

vi.doMock("react-native", () => reactNativeMock)
vi.doMock("lucide-react-native", () => iconMock)

export const testingLibrary = await import("@testing-library/react-native")

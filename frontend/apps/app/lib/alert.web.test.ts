import { afterEach, describe, expect, it, vi } from "vitest"
import { Alert } from "./alert.web"

afterEach(() => vi.unstubAllGlobals())
describe("browser confirmations", () => {
  it.each([true, false])(
    "resolves the matching callback when confirmation is %s",
    accepted => {
      const proceed = vi.fn()
      const cancel = vi.fn()
      vi.stubGlobal("window", { confirm: vi.fn(() => accepted) })
      Alert.alert("Overwrite?", "This replaces local changes.", [
        { text: "Cancel", style: "cancel", onPress: cancel },
        { text: "Overwrite", style: "destructive", onPress: proceed },
      ])
      expect(proceed).toHaveBeenCalledTimes(accepted ? 1 : 0)
      expect(cancel).toHaveBeenCalledTimes(accepted ? 0 : 1)
    }
  )
})

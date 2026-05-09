import { useCallback } from "react"
import { Uniwind, useUniwind } from "uniwind"

export function useColorScheme() {
  const { theme } = useUniwind()
  const colorScheme = theme === "light" ? "light" : "dark"
  const setColorScheme = useCallback((value: "light" | "dark" | "system") => {
    Uniwind.setTheme(value)
  }, [])
  const toggleColorScheme = useCallback(() => {
    Uniwind.setTheme(colorScheme === "dark" ? "light" : "dark")
  }, [colorScheme])

  return {
    colorScheme,
    isDarkColorScheme: colorScheme === "dark",
    setColorScheme,
    toggleColorScheme,
  }
}

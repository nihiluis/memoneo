import * as React from "react"
import { View } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import { THEME_COLORS } from "@/constants/theme"

interface MRootViewProps {
  children?: React.ReactNode
}

export default function MRootView({ children }: MRootViewProps) {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme === "light" ? "light" : "dark"

  return (
    <View
      className="flex-1 justify-center p-4"
      style={{ backgroundColor: THEME_COLORS[theme].background }}
    >
      {children}
    </View>
  )
}

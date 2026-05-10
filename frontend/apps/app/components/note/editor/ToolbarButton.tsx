import type React from "react"
import { Pressable } from "react-native"

type ToolbarButtonProps = {
  accessibilityLabel: string
  active?: boolean
  children: React.ReactNode
  onPress: () => void
}

export function ToolbarButton({
  accessibilityLabel,
  active,
  children,
  onPress,
}: ToolbarButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={[
        "h-10 w-10 items-center justify-center rounded-md",
        active ? "bg-muted" : "bg-transparent",
      ].join(" ")}
      onPress={onPress}>
      {children}
    </Pressable>
  )
}

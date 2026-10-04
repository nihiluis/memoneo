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
      accessibilityState={{ selected: !!active }}
      className={[
        "h-10 w-10 items-center justify-center rounded-full hover:bg-background focus:bg-background active:bg-background web:cursor-pointer",
        active ? "bg-background" : "bg-transparent",
      ].join(" ")}
      onPress={onPress}>
      {children}
    </Pressable>
  )
}

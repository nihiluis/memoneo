import type React from "react"
import { Pressable } from "react-native"

import { MText } from "@/components/reusables/MText"

type DrawerActionProps = {
  disabled?: boolean
  icon: React.ReactNode
  label: string
  onPress?: () => void
}

export function DrawerAction({
  disabled = false,
  icon,
  label,
  onPress,
}: DrawerActionProps) {
  const isDisabled = disabled || !onPress

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={`flex-1 items-center gap-1.5 rounded-md px-1 py-2.5 ${
        disabled ? "opacity-50" : ""
      }`}>
      {icon}
      <MText className="text-center text-xs font-medium text-zinc-300">
        {label}
      </MText>
    </Pressable>
  )
}

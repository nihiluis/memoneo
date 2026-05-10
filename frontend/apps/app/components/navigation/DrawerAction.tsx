import type React from "react"
import { Pressable, StyleSheet } from "react-native"

import { MText } from "@/components/reusables/MText"

type DrawerActionProps = {
  icon: React.ReactNode
  label: string
  onPress?: () => void
}

export function DrawerAction({ icon, label, onPress }: DrawerActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={styles.drawerAction}>
      {icon}
      <MText style={styles.drawerActionText}>{label}</MText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  drawerAction: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    gap: 6,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  drawerActionText: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
})

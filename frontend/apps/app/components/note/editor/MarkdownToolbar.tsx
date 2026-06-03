import { Bold } from "lucide-react-native"
import { StyleSheet, View } from "react-native"

import { ToolbarButton } from "./ToolbarButton"

type MarkdownToolbarProps = {
  boldActive?: boolean
  bottomInset: number
  onToggleBold: () => void
}

export function MarkdownToolbar({
  boldActive,
  bottomInset,
  onToggleBold,
}: MarkdownToolbarProps) {
  return (
    <View
      className="px-4"
      pointerEvents="box-none"
      style={[styles.toolbar, { bottom: bottomInset + TOOLBAR_GAP }]}>
      <View className="flex-row items-center justify-center gap-1 rounded-full bg-muted px-4 py-2">
        <ToolbarButton
          accessibilityLabel="Bold"
          active={boldActive}
          onPress={onToggleBold}>
          <Bold size={18} color={boldActive ? "#f8fafc" : "#a1a1aa"} />
        </ToolbarButton>
      </View>
    </View>
  )
}

const TOOLBAR_GAP = 12

const styles = StyleSheet.create({
  toolbar: {
    position: "absolute",
    right: 0,
    left: 0,
    zIndex: 1,
  },
})

import { Bold } from "lucide-react-native"
import { StyleSheet, View, type LayoutChangeEvent } from "react-native"

import { ToolbarButton } from "./ToolbarButton"
import { MARKDOWN_TOOLBAR_GAP } from "./editorInsets"

type MarkdownToolbarProps = {
  boldActive?: boolean
  bottomInset: number
  onLayout?: (event: LayoutChangeEvent) => void
  onToggleBold: () => void
}

export function MarkdownToolbar({
  boldActive,
  bottomInset,
  onLayout,
  onToggleBold,
}: MarkdownToolbarProps) {
  return (
    <View
      className="items-center px-4"
      onLayout={onLayout}
      pointerEvents="box-none"
      style={[styles.toolbar, { bottom: bottomInset + MARKDOWN_TOOLBAR_GAP }]}
    >
      <View className="flex-row items-center justify-center gap-1 rounded-full border border-border bg-muted px-4 py-2">
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

const styles = StyleSheet.create({
  toolbar: {
    position: "absolute",
    right: 0,
    left: 0,
    zIndex: 1,
  },
})

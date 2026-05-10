import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from "lucide-react-native"
import type React from "react"
import { StyleSheet, View } from "react-native"
import type {
  EnrichedMarkdownTextInputInstance,
  StyleState,
} from "react-native-enriched-markdown"

import { ToolbarButton } from "./ToolbarButton"

type MarkdownToolbarProps = {
  bottomInset: number
  editorRef: React.RefObject<EnrichedMarkdownTextInputInstance | null>
  styleState: StyleState | null
}

export function MarkdownToolbar({
  bottomInset,
  editorRef,
  styleState,
}: MarkdownToolbarProps) {
  return (
    <View
      className="px-4"
      pointerEvents="box-none"
      style={[styles.toolbar, { bottom: bottomInset + TOOLBAR_GAP }]}>
      <View className="flex-row items-center justify-center gap-1 rounded-full bg-muted px-4 py-2">
        <ToolbarButton
          accessibilityLabel="Bold"
          active={styleState?.bold.isActive}
          onPress={() => editorRef.current?.toggleBold()}>
          <Bold
            size={18}
            color={styleState?.bold.isActive ? "#f8fafc" : "#a1a1aa"}
          />
        </ToolbarButton>
        <ToolbarButton
          accessibilityLabel="Italic"
          active={styleState?.italic.isActive}
          onPress={() => editorRef.current?.toggleItalic()}>
          <Italic
            size={18}
            color={styleState?.italic.isActive ? "#f8fafc" : "#a1a1aa"}
          />
        </ToolbarButton>
        <ToolbarButton
          accessibilityLabel="Underline"
          active={styleState?.underline.isActive}
          onPress={() => editorRef.current?.toggleUnderline()}>
          <Underline
            size={18}
            color={styleState?.underline.isActive ? "#f8fafc" : "#a1a1aa"}
          />
        </ToolbarButton>
        <ToolbarButton
          accessibilityLabel="Strikethrough"
          active={styleState?.strikethrough.isActive}
          onPress={() => editorRef.current?.toggleStrikethrough()}>
          <Strikethrough
            size={18}
            color={styleState?.strikethrough.isActive ? "#f8fafc" : "#a1a1aa"}
          />
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

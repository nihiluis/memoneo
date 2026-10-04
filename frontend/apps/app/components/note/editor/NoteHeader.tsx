import { useEffect } from "react"
import type { Note } from "@memoneo/shared"
import { Menu, Save } from "lucide-react-native"
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native"
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { MText } from "@/components/reusables/MText"
import { useAppDrawer } from "@/components/navigation/AppDrawer"
import { useColorScheme } from "@/hooks/useColorScheme"

type NoteHeaderProps = {
  note: Note | null
  title: string
  onChangeTitle: (title: string) => void
  onSave: () => void
  hasUnsavedChanges: boolean
  saveDisabled?: boolean
}

export function NoteHeader({
  note,
  title,
  onChangeTitle,
  onSave,
  hasUnsavedChanges,
  saveDisabled = false,
}: NoteHeaderProps) {
  useEffect(() => {
    if (Platform.OS !== "web") return
    const save = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault()
        if (!saveDisabled) onSave()
      }
    }
    window.addEventListener("keydown", save)
    return () => window.removeEventListener("keydown", save)
  }, [onSave, saveDisabled])
  const { openDrawer } = useAppDrawer()
  const { colorScheme } = useColorScheme()
  const saveStatusProgress = useSharedValue(hasUnsavedChanges ? 0 : 1)
  useEffect(() => {
    saveStatusProgress.value = withTiming(hasUnsavedChanges ? 0 : 1, {
      duration: 220,
    })
  }, [hasUnsavedChanges, saveStatusProgress])
  const saveStatusStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      saveStatusProgress.value,
      [0, 1],
      ["#fee2e2", "#dbeafe"],
    ),
    borderColor: interpolateColor(
      saveStatusProgress.value,
      [0, 1],
      ["#fecaca", "#bfdbfe"],
    ),
  }))
  const saveStatusDotStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      saveStatusProgress.value,
      [0, 1],
      ["#f87171", "#3b82f6"],
    ),
  }))
  const saveColor = saveDisabled ? "#52525b" : "#a1a1aa"
  const cursorColor = "#94a3b8"
  const selectionColor =
    colorScheme === "dark"
      ? "rgba(51, 65, 85, 0.72)"
      : "rgba(148, 163, 184, 0.36)"

  return (
    <View
      className="h-14 flex-row items-center border-b border-border bg-background px-4"
      style={styles.header}
    >
      <Pressable
        accessibilityLabel="Open navigation"
        accessibilityRole="button"
        className="mr-3 h-10 w-10 items-center justify-center rounded-md hover:bg-accent focus:bg-accent active:bg-accent web:cursor-pointer"
        onPress={openDrawer}
      >
        <Menu size={24} color="#a1a1aa" />
      </Pressable>
      <TextInput
        autoComplete="off"
        autoCorrect={false}
        className="min-w-0 flex-1 p-0 text-2xl font-semibold text-foreground"
        style={{ flexShrink: 1 }}
        editable={!!note}
        onChangeText={onChangeTitle}
        placeholder="Untitled"
        placeholderTextColor="#71717a"
        cursorColor={cursorColor}
        selectionColor={selectionColor}
        selectionHandleColor={cursorColor}
        spellCheck={false}
        value={title}
      />
      <Animated.View
        accessibilityLabel={hasUnsavedChanges ? "Unsaved changes" : "Saved"}
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        className="mr-2 flex-row items-center justify-center rounded-full"
        pointerEvents="none"
        style={[styles.saveStatus, saveStatusStyle]}
      >
        <Animated.View style={[styles.saveStatusDot, saveStatusDotStyle]} />
        <MText className="text-xs font-medium text-foreground" numberOfLines={1}>
          {hasUnsavedChanges ? "Unsaved changes" : "Saved"}
        </MText>
      </Animated.View>
      <Pressable
        accessibilityLabel="Save note"
        accessibilityRole="button"
        className={[
          "ml-2 h-10 flex-row items-center justify-center gap-1.5 rounded-md px-3",
          !saveDisabled && "hover:bg-accent focus:bg-accent web:cursor-pointer",
        ].filter(Boolean).join(" ")}
        disabled={saveDisabled}
        hitSlop={8}
        onPress={() => {
          if (__DEV__) {
            console.log("NoteHeader save press", {
              disabled: saveDisabled,
              noteId: note?.id,
            })
          }
          onSave()
        }}
        style={({ pressed }) => [
          styles.saveButton,
          saveDisabled && styles.saveButtonDisabled,
          pressed && !saveDisabled && styles.saveButtonPressed,
        ]}
      >
        <Save size={20} color={saveColor} />
        <MText
          className={[
            "text-sm font-medium",
            saveDisabled ? "text-muted-foreground/50" : "text-muted-foreground",
          ].join(" ")}
        >
          Save
        </MText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    elevation: 2,
    position: "relative",
    zIndex: 2,
  },
  saveButton: {
    transform: [{ scale: 1 }],
  },
  saveStatus: {
    width: 124,
    height: 28,
    flexShrink: 0,
    paddingHorizontal: 9,
    borderWidth: 1,
    gap: 6,
  },
  saveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonPressed: {
    backgroundColor: "#27272a",
    transform: [{ scale: 0.96 }],
  },
})

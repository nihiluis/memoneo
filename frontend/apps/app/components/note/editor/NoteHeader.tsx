import type { Note } from "@memoneo/shared"
import { Menu, Save } from "lucide-react-native"
import { Pressable, StyleSheet, TextInput, View } from "react-native"

import { MText } from "@/components/reusables/MText"
import { useAppDrawer } from "@/components/navigation/AppDrawer"
import { useColorScheme } from "@/hooks/useColorScheme"

type NoteHeaderProps = {
  note: Note | null
  title: string
  onChangeTitle: (title: string) => void
  onSave: () => void
  saveDisabled?: boolean
}

export function NoteHeader({
  note,
  title,
  onChangeTitle,
  onSave,
  saveDisabled = false,
}: NoteHeaderProps) {
  const { openDrawer } = useAppDrawer()
  const { colorScheme } = useColorScheme()
  const saveColor = saveDisabled ? "#52525b" : "#a1a1aa"
  const cursorColor = "#94a3b8"
  const selectionColor =
    colorScheme === "dark"
      ? "rgba(51, 65, 85, 0.72)"
      : "rgba(148, 163, 184, 0.36)"

  return (
    <View className="h-14 flex-row items-center border-b border-border px-4">
      <Pressable
        accessibilityRole="button"
        className="mr-3 h-10 w-10 items-center justify-center rounded-md"
        onPress={openDrawer}>
        <Menu size={24} color="#a1a1aa" />
      </Pressable>
      <TextInput
        autoComplete="off"
        autoCorrect={false}
        className="flex-1 p-0 text-2xl font-semibold text-foreground"
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
      <Pressable
        accessibilityLabel="Save note"
        accessibilityRole="button"
        className="ml-2 h-10 flex-row items-center justify-center gap-1.5 rounded-md px-3"
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
        ]}>
        <Save size={20} color={saveColor} />
        <MText
          className={[
            "text-sm font-medium",
            saveDisabled ? "text-muted-foreground/50" : "text-muted-foreground",
          ].join(" ")}>
          Save
        </MText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  saveButton: {
    transform: [{ scale: 1 }],
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonPressed: {
    backgroundColor: "#27272a",
    transform: [{ scale: 0.96 }],
  },
})

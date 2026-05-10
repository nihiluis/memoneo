import type { Note } from "@memoneo/shared"
import { Menu, Save } from "lucide-react-native"
import { Pressable, TextInput, View } from "react-native"

import { MText } from "@/components/reusables/MText"
import { useAppDrawer } from "@/components/navigation/AppDrawer"

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

  return (
    <View className="h-14 flex-row items-center border-b border-border px-4">
      <Pressable
        accessibilityRole="button"
        className="mr-3 h-10 w-10 items-center justify-center rounded-md"
        onPress={openDrawer}>
        <Menu size={24} color="#a1a1aa" />
      </Pressable>
      <TextInput
        className="flex-1 p-0 text-2xl font-semibold text-foreground"
        editable={!!note}
        onChangeText={onChangeTitle}
        placeholder="Untitled"
        placeholderTextColor="#71717a"
        value={title}
      />
      <Pressable
        accessibilityLabel="Save note"
        accessibilityRole="button"
        className="ml-2 h-10 flex-row items-center justify-center gap-1.5 rounded-md px-3 opacity-100 disabled:opacity-40"
        disabled={saveDisabled}
        onPress={onSave}>
        <Save size={20} color="#a1a1aa" />
        <MText className="text-sm font-medium text-muted-foreground">Save</MText>
      </Pressable>
    </View>
  )
}

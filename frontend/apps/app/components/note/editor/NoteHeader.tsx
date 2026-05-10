import type { Note } from "@memoneo/shared"
import { Menu } from "lucide-react-native"
import { Pressable, TextInput, View } from "react-native"

import { useAppDrawer } from "@/components/navigation/AppDrawer"

type NoteHeaderProps = {
  note: Note | null
  title: string
  onChangeTitle: (title: string) => void
  onBlurTitle?: () => void
}

export function NoteHeader({
  note,
  title,
  onChangeTitle,
  onBlurTitle,
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
        onBlur={onBlurTitle}
        onChangeText={onChangeTitle}
        placeholder="Untitled"
        placeholderTextColor="#71717a"
        value={title}
      />
    </View>
  )
}

import { Check, FileText } from "lucide-react-native"
import { Pressable, View } from "react-native"
import { MText } from "@/components/reusables/MText"
import type { TransferNote } from "@/lib/notes/transfer"

export function TransferNoteRow({
  note,
  checked,
  disabled,
  onPress,
}: {
  note: TransferNote
  checked: boolean
  disabled: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={note.title}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-20 flex-row items-center gap-4 border-b border-border px-5 py-4 hover:bg-muted/40 ${
        checked ? "bg-muted/40" : "bg-background"
      }`}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded border ${
          checked ? "border-foreground" : "border-border"
        }`}
      >
        {checked && <Check size={14} color="#71717a" strokeWidth={3} />}
      </View>
      <FileText size={20} color="#71717a" strokeWidth={1.5} />
      <View className="flex-1 gap-1">
        <MText numberOfLines={1} className="font-medium">
          {note.title}
        </MText>
        <MText numberOfLines={1} className="text-xs text-muted-foreground">
          {note.path || "Root folder"} · {note.location}
        </MText>
      </View>
    </Pressable>
  )
}

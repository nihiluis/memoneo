import { X } from "lucide-react-native"
import { Modal, Pressable, View } from "react-native"
import { NoteOptionsSheet } from "./NoteOptionsSheet"
import type { WebNoteOptionsDialogProps } from "./WebNoteOptionsDialog"

export function WebNoteOptionsDialog({
  note,
  onClose,
  ...props
}: WebNoteOptionsDialogProps) {
  return (
    <Modal transparent visible={!!note} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 p-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
          onPress={onClose}
          className="absolute inset-0 web:cursor-pointer"
        />
        <View className="w-full max-w-md rounded-xl bg-zinc-900 p-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            className="self-end items-center justify-center rounded-md p-2 hover:bg-zinc-800 focus:bg-zinc-800 active:bg-zinc-700 web:cursor-pointer"
          >
            <X size={20} color="#f4f4f5" />
          </Pressable>
          {note && <NoteOptionsSheet {...props} note={note} />}
        </View>
      </View>
    </Modal>
  )
}

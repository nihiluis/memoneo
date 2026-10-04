import { Modal, Pressable, View } from "react-native"
import { MText } from "@/components/reusables/MText"
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
        <View className="w-full max-w-md rounded-xl bg-zinc-900 p-4">
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            className="self-end p-2"
          >
            <MText className="text-zinc-100">Close</MText>
          </Pressable>
          {note && <NoteOptionsSheet {...props} note={note} />}
        </View>
      </View>
    </Modal>
  )
}

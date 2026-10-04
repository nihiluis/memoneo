import { serializeMarkdownNote, type Note } from "@memoneo/shared"
import { Download } from "lucide-react-native"
import { Pressable } from "react-native"

import { MText } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"
import { downloadBlob } from "@/lib/web/download"
import { getNoteFileName } from "./noteFileName"

export function ExportNoteAction({ note }: { note: Note }) {
  const disabled = note.id === "unsaved"

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        if (disabled) return
        downloadBlob(
          new Blob([serializeMarkdownNote(note, note.decryptedBody ?? note.body)], {
            type: "text/markdown;charset=utf-8",
          }),
          getNoteFileName(note)
        )
      }}
      className={cn(
        "min-h-12 flex-row items-center justify-center gap-2 rounded-md border border-zinc-700 px-3.5",
        disabled
          ? "opacity-50 web:cursor-not-allowed"
          : "hover:bg-zinc-800 focus:bg-zinc-800 active:bg-zinc-700 web:cursor-pointer"
      )}
    >
      <Download size={18} color="#a1a1aa" />
      <MText className="text-[15px] font-bold text-zinc-100">Export note</MText>
    </Pressable>
  )
}

import type { Note } from "@memoneo/shared"
import { FileText, RefreshCw, Trash2, Upload } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { MText } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"
import type { SingleNoteSyncAction } from "@/lib/notes/sync"

import { ExportNoteAction } from "./ExportNoteAction"
import { getNoteFileName } from "./noteFileName"

import { NoteDetailsTable } from "./NoteDetailsTable"

export { getNoteFileName } from "./noteFileName"

export type NoteOptionsSheetProps = {
  isAuthenticated: boolean
  isDeleting: boolean
  isSyncing: boolean
  lastSync?: string
  note: Note
  onDelete: (note: Note) => void
  onSync: (note: Note, action: SingleNoteSyncAction) => void
}

export function NoteOptionsSheet({
  isAuthenticated,
  isDeleting,
  isSyncing,
  lastSync,
  note,
  onDelete,
  onSync,
}: NoteOptionsSheetProps) {
  const canDelete = Boolean(note.file?.title)
  const canSync = note.id !== "unsaved" && Boolean(note.file?.title)

  return (
    <View className="flex-1 gap-2 px-5 pb-6 pt-2">
      <View className="flex-row items-center gap-3">
        <FileText size={22} color="#fafafa" />
        <View className="min-w-0 flex-1 gap-0">
          <MText numberOfLines={1} className="text-xs text-zinc-400">
            {getNoteDirectory(note)}
          </MText>
          <MText numberOfLines={1} className="text-xl font-bold text-zinc-50">
            {getNoteFileName(note)}
          </MText>
        </View>
      </View>

      <NoteDetailsTable note={note} lastSync={lastSync} />

      {isAuthenticated && (
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            disabled={!canSync || isSyncing}
            onPress={() => onSync(note, "upload")}
            className={cn(
              "min-h-12 flex-row items-center justify-center gap-2 rounded-md border border-zinc-700 px-3.5",
              !canSync || isSyncing
                ? "opacity-50 web:cursor-not-allowed"
                : "hover:bg-zinc-800 focus:bg-zinc-800 active:bg-zinc-700 web:cursor-pointer"
            )}
          >
            <Upload size={18} color="#a1a1aa" />
            <MText className="text-[15px] font-bold text-zinc-100">
              {isSyncing ? "Syncing..." : "Upload note"}
            </MText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!canSync || isSyncing}
            onPress={() => onSync(note, "sync")}
            className={cn(
              "min-h-12 flex-row items-center justify-center gap-2 rounded-md border border-zinc-700 px-3.5",
              !canSync || isSyncing
                ? "opacity-50 web:cursor-not-allowed"
                : "hover:bg-zinc-800 focus:bg-zinc-800 active:bg-zinc-700 web:cursor-pointer"
            )}
          >
            <RefreshCw size={18} color="#a1a1aa" />
            <MText className="text-[15px] font-bold text-zinc-100">
              {isSyncing ? "Syncing..." : "Sync note"}
            </MText>
          </Pressable>
        </View>
      )}

      <ExportNoteAction note={note} />

      <Pressable
        accessibilityRole="button"
        disabled={!canDelete || isDeleting}
        onPress={() => onDelete(note)}
        className={cn(
          "min-h-12 flex-row items-center justify-center gap-2 rounded-md border border-red-900 px-3.5",
          !canDelete || isDeleting
            ? "opacity-50 web:cursor-not-allowed"
            : "hover:bg-red-950 focus:bg-red-950 active:bg-red-900 web:cursor-pointer"
        )}
      >
        <Trash2 size={18} color="#f87171" />
        <MText className="text-[15px] font-bold text-red-400">
          {isDeleting ? "Deleting..." : "Delete note"}
        </MText>
      </Pressable>
    </View>
  )
}

function getNoteDirectory(note: Note) {
  return note.file?.path || "Unfiled"
}

import type { Note } from "@memoneo/shared"
import { FileText, RefreshCw, Trash2, Upload } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { MText } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"
import type { SingleNoteSyncAction } from "@/lib/notes/sync"

type NoteOptionsSheetProps = {
  isDeleting: boolean
  isSyncing: boolean
  lastSync?: string
  note: Note
  onDelete: (note: Note) => void
  onSync: (note: Note, action: SingleNoteSyncAction) => void
}

export function NoteOptionsSheet({
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
      <View className="flex-row items-center gap-0">
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

      <View className="gap-1 pb-3.5">
        <MText numberOfLines={1} className="text-xs text-zinc-400">
          Created {formatDateTime(note.created_at)}
        </MText>
        <MText numberOfLines={1} className="text-xs text-zinc-400">
          Modified {formatDateTime(note.updated_at)}
        </MText>
        <MText numberOfLines={1} className="text-xs text-zinc-400">
          Last sync {lastSync ? formatDateTime(lastSync) : "Not synced"}
        </MText>
      </View>

      <View className="gap-2">
        <Pressable
          accessibilityRole="button"
          disabled={!canSync || isSyncing}
          onPress={() => onSync(note, "upload")}
          className={cn(
            "min-h-12 flex-row items-center justify-center gap-2 rounded-md border border-zinc-700 px-3.5",
            (!canSync || isSyncing) && "opacity-50"
          )}>
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
            (!canSync || isSyncing) && "opacity-50"
          )}>
          <RefreshCw size={18} color="#a1a1aa" />
          <MText className="text-[15px] font-bold text-zinc-100">
            {isSyncing ? "Syncing..." : "Sync note"}
          </MText>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canDelete || isDeleting}
        onPress={() => onDelete(note)}
        className={cn(
          "min-h-12 flex-row items-center justify-center gap-2 rounded-md border border-red-900 px-3.5",
          (!canDelete || isDeleting) && "opacity-50"
        )}>
        <Trash2 size={18} color="#f87171" />
        <MText className="text-[15px] font-bold text-red-400">
          {isDeleting ? "Deleting..." : "Delete note"}
        </MText>
      </Pressable>
    </View>
  )
}

export function getNoteFileName(note: Note) {
  return `${note.file?.title ?? (note.title || "Untitled")}.md`
}

function getNoteDirectory(note: Note) {
  return note.file?.path || "Unfiled"
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Unknown"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

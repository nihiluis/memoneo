import type { Note } from "@memoneo/shared"
import {
  ChevronDown,
  ChevronRight,
  Folder,
} from "lucide-react-native"
import { Pressable } from "react-native"

import { MText } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"

import { getNoteTitle, type TreeRow } from "./noteTree"

type NoteTreeRowProps = {
  expanded: boolean
  item: TreeRow
  onOpenNoteOptions: (note: Note) => void
  onSelectNote: (noteId: string) => void
  onToggleFolder: (folderId: string) => void
  selectedNoteId: string
}

export function NoteTreeRow({
  expanded,
  item,
  onOpenNoteOptions,
  onSelectNote,
  onToggleFolder,
  selectedNoteId,
}: NoteTreeRowProps) {
  if (item.kind === "folder") {
    const Chevron = expanded ? ChevronDown : ChevronRight
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onToggleFolder(item.folder.id)}
        className="mt-1 min-h-10 flex-row items-center gap-2 rounded-md px-2 py-2"
        style={{ paddingLeft: getTreePadding(item.depth) }}>
        <Chevron size={16} color="#a1a1aa" />
        <Folder size={18} color="#a1a1aa" />
        <MText numberOfLines={1} className="flex-1 font-semibold text-zinc-200">
          {item.folder.name}
        </MText>
      </Pressable>
    )
  }

  const selected = item.note.id === selectedNoteId

  return (
    <Pressable
      accessibilityRole="button"
      onLongPress={() => onOpenNoteOptions(item.note)}
      onPress={() => onSelectNote(item.note.id)}
      className={cn(
        "min-h-10 flex-row items-center rounded-md px-2 py-2",
        selected && "bg-zinc-800"
      )}
      style={{ paddingLeft: getTreePadding(item.depth) }}>
      <MText
        numberOfLines={1}
        className={cn(
          "flex-1 text-zinc-300",
          selected && "font-semibold text-zinc-50"
        )}>
        {getNoteTitle(item.note)}
      </MText>
    </Pressable>
  )
}

function getTreePadding(depth: number) {
  return 8 + Math.min(depth, 8) * 16
}

import type { Note } from "@memoneo/shared"
import {
  ChevronDown,
  ChevronRight,
  Folder,
} from "lucide-react-native"
import { Pressable, View } from "react-native"

import { MText } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"

import { getNoteTitle, type TreeRow } from "./noteTree"

type NoteTreeRowProps = {
  expanded: boolean
  item: TreeRow
  onOpenNoteOptions: (note: Note) => void
  onSelectFolder: (folderId: string) => void
  onSelectNote: (noteId: string) => void
  onToggleFolder: (folderId: string) => void
  selectedFolderId: string
  selectedNoteId: string
}

export function NoteTreeRow({
  expanded,
  item,
  onOpenNoteOptions,
  onSelectFolder,
  onSelectNote,
  onToggleFolder,
  selectedFolderId,
  selectedNoteId,
}: NoteTreeRowProps) {
  if (item.kind === "folder") {
    const Chevron = expanded ? ChevronDown : ChevronRight
    const selected = item.folder.id === selectedFolderId
    return (
      <View
        className={cn(
          "mt-1 min-h-10 flex-row items-center rounded-md border border-transparent py-1",
          selected && "border-zinc-500"
        )}
        style={{ paddingLeft: getTreePadding(item.depth) }}>
        <Pressable
          accessibilityLabel={expanded ? "Collapse folder" : "Expand folder"}
          accessibilityRole="button"
          className="h-8 w-8 items-center justify-center"
          onPress={() => onToggleFolder(item.folder.id)}>
          <Chevron size={16} color="#a1a1aa" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectFolder(item.folder.id)}
          className="min-h-8 flex-1 flex-row items-center gap-2 pr-2">
          <Folder size={18} color={selected ? "#f8fafc" : "#a1a1aa"} />
          <MText
            numberOfLines={1}
            className={cn(
              "flex-1 font-semibold text-zinc-200",
              selected && "text-zinc-50"
            )}>
            {item.folder.name}
          </MText>
        </Pressable>
      </View>
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

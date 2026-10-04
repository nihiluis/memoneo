import type { Note } from "@memoneo/shared"
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Ellipsis,
} from "lucide-react-native"
import { memo } from "react"
import { Platform, Pressable, View } from "react-native"

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

function NoteTreeRowComponent({
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
        style={{ paddingLeft: getTreePadding(item.depth) }}
      >
        <Pressable
          accessibilityLabel={expanded ? "Collapse folder" : "Expand folder"}
          accessibilityRole="button"
          className="h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-500/25 focus:bg-zinc-500/25 active:bg-zinc-500/40 web:cursor-pointer"
          onPress={() => onToggleFolder(item.folder.id)}
        >
          <Chevron size={16} color="#a1a1aa" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectFolder(item.folder.id)}
          className="min-h-8 flex-1 flex-row items-center gap-2 rounded-md pr-2 hover:bg-zinc-500/25 focus:bg-zinc-500/25 active:bg-zinc-500/40 web:cursor-pointer"
        >
          <Folder size={18} color={selected ? "#f8fafc" : "#a1a1aa"} />
          <MText
            numberOfLines={1}
            className={cn(
              "flex-1 font-semibold text-foreground",
              selected && "text-foreground"
            )}
          >
            {item.folder.name}
          </MText>
        </Pressable>
      </View>
    )
  }

  const selected = item.note.id === selectedNoteId

  return (
    <View
      className={cn(
        "min-h-10 flex-row items-center rounded-md pr-2 web:hover:bg-zinc-500/25 web:focus-within:bg-zinc-500/25 web:active:bg-zinc-500/40",
        selected && "bg-muted web:hover:bg-zinc-500/40 web:focus-within:bg-zinc-500/40"
      )}
      style={{ paddingLeft: getTreePadding(item.depth) }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={getNoteTitle(item.note)}
        accessibilityState={{ selected }}
        onLongPress={() => onOpenNoteOptions(item.note)}
        onPress={() => onSelectNote(item.note.id)}
        className="min-h-10 flex-1 justify-center rounded-md py-2 web:cursor-pointer"
      >
        <MText
          numberOfLines={1}
          className="text-foreground"
        >
          {getNoteTitle(item.note)}
        </MText>
      </Pressable>
      {Platform.OS === "web" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${getNoteTitle(item.note)}`}
          className="h-8 w-8 items-center justify-center rounded-md hover:opacity-80 focus:opacity-80 active:opacity-60 web:cursor-pointer"
          onPress={() => onOpenNoteOptions(item.note)}
        >
          <Ellipsis size={18} color="#a1a1aa" />
        </Pressable>
      )}
    </View>
  )
}

function getTreePadding(depth: number) {
  return 8 + Math.min(depth, 8) * 16
}

export const NoteTreeRow = memo(
  NoteTreeRowComponent,
  (prevProps, nextProps) => {
    if (prevProps.item.kind !== nextProps.item.kind) {
      return false
    }

    if (
      prevProps.expanded !== nextProps.expanded ||
      prevProps.item.id !== nextProps.item.id ||
      prevProps.item.depth !== nextProps.item.depth ||
      prevProps.selectedFolderId !== nextProps.selectedFolderId ||
      prevProps.selectedNoteId !== nextProps.selectedNoteId ||
      prevProps.onOpenNoteOptions !== nextProps.onOpenNoteOptions ||
      prevProps.onSelectFolder !== nextProps.onSelectFolder ||
      prevProps.onSelectNote !== nextProps.onSelectNote ||
      prevProps.onToggleFolder !== nextProps.onToggleFolder
    ) {
      return false
    }

    if (prevProps.item.kind === "folder" && nextProps.item.kind === "folder") {
      return (
        prevProps.item.folder.id === nextProps.item.folder.id &&
        prevProps.item.folder.name === nextProps.item.folder.name
      )
    }

    if (prevProps.item.kind === "note" && nextProps.item.kind === "note") {
      return (
        prevProps.item.note.id === nextProps.item.note.id &&
        prevProps.item.note.title === nextProps.item.note.title &&
        prevProps.item.note.file?.title === nextProps.item.note.file?.title &&
        prevProps.item.note.file?.path === nextProps.item.note.file?.path
      )
    }

    return false
  }
)

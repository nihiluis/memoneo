import type { Note } from "@memoneo/shared"
import {
  ChevronDown,
  ChevronRight,
  Folder,
} from "lucide-react-native"
import { Pressable, StyleSheet } from "react-native"

import { MText } from "@/components/reusables/MText"

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
        style={[
          styles.treeItem,
          styles.folderItem,
          { paddingLeft: getTreePadding(item.depth) },
        ]}>
        <Chevron size={16} color="#a1a1aa" />
        <Folder size={18} color="#a1a1aa" />
        <MText numberOfLines={1} style={styles.folderText}>
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
      style={[
        styles.treeItem,
        selected && styles.selectedNote,
        { paddingLeft: getTreePadding(item.depth) },
      ]}>
      <MText
        numberOfLines={1}
        style={[styles.noteText, selected && styles.selectedNoteText]}>
        {getNoteTitle(item.note)}
      </MText>
    </Pressable>
  )
}

function getTreePadding(depth: number) {
  return 8 + Math.min(depth, 8) * 16
}

const styles = StyleSheet.create({
  folderItem: {
    gap: 8,
    marginTop: 4,
  },
  folderText: {
    color: "#e4e4e7",
    flex: 1,
    fontWeight: "600",
  },
  noteText: {
    color: "#d4d4d8",
    flex: 1,
  },
  selectedNote: {
    backgroundColor: "#27272a",
  },
  selectedNoteText: {
    color: "#fafafa",
    fontWeight: "600",
  },
  treeItem: {
    alignItems: "center",
    borderRadius: 6,
    flexDirection: "row",
    minHeight: 38,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
})

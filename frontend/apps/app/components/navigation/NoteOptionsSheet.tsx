import type { Note } from "@memoneo/shared"
import { FileText, Trash2 } from "lucide-react-native"
import { Pressable, StyleSheet, View } from "react-native"

import { MText } from "@/components/reusables/MText"

type NoteOptionsSheetProps = {
  isDeleting: boolean
  lastSync?: string
  note: Note
  onDelete: (note: Note) => void
}

export function NoteOptionsSheet({
  isDeleting,
  lastSync,
  note,
  onDelete,
}: NoteOptionsSheetProps) {
  const canDelete = Boolean(note.file?.title)

  return (
    <View style={styles.sheetInner}>
      <View style={styles.sheetHeader}>
        <FileText size={22} color="#fafafa" />
        <View style={styles.sheetTitleGroup}>
          <MText numberOfLines={1} style={styles.sheetDirectory}>
            {getNoteDirectory(note)}
          </MText>
          <MText numberOfLines={1} style={styles.sheetTitle}>
            {getNoteFileName(note)}
          </MText>
        </View>
      </View>

      <View style={styles.compactMetadata}>
        <MText numberOfLines={1} style={styles.compactMetadataText}>
          Created {formatDateTime(note.created_at)}
        </MText>
        <MText numberOfLines={1} style={styles.compactMetadataText}>
          Modified {formatDateTime(note.updated_at)}
        </MText>
        <MText numberOfLines={1} style={styles.compactMetadataText}>
          Last sync {lastSync ? formatDateTime(lastSync) : "Not synced"}
        </MText>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canDelete || isDeleting}
        onPress={() => onDelete(note)}
        style={[
          styles.deleteAction,
          (!canDelete || isDeleting) && styles.disabledAction,
        ]}>
        <Trash2 size={18} color="#f87171" />
        <MText style={styles.deleteActionText}>
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

const styles = StyleSheet.create({
  compactMetadata: {
    borderBottomColor: "#27272a",
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
    paddingBottom: 14,
  },
  compactMetadataText: {
    color: "#a1a1aa",
    fontSize: 12,
  },
  deleteAction: {
    alignItems: "center",
    borderColor: "#7f1d1d",
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  deleteActionText: {
    color: "#f87171",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledAction: {
    opacity: 0.5,
  },
  sheetDirectory: {
    color: "#a1a1aa",
    fontSize: 12,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  sheetInner: {
    flex: 1,
    gap: 18,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sheetTitle: {
    color: "#fafafa",
    fontSize: 20,
    fontWeight: "700",
  },
  sheetTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
})

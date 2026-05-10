import { FlashList } from "@shopify/flash-list"
import type { Note } from "@memoneo/shared"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import { memo, useCallback, useEffect, useMemo } from "react"
import { StyleSheet, View } from "react-native"

import { MText } from "@/components/reusables/MText"
import { useNoteFoldersQuery } from "@/lib/notes/query"
import {
  drawerExpandedFolderIdsAtom,
  selectedFolderIdAtom,
  selectedNoteIdAtom,
  useNotesState,
} from "@/lib/notes/state"

import { useAppDrawer } from "./appDrawerContext"
import { NoteTreeRow } from "./NoteTreeRow"
import {
  buildNoteTree,
  flattenVisibleTree,
  getSelectedFolderIds,
  setsAreEqual,
  type NoteTreeNode,
  type TreeRow,
} from "./noteTree"

const EMPTY_TREE: NoteTreeNode = { id: "", name: "root", folders: [], notes: [] }
const EMPTY_ROWS: TreeRow[] = []

type DrawerNoteTreeListProps = {
  onOpenNoteOptions: (note: Note) => void
}

function DrawerNoteTreeListComponent({
  onOpenNoteOptions,
}: DrawerNoteTreeListProps) {
  const router = useRouter()
  const { closeDrawer, drawerOpen } = useAppDrawer()
  const notesState = useNotesState()
  const foldersQuery = useNoteFoldersQuery()
  const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom)
  const [selectedFolderId, setSelectedFolderId] = useAtom(selectedFolderIdAtom)
  const [expandedFolderIds, setExpandedFolderIds] = useAtom(
    drawerExpandedFolderIdsAtom
  )

  const notes = notesState.notes
  const folderPaths = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data])
  const noteTree = useMemo(() => {
    if (!drawerOpen) {
      return EMPTY_TREE
    }
    return buildNoteTree(notes, folderPaths)
  }, [drawerOpen, folderPaths, notes])

  const selectedFolderIds = useMemo(
    () => getSelectedFolderIds(notes, selectedNoteId),
    [notes, selectedNoteId]
  )
  const selectedFolderIdSet = useMemo(
    () => new Set(selectedFolderIds),
    [selectedFolderIds]
  )

  const visibleRows = useMemo(() => {
    if (!drawerOpen) {
      return EMPTY_ROWS
    }
    return flattenVisibleTree(noteTree, expandedFolderIds)
  }, [drawerOpen, noteTree, expandedFolderIds])

  useEffect(() => {
    if (selectedFolderIds.length === 0) {
      return
    }

    setExpandedFolderIds((current: Set<string>) => {
      const next = new Set(current)
      selectedFolderIds.forEach(folderId => next.add(folderId))
      return setsAreEqual(current, next) ? current : next
    })
  }, [selectedFolderIds, setExpandedFolderIds])

  const selectNote = useCallback(
    (noteId: string) => {
      setSelectedNoteId(noteId)
      closeDrawer()
      router.push("/")
    },
    [closeDrawer, router, setSelectedNoteId]
  )

  const selectFolder = useCallback(
    (folderId: string) => {
      setSelectedFolderId(folderId)
      setExpandedFolderIds((current: Set<string>) => {
        if (current.has(folderId)) {
          return current
        }
        const next = new Set(current)
        next.add(folderId)
        return next
      })
    },
    [setExpandedFolderIds, setSelectedFolderId]
  )

  const toggleFolder = useCallback(
    (folderId: string) => {
      setExpandedFolderIds((current: Set<string>) => {
        const next = new Set(current)
        if (next.has(folderId)) {
          if (selectedFolderIdSet.has(folderId)) {
            return current
          }
          next.delete(folderId)
        } else {
          next.add(folderId)
        }
        return next
      })
    },
    [selectedFolderIdSet, setExpandedFolderIds]
  )

  const renderTreeRow = useCallback(
    ({ item }: { item: TreeRow }) => (
      <NoteTreeRow
        expanded={
          item.kind === "folder" && expandedFolderIds.has(item.folder.id)
        }
        item={item}
        onOpenNoteOptions={onOpenNoteOptions}
        onSelectFolder={selectFolder}
        onSelectNote={selectNote}
        onToggleFolder={toggleFolder}
        selectedFolderId={selectedFolderId}
        selectedNoteId={selectedNoteId}
      />
    ),
    [
      expandedFolderIds,
      onOpenNoteOptions,
      selectFolder,
      selectNote,
      selectedFolderId,
      selectedNoteId,
      toggleFolder,
    ]
  )

  const extraData = useMemo(
    () => ({
      expandedFolderIds,
      selectedFolderId,
      selectedNoteId,
    }),
    [expandedFolderIds, selectedFolderId, selectedNoteId]
  )

  const isLoading = notesState.isLoading || foldersQuery.isLoading

  return (
    <View style={styles.flex}>
      {notes.length === 0 && !isLoading && (
        <MText className="px-2 text-zinc-400">No notes found.</MText>
      )}
      <FlashList
        contentContainerStyle={{ paddingBottom: 8 }}
        data={visibleRows}
        extraData={extraData}
        keyExtractor={item => item.id}
        renderItem={renderTreeRow}
        showsVerticalScrollIndicator={false}
        style={styles.flex}
      />
    </View>
  )
}

export const DrawerNoteTreeList = memo(DrawerNoteTreeListComponent)

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
})

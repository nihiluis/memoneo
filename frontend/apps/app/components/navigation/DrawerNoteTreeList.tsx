import { FlashList, type FlashListRef } from "@shopify/flash-list"
import type { Note } from "@memoneo/shared"
import { useRouter, useSegments } from "expo-router"
import { useAtom } from "jotai"
import { memo, useCallback, useEffect, useMemo, useRef } from "react"
import { Platform, StyleSheet, View } from "react-native"

import { MText } from "@/components/reusables/MText"
import { isFocusedRouteNotesHome } from "@/lib/navigation/isNotesHome"
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
  const segments = useSegments()
  const { closeDrawer, drawerOpen } = useAppDrawer()
  const notesState = useNotesState()
  const foldersQuery = useNoteFoldersQuery()
  const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom)
  const [selectedFolderId, setSelectedFolderId] = useAtom(selectedFolderIdAtom)
  const [expandedFolderIds, setExpandedFolderIds] = useAtom(
    drawerExpandedFolderIdsAtom
  )

  const highlightedNoteId = isFocusedRouteNotesHome(segments) ? selectedNoteId : ""

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

  const visibleRows = useMemo(() => {
    if (!drawerOpen) {
      return EMPTY_ROWS
    }
    return flattenVisibleTree(noteTree, expandedFolderIds)
  }, [drawerOpen, noteTree, expandedFolderIds])

  const revealedSelection = useRef("")
  useEffect(() => {
    const selectionKey = JSON.stringify([selectedNoteId, selectedFolderIds])
    if (revealedSelection.current === selectionKey) return
    revealedSelection.current = selectionKey
    if (selectedFolderIds.length === 0) {
      return
    }

    setExpandedFolderIds((current: Set<string>) => {
      const next = new Set(current)
      selectedFolderIds.forEach(folderId => next.add(folderId))
      return setsAreEqual(current, next) ? current : next
    })
  }, [selectedNoteId, selectedFolderIds, setExpandedFolderIds])

  const selectNote = useCallback(
    (noteId: string) => {
      console.log("selectNote", noteId)
      setSelectedNoteId(noteId)
      closeDrawer()
      if (!isFocusedRouteNotesHome(segments)) {
        router.push(Platform.OS === "web" ? { pathname: "/", params: { note: noteId } } : "/")
      }
    },
    [closeDrawer, router, segments, setSelectedNoteId]
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
          next.delete(folderId)
        } else {
          next.add(folderId)
        }
        return next
      })
    },
    [setExpandedFolderIds]
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
        selectedNoteId={highlightedNoteId}
      />
    ),
    [
      expandedFolderIds,
      onOpenNoteOptions,
      selectFolder,
      selectNote,
      selectedFolderId,
      highlightedNoteId,
      toggleFolder,
    ]
  )

  const extraData = useMemo(
    () => ({
      expandedFolderIds,
      selectedFolderId,
      selectedNoteId: highlightedNoteId,
    }),
    [expandedFolderIds, selectedFolderId, highlightedNoteId]
  )

  const listRef = useRef<FlashListRef<TreeRow>>(null)
  const selectedRowIndex = visibleRows.findIndex(
    row => row.kind === "note" && row.note.id === highlightedNoteId
  )
  const scrollToSelection = useCallback(() => {
    if (selectedRowIndex >= 0) {
      listRef.current?.scrollToIndex({ index: selectedRowIndex, animated: false, viewPosition: 0.5 })
    }
  }, [selectedRowIndex])
  useEffect(scrollToSelection, [scrollToSelection, drawerOpen])

  const isLoading = notesState.isLoading || foldersQuery.isLoading

  console.log("DrawerNoteTreeList render")

  return (
    <View style={styles.flex}>
      {notes.length === 0 && !isLoading && (
        <MText className="px-2 text-zinc-400">No notes found.</MText>
      )}
      <FlashList
        ref={listRef}
        onLoad={scrollToSelection}
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

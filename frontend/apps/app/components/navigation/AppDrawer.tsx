import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet"
import type { Note } from "@memoneo/shared"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useAtom, useAtomValue } from "jotai"
import type React from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Alert, Dimensions, StyleSheet } from "react-native"
import { Drawer } from "react-native-drawer-layout"

import { authAtom, tokenAtom } from "@/lib/auth/state"
import { loadNoteCache } from "@/lib/notes/cache"
import {
  createLocalFolder,
  createLocalNote,
  deleteLocalNote,
} from "@/lib/notes/local"
import {
  NOTES_CACHE_QUERY_KEY,
  NOTES_FOLDERS_QUERY_KEY,
  NOTES_LOCAL_QUERY_KEY,
  useNoteFoldersQuery,
  useNotesQuery,
} from "@/lib/notes/query"
import { downloadRemoteNotes, syncNotes, uploadLocalNotes } from "@/lib/notes/sync"
import { selectedFolderIdAtom, selectedNoteIdAtom } from "@/lib/notes/state"

import { DrawerContent } from "./DrawerContent"
import { getNoteFileName, NoteOptionsSheet } from "./NoteOptionsSheet"
import { NoteTreeRow } from "./NoteTreeRow"
import {
  buildNoteTree,
  flattenVisibleTree,
  getFolderPathFromId,
  getNoteFolderId,
  getSelectedFolderIds,
  setsAreEqual,
  type TreeRow,
} from "./noteTree"

const WINDOW_WIDTH = Dimensions.get("window").width
const DRAWER_WIDTH = Math.min(340, WINDOW_WIDTH * 0.86)

type AppDrawerContextValue = {
  closeDrawer: () => void
  openDrawer: () => void
}

const AppDrawerContext = createContext<AppDrawerContextValue | null>(null)

export function useAppDrawer() {
  const context = useContext(AppDrawerContext)
  if (!context) {
    throw new Error("useAppDrawer must be used inside AppDrawer")
  }
  return context
}

export function AppDrawer({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const auth = useAtomValue(authAtom)
  const token = useAtomValue(tokenAtom)
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [optionsNote, setOptionsNote] = useState<Note | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom)
  const [selectedFolderId, setSelectedFolderId] = useAtom(selectedFolderIdAtom)
  const noteOptionsSheetRef = useRef<BottomSheetModal>(null)
  const syncInProgressRef = useRef(false)

  const notesQuery = useNotesQuery()
  const foldersQuery = useNoteFoldersQuery()
  const noteCacheQuery = useQuery({
    queryKey: NOTES_CACHE_QUERY_KEY,
    queryFn: loadNoteCache,
  })

  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data])
  const folderPaths = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data])
  const noteTree = useMemo(
    () => buildNoteTree(notes, folderPaths),
    [folderPaths, notes]
  )
  const selectedFolderIds = useMemo(
    () => getSelectedFolderIds(notes, selectedNoteId),
    [notes, selectedNoteId]
  )
  const selectedFolderIdSet = useMemo(
    () => new Set(selectedFolderIds),
    [selectedFolderIds]
  )
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set()
  )
  const visibleRows = useMemo(
    () => flattenVisibleTree(noteTree, expandedFolderIds),
    [noteTree, expandedFolderIds]
  )

  useEffect(() => {
    if (selectedFolderIds.length === 0) {
      return
    }

    setExpandedFolderIds(current => {
      const next = new Set(current)
      selectedFolderIds.forEach(folderId => next.add(folderId))
      return setsAreEqual(current, next) ? current : next
    })
  }, [selectedFolderIds])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const openDrawer = useCallback(() => {
    setDrawerOpen(true)
  }, [])

  const openSettings = useCallback(() => {
    closeDrawer()
    router.push("/settings")
  }, [closeDrawer, router])

  const syncMutation = useMutation({
    mutationFn: async (action: "download" | "upload" | "sync") => {
      if (!auth.isAuthenticated || !token) {
        throw new Error("Sign in from Settings before syncing notes.")
      }

      const syncAuth = { token, userId: auth.user.id }
      if (action === "download") {
        return downloadRemoteNotes(syncAuth)
      }
      if (action === "upload") {
        return uploadLocalNotes(syncAuth)
      }
      return syncNotes(syncAuth)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: NOTES_LOCAL_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: NOTES_FOLDERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: NOTES_CACHE_QUERY_KEY }),
      ])
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: NOTES_LOCAL_QUERY_KEY,
          type: "active",
        }),
        queryClient.refetchQueries({
          queryKey: NOTES_FOLDERS_QUERY_KEY,
          type: "active",
        }),
        queryClient.refetchQueries({
          queryKey: NOTES_CACHE_QUERY_KEY,
          type: "active",
        }),
      ])
    },
    onError: error => {
      Alert.alert(
        "Sync failed",
        error instanceof Error ? error.message : String(error)
      )
    },
    onSettled: () => {
      syncInProgressRef.current = false
    },
  })

  const runSyncAction = useCallback(
    (action: "download" | "upload" | "sync") => {
      if (syncInProgressRef.current || syncMutation.isPending) {
        return
      }

      syncInProgressRef.current = true
      syncMutation.mutate(action)
    },
    [syncMutation]
  )

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
      setExpandedFolderIds(current => {
        if (current.has(folderId)) {
          return current
        }
        const next = new Set(current)
        next.add(folderId)
        return next
      })
    },
    [setSelectedFolderId]
  )

  const createNoteMutation = useMutation({
    mutationFn: async (folderId: string) =>
      createLocalNote("Untitled", "", getFolderPathFromId(folderId)),
    onSuccess: async createdNote => {
      queryClient.setQueryData<Note[]>(NOTES_LOCAL_QUERY_KEY, current => [
        createdNote,
        ...(current ?? []).filter(note => note.id !== createdNote.id),
      ])
      setSelectedNoteId(createdNote.id)
      setSelectedFolderId(getNoteFolderId(createdNote))
      await queryClient.invalidateQueries({ queryKey: NOTES_LOCAL_QUERY_KEY })
      closeDrawer()
      router.push("/")
    },
    onError: error => {
      Alert.alert(
        "Create note failed",
        error instanceof Error ? error.message : String(error)
      )
    },
  })

  const createFolderMutation = useMutation({
    mutationFn: async (folderId: string) =>
      createLocalFolder(getFolderPathFromId(folderId)),
    onSuccess: async folderId => {
      queryClient.setQueryData<string[]>(NOTES_FOLDERS_QUERY_KEY, current =>
        [...new Set([...(current ?? []), folderId])].sort((a, b) =>
          a.localeCompare(b)
        )
      )
      await queryClient.invalidateQueries({ queryKey: NOTES_FOLDERS_QUERY_KEY })
      setSelectedFolderId(folderId)
      setExpandedFolderIds(current => {
        const next = new Set(current)
        const segments = folderId.split("/").filter(Boolean)
        let currentFolderId = ""
        segments.forEach(segment => {
          currentFolderId = currentFolderId
            ? `${currentFolderId}/${segment}`
            : segment
          next.add(currentFolderId)
        })
        return setsAreEqual(current, next) ? current : next
      })
    },
    onError: error => {
      Alert.alert(
        "Create folder failed",
        error instanceof Error ? error.message : String(error)
      )
    },
  })

  const openNoteOptions = useCallback((note: Note) => {
    setOptionsNote(note)
    noteOptionsSheetRef.current?.present()
  }, [])

  const closeNoteOptions = useCallback(() => {
    noteOptionsSheetRef.current?.dismiss()
  }, [])

  const deleteNoteMutation = useMutation({
    mutationFn: deleteLocalNote,
    onSuccess: async (_result, deletedNote) => {
      closeNoteOptions()
      await queryClient.invalidateQueries({ queryKey: NOTES_LOCAL_QUERY_KEY })

      if (selectedNoteId !== deletedNote.id) {
        return
      }

      const nextNoteId = notes.find(note => note.id !== deletedNote.id)?.id ?? ""
      setSelectedNoteId(nextNoteId)
    },
    onError: error => {
      Alert.alert(
        "Delete failed",
        error instanceof Error ? error.message : String(error)
      )
    },
  })

  const confirmDeleteNote = useCallback(
    (note: Note) => {
      Alert.alert(
        "Delete note?",
        `This deletes ${getNoteFileName(note)} from local storage.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteNoteMutation.mutate(note),
          },
        ]
      )
    },
    [deleteNoteMutation]
  )

  const toggleFolder = useCallback(
    (folderId: string) => {
      setExpandedFolderIds(current => {
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
    [selectedFolderIdSet]
  )

  const renderTreeRow = useCallback(
    ({ item }: { item: TreeRow }) => (
      <NoteTreeRow
        expanded={
          item.kind === "folder" && expandedFolderIds.has(item.folder.id)
        }
        item={item}
        onOpenNoteOptions={openNoteOptions}
        onSelectFolder={selectFolder}
        onSelectNote={selectNote}
        onToggleFolder={toggleFolder}
        selectedFolderId={selectedFolderId}
        selectedNoteId={selectedNoteId}
      />
    ),
    [
      expandedFolderIds,
      openNoteOptions,
      selectFolder,
      selectNote,
      selectedFolderId,
      selectedNoteId,
      toggleFolder,
    ]
  )

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
      />
    ),
    []
  )

  const lastSync = optionsNote?.id
    ? noteCacheQuery.data?.[optionsNote.id]?.lastSync
    : undefined

  return (
    <AppDrawerContext.Provider value={{ closeDrawer, openDrawer }}>
      <Drawer
        configureGestureHandler={gesture =>
          gesture.activeOffsetX([-10, 10]).failOffsetY([-12, 12])
        }
        drawerPosition="left"
        drawerStyle={styles.drawer}
        drawerType="front"
        onClose={closeDrawer}
        onOpen={openDrawer}
        open={drawerOpen}
        overlayStyle={styles.drawerOverlay}
        renderDrawerContent={() => (
          <DrawerContent
            expandedFolderIds={expandedFolderIds}
            isCreatingFolder={createFolderMutation.isPending}
            isCreatingNote={createNoteMutation.isPending}
            isLoading={notesQuery.isLoading || foldersQuery.isLoading}
            isSyncing={syncMutation.isPending || syncInProgressRef.current}
            notesCount={notes.length}
            onCreateFolder={() => createFolderMutation.mutate(selectedFolderId)}
            onCreateNote={() => createNoteMutation.mutate(selectedFolderId)}
            onOpenSettings={openSettings}
            onSync={runSyncAction}
            renderTreeRow={renderTreeRow}
            rows={visibleRows}
            selectedFolderId={selectedFolderId}
            selectedNoteId={selectedNoteId}
          />
        )}
        swipeEdgeWidth={WINDOW_WIDTH}
        swipeEnabled>
        {children}
      </Drawer>

      <BottomSheetModal
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        ref={noteOptionsSheetRef}
        snapPoints={["46%"]}>
        <BottomSheetView style={styles.flex}>
          {optionsNote && (
            <NoteOptionsSheet
              isDeleting={deleteNoteMutation.isPending}
              lastSync={lastSync}
              note={optionsNote}
              onDelete={confirmDeleteNote}
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </AppDrawerContext.Provider>
  )
}

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: "hsl(240 10% 3.9%)",
    width: DRAWER_WIDTH,
  },
  drawerOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheetBackground: {
    backgroundColor: "hsl(240 3.7% 15.9%)",
  },
  flex: {
    flex: 1,
  },
  sheetHandle: {
    backgroundColor: "#71717a",
  },
})

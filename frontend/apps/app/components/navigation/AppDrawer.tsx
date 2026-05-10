import AsyncStorage from "@react-native-async-storage/async-storage"
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
import { deleteLocalNote } from "@/lib/notes/local"
import { LAST_OPENED_NOTE_KEY, useNotesQuery } from "@/lib/notes/query"
import { downloadRemoteNotes, syncNotes, uploadLocalNotes } from "@/lib/notes/sync"
import { selectedNoteIdAtom } from "@/lib/notes/state"

import { DrawerContent } from "./DrawerContent"
import { getNoteFileName, NoteOptionsSheet } from "./NoteOptionsSheet"
import { NoteTreeRow } from "./NoteTreeRow"
import {
  buildNoteTree,
  flattenVisibleTree,
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
  const noteOptionsSheetRef = useRef<BottomSheetModal>(null)

  const notesQuery = useNotesQuery()
  const noteCacheQuery = useQuery({
    queryKey: ["notes", "cache"],
    queryFn: loadNoteCache,
  })

  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data])
  const noteTree = useMemo(() => buildNoteTree(notes), [notes])
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

  useEffect(() => {
    if (notes.length === 0 || selectedNoteId) {
      return
    }

    AsyncStorage.getItem(LAST_OPENED_NOTE_KEY).then(lastOpenedNoteId => {
      const lastOpenedNote = notes.find(note => note.id === lastOpenedNoteId)
      setSelectedNoteId((lastOpenedNote ?? notes[0])?.id ?? "")
    })
  }, [notes, selectedNoteId, setSelectedNoteId])

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
    onSuccess: async result => {
      await queryClient.invalidateQueries({ queryKey: ["notes", "local"] })
      await queryClient.invalidateQueries({ queryKey: ["notes", "cache"] })
      Alert.alert(
        "Notes synced",
        [
          `Downloaded: ${result.downloaded}`,
          `Uploaded: ${result.uploaded}`,
          `Updated local: ${result.updatedLocal}`,
          `Updated remote: ${result.updatedRemote}`,
        ].join("\n")
      )
    },
    onError: error => {
      Alert.alert(
        "Sync failed",
        error instanceof Error ? error.message : String(error)
      )
    },
  })

  const selectNote = useCallback(
    async (noteId: string) => {
      setSelectedNoteId(noteId)
      await AsyncStorage.setItem(LAST_OPENED_NOTE_KEY, noteId)
      closeDrawer()
      router.push("/")
    },
    [closeDrawer, router, setSelectedNoteId]
  )

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
      await queryClient.invalidateQueries({ queryKey: ["notes", "local"] })

      if (selectedNoteId !== deletedNote.id) {
        return
      }

      const nextNoteId = notes.find(note => note.id !== deletedNote.id)?.id ?? ""
      setSelectedNoteId(nextNoteId)
      if (nextNoteId) {
        await AsyncStorage.setItem(LAST_OPENED_NOTE_KEY, nextNoteId)
      } else {
        await AsyncStorage.removeItem(LAST_OPENED_NOTE_KEY)
      }
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
        onSelectNote={selectNote}
        onToggleFolder={toggleFolder}
        selectedNoteId={selectedNoteId}
      />
    ),
    [expandedFolderIds, openNoteOptions, selectNote, selectedNoteId, toggleFolder]
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
            isLoading={notesQuery.isLoading}
            notesCount={notes.length}
            onOpenSettings={openSettings}
            onSync={action => syncMutation.mutate(action)}
            renderTreeRow={renderTreeRow}
            rows={visibleRows}
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
        <BottomSheetView style={styles.sheetContent}>
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
    backgroundColor: "#09090b",
    width: DRAWER_WIDTH,
  },
  drawerOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheetBackground: {
    backgroundColor: "#18181b",
  },
  sheetContent: {
    flex: 1,
  },
  sheetHandle: {
    backgroundColor: "#71717a",
  },
})

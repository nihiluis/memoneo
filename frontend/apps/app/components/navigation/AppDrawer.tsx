import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet"
import type { Note } from "@memoneo/shared"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import type React from "react"
import { useCallback, useRef, useState } from "react"
import { Alert, Dimensions, StyleSheet } from "react-native"
import { Drawer } from "react-native-drawer-layout"

import { loadNoteCache } from "@/lib/notes/cache"
import { deleteLocalNote } from "@/lib/notes/local"
import { NOTES_CACHE_QUERY_KEY, NOTES_LOCAL_QUERY_KEY } from "@/lib/notes/query"
import {
  selectedNoteIdAtom,
  useNotesState,
} from "@/lib/notes/state"

import { AppDrawerContext } from "./appDrawerContext"
import { DrawerContent } from "./DrawerContent"
import { getNoteFileName, NoteOptionsSheet } from "./NoteOptionsSheet"

export { useAppDrawer } from "./appDrawerContext"

const WINDOW_WIDTH = Dimensions.get("window").width
const DRAWER_WIDTH = Math.min(340, WINDOW_WIDTH * 0.86)

export function AppDrawer({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [optionsNote, setOptionsNote] = useState<Note | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom)
  const noteOptionsSheetRef = useRef<BottomSheetModal>(null)

  console.log("AppDrawer render")

  const notesState = useNotesState()
  const noteCacheQuery = useQuery({
    queryKey: NOTES_CACHE_QUERY_KEY,
    queryFn: loadNoteCache,
  })

  const notes = notesState.notes

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const openDrawer = useCallback(() => {
    setDrawerOpen(true)
  }, [])

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
      notesState.removeNote(deletedNote.id)
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
    <AppDrawerContext.Provider
      value={{ closeDrawer, drawerOpen, openDrawer }}>
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
          <DrawerContent onOpenNoteOptions={openNoteOptions} />
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

import AsyncStorage from "@react-native-async-storage/async-storage"
import { Note } from "@memoneo/shared"
import { FlashList } from "@shopify/flash-list"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  Plus,
  Settings,
} from "lucide-react-native"
import type React from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Dimensions, Pressable, StyleSheet, View } from "react-native"
import { Drawer } from "react-native-drawer-layout"
import { SafeAreaView } from "react-native-safe-area-context"

import { MText } from "@/components/reusables/MText"
import { LAST_OPENED_NOTE_KEY, useNotesQuery } from "@/lib/notes/query"
import { selectedNoteIdAtom } from "@/lib/notes/state"

const WINDOW_WIDTH = Dimensions.get("window").width
const DRAWER_WIDTH = Math.min(340, WINDOW_WIDTH * 0.86)

type AppDrawerContextValue = {
  closeDrawer: () => void
  openDrawer: () => void
}

type NoteTreeNode = {
  id: string
  name: string
  folders: NoteTreeNode[]
  notes: Note[]
}

type TreeRow =
  | {
      id: string
      depth: number
      folder: NoteTreeNode
      kind: "folder"
    }
  | {
      id: string
      depth: number
      kind: "note"
      note: Note
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom)
  const notesQuery = useNotesQuery()
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
      const fallbackNote = notes[0]
      setSelectedNoteId((lastOpenedNote ?? fallbackNote)?.id ?? "")
    })
  }, [notes, selectedNoteId, setSelectedNoteId])

  const openDrawer = useCallback(() => {
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const openSettings = useCallback(() => {
    closeDrawer()
    router.push("/settings")
  }, [closeDrawer, router])

  const selectNote = useCallback(
    async (noteId: string) => {
      setSelectedNoteId(noteId)
      await AsyncStorage.setItem(LAST_OPENED_NOTE_KEY, noteId)
      closeDrawer()
      router.push("/")
    },
    [closeDrawer, router, setSelectedNoteId]
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
      <TreeRowView
        expanded={
          item.kind === "folder" && expandedFolderIds.has(item.folder.id)
        }
        item={item}
        onSelectNote={selectNote}
        onToggleFolder={toggleFolder}
        selectedNoteId={selectedNoteId}
      />
    ),
    [expandedFolderIds, selectNote, selectedNoteId, toggleFolder]
  )

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
          <SafeAreaView style={styles.drawerContent}>
            <View style={styles.drawerInner}>
              {notes.length === 0 && !notesQuery.isLoading && (
                <MText style={styles.emptyText}>
                  No notes found.
                </MText>
              )}
              <FlashList
                contentContainerStyle={styles.treeContent}
                data={visibleRows}
                extraData={{ expandedFolderIds, selectedNoteId }}
                keyExtractor={item => item.id}
                renderItem={renderTreeRow}
                showsVerticalScrollIndicator={false}
                style={styles.treeList}
              />

              <View>
                <View style={styles.drawerActions}>
                  <DrawerAction icon={<Plus size={32} color="#a1a1aa" />} label="New note" />
                  <DrawerAction
                    icon={<FolderPlus size={32} color="#a1a1aa" />}
                    label="New folder"
                  />
                  <DrawerAction
                    icon={<Settings size={32} color="#a1a1aa" />}
                    label="Settings"
                    onPress={openSettings}
                  />
                </View>
              </View>
            </View>
          </SafeAreaView>
        )}
        swipeEdgeWidth={WINDOW_WIDTH}
        swipeEnabled>
        {children}
      </Drawer>
    </AppDrawerContext.Provider>
  )
}

function TreeRowView({
  expanded,
  item,
  onSelectNote,
  onToggleFolder,
  selectedNoteId,
}: {
  expanded: boolean
  item: TreeRow
  onSelectNote: (noteId: string) => void
  onToggleFolder: (folderId: string) => void
  selectedNoteId: string
}) {
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
      onPress={() => onSelectNote(item.note.id)}
      style={[
        styles.treeItem,
        styles.noteItem,
        selected && styles.selectedNote,
        { paddingLeft: getTreePadding(item.depth) },
      ]}>
      <MText
        numberOfLines={1}
        style={[styles.noteText, selected && styles.selectedNoteText]}>
        {item.note.file?.title ?? item.note.title}
      </MText>
    </Pressable>
  )
}

function DrawerAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  onPress?: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={styles.drawerAction}>
      {icon}
      <MText style={styles.drawerActionText}>{label}</MText>
    </Pressable>
  )
}

function buildNoteTree(notes: Note[]): NoteTreeNode {
  const root: NoteTreeNode = { id: "", name: "root", folders: [], notes: [] }

  notes.forEach(note => {
    let current = root
    const segments = getDirectorySegments(note)

    segments.forEach(segment => {
      let folder = current.folders.find(item => item.name === segment)
      if (!folder) {
        folder = {
          id: getFolderId(current.id, segment),
          name: segment,
          folders: [],
          notes: [],
        }
        current.folders.push(folder)
      }
      current = folder
    })

    current.notes.push(note)
  })

  sortTree(root)
  return root
}

function getDirectorySegments(note: Note) {
  const path = note.file?.path?.trim()
  if (!path) {
    return ["Unfiled"]
  }

  const segments = path.split(/[\\/]/).filter(Boolean)
  return segments.length > 0 ? segments : ["Unfiled"]
}

function sortTree(node: NoteTreeNode) {
  node.folders.sort((a, b) => a.name.localeCompare(b.name))
  node.notes.sort((a, b) => getNoteTitle(a).localeCompare(getNoteTitle(b)))
  node.folders.forEach(sortTree)
}

function flattenVisibleTree(
  root: NoteTreeNode,
  expandedFolderIds: Set<string>
) {
  const rows: TreeRow[] = []

  function appendNode(node: NoteTreeNode, depth: number) {
    node.folders.forEach(folder => {
      rows.push({
        id: `folder:${folder.id}`,
        depth,
        folder,
        kind: "folder",
      })

      if (expandedFolderIds.has(folder.id)) {
        appendNode(folder, depth + 1)
      }
    })

    node.notes.forEach(note => {
      rows.push({
        id: `note:${note.id}`,
        depth,
        kind: "note",
        note,
      })
    })
  }

  appendNode(root, 0)
  return rows
}

function getSelectedFolderIds(notes: Note[], selectedNoteId: string) {
  const selectedNote = notes.find(note => note.id === selectedNoteId)
  if (!selectedNote) {
    return []
  }

  const folderIds: string[] = []
  let currentFolderId = ""
  getDirectorySegments(selectedNote).forEach(segment => {
    currentFolderId = getFolderId(currentFolderId, segment)
    folderIds.push(currentFolderId)
  })
  return folderIds
}

function getFolderId(parentId: string, segment: string) {
  return parentId ? `${parentId}/${segment}` : segment
}

function getNoteTitle(note: Note) {
  return note.file?.title ?? note.title
}

function getTreePadding(depth: number) {
  return 8 + Math.min(depth, 8) * 16
}

function setsAreEqual<T>(left: Set<T>, right: Set<T>) {
  if (left.size !== right.size) {
    return false
  }
  for (const value of left) {
    if (!right.has(value)) {
      return false
    }
  }
  return true
}

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: "#09090b",
    width: DRAWER_WIDTH,
  },
  drawerAction: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    gap: 6,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  drawerActionText: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  drawerActions: {
    borderTopColor: "#27272a",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
  },
  drawerContent: {
    backgroundColor: "#09090b",
    flex: 1,
  },
  drawerInner: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  drawerOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  emptyText: {
    color: "#a1a1aa",
    paddingHorizontal: 8,
  },
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
  noteItem: {},
  selectedNote: {
    backgroundColor: "#27272a",
  },
  selectedNoteText: {
    color: "#fafafa",
    fontWeight: "600",
  },
  treeContent: {
    paddingBottom: 8,
  },
  treeItem: {
    alignItems: "center",
    borderRadius: 6,
    flexDirection: "row",
    minHeight: 38,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  treeList: {
    flex: 1,
  },
})

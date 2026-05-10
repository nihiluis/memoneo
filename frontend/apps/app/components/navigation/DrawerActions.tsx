import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useAtomValue, useSetAtom } from "jotai"
import {
  Download,
  FolderPlus,
  Plus,
  RefreshCw,
  Settings,
  Upload,
} from "lucide-react-native"
import { useCallback, useRef } from "react"
import { Alert, View } from "react-native"

import { authAtom, tokenAtom } from "@/lib/auth/state"
import { createLocalFolder, createLocalNote } from "@/lib/notes/local"
import {
  NOTES_CACHE_QUERY_KEY,
  NOTES_FOLDERS_QUERY_KEY,
  NOTES_LOCAL_QUERY_KEY,
} from "@/lib/notes/query"
import {
  drawerExpandedFolderIdsAtom,
  selectedFolderIdAtom,
  selectedNoteIdAtom,
  useNotesState,
} from "@/lib/notes/state"
import { downloadRemoteNotes, syncNotes, uploadLocalNotes } from "@/lib/notes/sync"

import { useAppDrawer } from "./appDrawerContext"
import { DrawerAction } from "./DrawerAction"
import { getFolderPathFromId, getNoteFolderId, setsAreEqual } from "./noteTree"

type SyncAction = "download" | "upload" | "sync"

export function DrawerActions() {
  const router = useRouter()
  const { closeDrawer } = useAppDrawer()
  const auth = useAtomValue(authAtom)
  const token = useAtomValue(tokenAtom)
  const queryClient = useQueryClient()
  const notesState = useNotesState()
  const selectedFolderId = useAtomValue(selectedFolderIdAtom)
  const setSelectedNoteId = useSetAtom(selectedNoteIdAtom)
  const setSelectedFolderId = useSetAtom(selectedFolderIdAtom)
  const setExpandedFolderIds = useSetAtom(drawerExpandedFolderIdsAtom)
  const syncInProgressRef = useRef(false)

  const openSettings = useCallback(() => {
    closeDrawer()
    router.push("/settings")
  }, [closeDrawer, router])

  const createNoteMutation = useMutation({
    mutationFn: async (folderId: string) =>
      createLocalNote("Untitled", "", getFolderPathFromId(folderId)),
    onSuccess: async createdNote => {
      notesState.upsertNote(createdNote)
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
      queryClient.setQueryData<string[]>(NOTES_FOLDERS_QUERY_KEY, (current: string[] | undefined) =>
        [...new Set([...(current ?? []), folderId])].sort((a, b) =>
          a.localeCompare(b)
        )
      )
      await queryClient.invalidateQueries({ queryKey: NOTES_FOLDERS_QUERY_KEY })
      setSelectedFolderId(folderId)
      setExpandedFolderIds((current: Set<string>) => {
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

  const syncMutation = useMutation({
    mutationFn: async (action: SyncAction) => {
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
    (action: SyncAction) => {
      if (syncInProgressRef.current || syncMutation.isPending) {
        return
      }

      syncInProgressRef.current = true
      syncMutation.mutate(action)
    },
    [syncMutation]
  )
  const isSyncing = syncMutation.isPending || syncInProgressRef.current

  return (
    <View>
      <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
        <DrawerAction
          disabled={createNoteMutation.isPending}
          icon={<Plus size={32} color="#a1a1aa" />}
          label="New note"
          onPress={() => createNoteMutation.mutate(selectedFolderId)}
        />
        <DrawerAction
          disabled={createFolderMutation.isPending}
          icon={<FolderPlus size={32} color="#a1a1aa" />}
          label="New folder"
          onPress={() => createFolderMutation.mutate(selectedFolderId)}
        />
        <DrawerAction
          disabled={isSyncing}
          icon={<Download size={32} color="#a1a1aa" />}
          label="Download"
          onPress={() => runSyncAction("download")}
        />
      </View>
      <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
        <DrawerAction
          disabled={isSyncing}
          icon={<Upload size={32} color="#a1a1aa" />}
          label="Upload"
          onPress={() => runSyncAction("upload")}
        />
        <DrawerAction
          disabled={isSyncing}
          icon={<RefreshCw size={32} color="#a1a1aa" />}
          label="Sync"
          onPress={() => runSyncAction("sync")}
        />
        <DrawerAction
          icon={<Settings size={32} color="#a1a1aa" />}
          label="Settings"
          onPress={openSettings}
        />
      </View>
    </View>
  )
}

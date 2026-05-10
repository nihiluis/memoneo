import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useRef } from "react"
import { Alert } from "react-native"

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

import { useAppDrawer } from "../appDrawerContext"
import { getFolderPathFromId, getNoteFolderId, setsAreEqual } from "../noteTree"

type SyncMutationKind = "download" | "upload" | "sync"

export function useCreateNoteDrawerMutation() {
  const router = useRouter()
  const { closeDrawer } = useAppDrawer()
  const notesState = useNotesState()
  const setSelectedNoteId = useSetAtom(selectedNoteIdAtom)
  const setSelectedFolderId = useSetAtom(selectedFolderIdAtom)
  const queryClient = useQueryClient()

  return useMutation({
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
}

export function useCreateFolderDrawerMutation() {
  const queryClient = useQueryClient()
  const setSelectedFolderId = useSetAtom(selectedFolderIdAtom)
  const setExpandedFolderIds = useSetAtom(drawerExpandedFolderIdsAtom)

  return useMutation({
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
}

export function useSyncDrawerMutation() {
  const auth = useAtomValue(authAtom)
  const token = useAtomValue(tokenAtom)
  const queryClient = useQueryClient()
  const syncInProgressRef = useRef(false)

  const syncMutation = useMutation({
    mutationFn: async (action: SyncMutationKind) => {
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
    (action: SyncMutationKind) => {
      if (syncInProgressRef.current || syncMutation.isPending) {
        return
      }

      syncInProgressRef.current = true
      syncMutation.mutate(action)
    },
    [syncMutation]
  )

  const isSyncing = syncMutation.isPending || syncInProgressRef.current

  return { isSyncing, runSyncAction }
}

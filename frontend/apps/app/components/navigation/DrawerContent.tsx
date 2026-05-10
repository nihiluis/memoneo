import { FlashList, type ListRenderItem } from "@shopify/flash-list"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import {
  Download,
  FolderPlus,
  Plus,
  RefreshCw,
  Settings,
  Upload,
} from "lucide-react-native"
import { useCallback, useRef } from "react"
import { Alert, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { MText } from "@/components/reusables/MText"
import { authAtom, tokenAtom } from "@/lib/auth/state"
import {
  NOTES_CACHE_QUERY_KEY,
  NOTES_FOLDERS_QUERY_KEY,
  NOTES_LOCAL_QUERY_KEY,
} from "@/lib/notes/query"
import { downloadRemoteNotes, syncNotes, uploadLocalNotes } from "@/lib/notes/sync"

import { DrawerAction } from "./DrawerAction"
import type { TreeRow } from "./noteTree"

type DrawerContentProps = {
  expandedFolderIds: Set<string>
  isCreatingFolder: boolean
  isCreatingNote: boolean
  isLoading: boolean
  notesCount: number
  onCreateFolder: () => void
  onCreateNote: () => void
  onOpenSettings: () => void
  renderTreeRow: ListRenderItem<TreeRow>
  rows: TreeRow[]
  selectedFolderId: string
  selectedNoteId: string
}

type SyncAction = "download" | "upload" | "sync"

export function DrawerContent({
  expandedFolderIds,
  isCreatingFolder,
  isCreatingNote,
  isLoading,
  notesCount,
  onCreateFolder,
  onCreateNote,
  onOpenSettings,
  renderTreeRow,
  rows,
  selectedFolderId,
  selectedNoteId,
}: DrawerContentProps) {
  return (
    <SafeAreaView className="bg-background" style={styles.flex}>
      <View className="px-3 py-4" style={styles.flex}>
        {notesCount === 0 && !isLoading && (
          <MText className="px-2 text-zinc-400">No notes found.</MText>
        )}
        <FlashList
          contentContainerStyle={{ paddingBottom: 8 }}
          data={rows}
          extraData={{ expandedFolderIds, selectedFolderId, selectedNoteId }}
          keyExtractor={item => item.id}
          renderItem={renderTreeRow}
          showsVerticalScrollIndicator={false}
          style={styles.flex}
        />

        <DrawerActions
          isCreatingFolder={isCreatingFolder}
          isCreatingNote={isCreatingNote}
          onCreateFolder={onCreateFolder}
          onCreateNote={onCreateNote}
          onOpenSettings={onOpenSettings}
        />
      </View>
    </SafeAreaView>
  )
}

function DrawerActions({
  isCreatingFolder,
  isCreatingNote,
  onCreateFolder,
  onCreateNote,
  onOpenSettings,
}: {
  isCreatingFolder: boolean
  isCreatingNote: boolean
  onCreateFolder: () => void
  onCreateNote: () => void
  onOpenSettings: () => void
}) {
  const auth = useAtomValue(authAtom)
  const token = useAtomValue(tokenAtom)
  const queryClient = useQueryClient()
  const syncInProgressRef = useRef(false)

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
          disabled={isCreatingNote}
          icon={<Plus size={32} color="#a1a1aa" />}
          label="New note"
          onPress={onCreateNote}
        />
        <DrawerAction
          disabled={isCreatingFolder}
          icon={<FolderPlus size={32} color="#a1a1aa" />}
          label="New folder"
          onPress={onCreateFolder}
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
          onPress={onOpenSettings}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
})

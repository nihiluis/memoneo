import { FlashList, type ListRenderItem } from "@shopify/flash-list"
import {
  Download,
  Folder,
  FolderPlus,
  Plus,
  RefreshCw,
  Settings,
  Upload,
} from "lucide-react-native"
import { Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { MText } from "@/components/reusables/MText"

import { DrawerAction } from "./DrawerAction"
import type { TreeRow } from "./noteTree"

type DrawerContentProps = {
  expandedFolderIds: Set<string>
  isCreatingFolder: boolean
  isCreatingNote: boolean
  isLoading: boolean
  isSyncing: boolean
  notesCount: number
  onCreateFolder: () => void
  onCreateNote: () => void
  onOpenSettings: () => void
  onSync: (action: "download" | "upload" | "sync") => void
  renderTreeRow: ListRenderItem<TreeRow>
  rows: TreeRow[]
  selectedFolderId: string
  selectedNoteId: string
}

export function DrawerContent({
  expandedFolderIds,
  isCreatingFolder,
  isCreatingNote,
  isLoading,
  isSyncing,
  notesCount,
  onCreateFolder,
  onCreateNote,
  onOpenSettings,
  onSync,
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
          isSyncing={isSyncing}
          onCreateFolder={onCreateFolder}
          onCreateNote={onCreateNote}
          onOpenSettings={onOpenSettings}
          onSync={onSync}
        />
      </View>
    </SafeAreaView>
  )
}

function DrawerActions({
  isCreatingFolder,
  isCreatingNote,
  isSyncing,
  onCreateFolder,
  onCreateNote,
  onOpenSettings,
  onSync,
}: {
  isCreatingFolder: boolean
  isCreatingNote: boolean
  isSyncing: boolean
  onCreateFolder: () => void
  onCreateNote: () => void
  onOpenSettings: () => void
  onSync: (action: "download" | "upload" | "sync") => void
}) {
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
          onPress={() => onSync("download")}
        />
      </View>
      <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
        <DrawerAction
          disabled={isSyncing}
          icon={<Upload size={32} color="#a1a1aa" />}
          label="Upload"
          onPress={() => onSync("upload")}
        />
        <DrawerAction
          disabled={isSyncing}
          icon={<RefreshCw size={32} color="#a1a1aa" />}
          label="Sync"
          onPress={() => onSync("sync")}
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

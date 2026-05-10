import { FlashList, type ListRenderItem } from "@shopify/flash-list"
import {
  Download,
  FolderPlus,
  Plus,
  RefreshCw,
  Settings,
  Upload,
} from "lucide-react-native"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { MText } from "@/components/reusables/MText"

import { DrawerAction } from "./DrawerAction"
import type { TreeRow } from "./noteTree"

type DrawerContentProps = {
  expandedFolderIds: Set<string>
  isLoading: boolean
  notesCount: number
  onOpenSettings: () => void
  onSync: (action: "download" | "upload" | "sync") => void
  renderTreeRow: ListRenderItem<TreeRow>
  rows: TreeRow[]
  selectedNoteId: string
}

export function DrawerContent({
  expandedFolderIds,
  isLoading,
  notesCount,
  onOpenSettings,
  onSync,
  renderTreeRow,
  rows,
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
          extraData={{ expandedFolderIds, selectedNoteId }}
          keyExtractor={item => item.id}
          renderItem={renderTreeRow}
          showsVerticalScrollIndicator={false}
          style={styles.flex}
        />

        <DrawerActions onOpenSettings={onOpenSettings} onSync={onSync} />
      </View>
    </SafeAreaView>
  )
}

function DrawerActions({
  onOpenSettings,
  onSync,
}: {
  onOpenSettings: () => void
  onSync: (action: "download" | "upload" | "sync") => void
}) {
  return (
    <View>
      <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
        <DrawerAction icon={<Plus size={32} color="#a1a1aa" />} label="New note" />
        <DrawerAction
          icon={<FolderPlus size={32} color="#a1a1aa" />}
          label="New folder"
        />
        <DrawerAction
          icon={<Download size={32} color="#a1a1aa" />}
          label="Download"
          onPress={() => onSync("download")}
        />
      </View>
      <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
        <DrawerAction
          icon={<Upload size={32} color="#a1a1aa" />}
          label="Upload"
          onPress={() => onSync("upload")}
        />
        <DrawerAction
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

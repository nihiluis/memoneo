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
    <SafeAreaView style={styles.drawerContent}>
      <View style={styles.drawerInner}>
        {notesCount === 0 && !isLoading && (
          <MText style={styles.emptyText}>No notes found.</MText>
        )}
        <FlashList
          contentContainerStyle={styles.treeContent}
          data={rows}
          extraData={{ expandedFolderIds, selectedNoteId }}
          keyExtractor={item => item.id}
          renderItem={renderTreeRow}
          showsVerticalScrollIndicator={false}
          style={styles.treeList}
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
      <View style={styles.drawerActions}>
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
      <View style={styles.drawerActions}>
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
  emptyText: {
    color: "#a1a1aa",
    paddingHorizontal: 8,
  },
  treeContent: {
    paddingBottom: 8,
  },
  treeList: {
    flex: 1,
  },
})

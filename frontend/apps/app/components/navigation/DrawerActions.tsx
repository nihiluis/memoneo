import { useAtomValue } from "jotai"
import { View } from "react-native"

import { selectedFolderIdAtom } from "@/lib/notes/state"

import { DownloadDrawerAction } from "./actions/DownloadDrawerAction"
import { NewFolderDrawerAction } from "./actions/NewFolderDrawerAction"
import { NewNoteDrawerAction } from "./actions/NewNoteDrawerAction"
import { SettingsDrawerAction } from "./actions/SettingsDrawerAction"
import { SyncDrawerAction } from "./actions/SyncDrawerAction"
import { UploadDrawerAction } from "./actions/UploadDrawerAction"
import { useSyncDrawerMutation } from "./actions/mutations"

export function DrawerActions() {
  const selectedFolderId = useAtomValue(selectedFolderIdAtom)
  const { isSyncing, runSyncAction } = useSyncDrawerMutation()

  return (
    <View>
      <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
        <NewNoteDrawerAction folderId={selectedFolderId} />
        <NewFolderDrawerAction folderId={selectedFolderId} />
        <DownloadDrawerAction
          disabled={isSyncing}
          onPress={() => runSyncAction("download")}
        />
      </View>
      <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
        <UploadDrawerAction
          disabled={isSyncing}
          onPress={() => runSyncAction("upload")}
        />
        <SyncDrawerAction
          disabled={isSyncing}
          onPress={() => runSyncAction("sync")}
        />
        <SettingsDrawerAction />
      </View>
    </View>
  )
}

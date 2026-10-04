import { useAtomValue } from "jotai"
import { useRouter } from "expo-router"
import { LogIn } from "lucide-react-native"
import { authAtom } from "@/lib/auth/state"
import { DrawerAction } from "./DrawerAction"
import { useAppDrawer } from "./appDrawerContext"
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
  const auth = useAtomValue(authAtom)
  const router = useRouter()
  const { closeDrawer } = useAppDrawer()
  const selectedFolderId = useAtomValue(selectedFolderIdAtom)
  const { isSyncing, runSyncAction } = useSyncDrawerMutation()

  return (
    <View>
      <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
        <NewNoteDrawerAction folderId={selectedFolderId} />
        <NewFolderDrawerAction folderId={selectedFolderId} />
        <SettingsDrawerAction />
      </View>
      <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
        {auth.isAuthenticated ? (
          <>
            <UploadDrawerAction
              disabled={isSyncing}
              onPress={() => runSyncAction("upload")}
            />
            <SyncDrawerAction
              disabled={isSyncing}
              onPress={() => runSyncAction("sync")}
            />
            <DownloadDrawerAction
              disabled={isSyncing}
              onPress={() => runSyncAction("download")}
            />
          </>
        ) : (
          <DrawerAction
            icon={<LogIn size={32} color="#a1a1aa" />}
            label="Login to sync"
            onPress={() => {
              closeDrawer()
              router.push("/auth/login")
            }}
          />
        )}
      </View>
    </View>
  )
}

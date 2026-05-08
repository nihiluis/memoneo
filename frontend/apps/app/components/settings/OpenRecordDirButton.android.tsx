import { startActivityAsync, ActivityAction } from "expo-intent-launcher"
import { getRecordDir } from "@/lib/audio/file"
import { Alert } from "react-native"
import OpenRecordDirButtonInner from "./OpenRecordDirButtonInner"
import { PermissionProvider } from "../permission/PermissionProvider"
import { PERMISSIONS } from "react-native-permissions"
import { getContentUriAsync } from "expo-file-system"


// Broken, doesn't work.
export function OpenRecordDirButton() {
  async function openRecordDir() {
    const recordsDir = getRecordDir()
    if (!recordsDir.exists) {
      Alert.alert("No records found.")
      return
    }

    const contentUri = await getContentUriAsync(recordsDir.uri)

    try {
      await startActivityAsync("android.intent.action.OPEN_DOCUMENT", {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      })
    } catch (error) {
      console.error("Failed to open record folder", error)
      Alert.alert("Failed to open record folder.")
    }
  }

  return <OpenRecordDirButtonInner openRecordDir={openRecordDir} />
}

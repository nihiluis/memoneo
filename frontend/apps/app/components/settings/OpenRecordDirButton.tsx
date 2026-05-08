import { Alert } from "react-native"
import OpenRecordDirButtonInner from "./OpenRecordDirButtonInner"

export function OpenRecordDirButton() {
  async function openRecordDir() {
    Alert.alert("Not supported on this platform.")
  }

  return <OpenRecordDirButtonInner openRecordDir={openRecordDir} />
}

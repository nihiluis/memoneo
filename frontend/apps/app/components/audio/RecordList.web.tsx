import { useCallback, useState } from "react"
import { useFocusEffect, useRouter } from "expo-router"
import { ScrollView, View } from "react-native"
import {
  deleteRecordFile,
  getRecordFiles,
  type RecordFileData,
} from "@/lib/audio/file.web"
import { Alert } from "@/lib/alert"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import AudioRecorder from "./AudioRecorder.web"

export function RecordList() {
  const router = useRouter()
  const [records, setRecords] = useState<RecordFileData[]>([])
  const refresh = useCallback(() => {
    void getRecordFiles()
      .then(setRecords)
      .catch(error => Alert.alert("Load recordings failed", String(error)))
  }, [])
  useFocusEffect(refresh)
  return (
    <View className="flex-1">
      <AudioRecorder onSaved={refresh} />
      <ScrollView className="flex-1 p-4">
        {!records.length && (
          <MText>No recordings found. Record a voice note above.</MText>
        )}
        {records.map(record => (
          <View
            key={record.filename}
            className="mb-3 flex-row items-center gap-3 border-b border-border pb-3"
          >
            <Button
              variant="ghost"
              className="flex-1"
              onPress={() => router.push(`/records/${record.filename}`)}
            >
              <MText>
                {record.title} · {record.dateString}
              </MText>
            </Button>
            <Button
              variant="danger"
              onPress={() =>
                Alert.alert("Delete recording?", record.title, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      void deleteRecordFile(record)
                        .then(refresh)
                        .catch(error =>
                          Alert.alert("Delete failed", String(error))
                        )
                    },
                  },
                ])
              }
            >
              <MText>Delete</MText>
            </Button>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

import { useEffect, useState } from "react"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useQueryClient } from "@tanstack/react-query"
import { ScrollView, View } from "react-native"
import {
  getRecordMetadata,
  getRecording,
  updateMetadata,
  deleteRecordFile,
} from "@/lib/audio/file.web"
import type { RecordFileDataWithMetadata } from "@/lib/audio/file"
import { pollTranscription, queueTranscription } from "@/lib/transcribe"
import { createLocalNote } from "@/lib/notes/local"
import { NOTES_LOCAL_QUERY_KEY } from "@/lib/notes/query"
import { downloadBlob } from "@/lib/web/download"
import { Alert } from "@/lib/alert"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"

export default function RecordScreen() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [record, setRecord] = useState<RecordFileDataWithMetadata | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    let cancelled = false
    let uri: string | undefined
    setRecord(null)
    setError("")
    setSaved(false)
    void getRecordMetadata(recordId)
      .then(value => {
        uri = value.uri
        if (cancelled) URL.revokeObjectURL(uri)
        else setRecord(value)
      })
      .catch(error => {
        if (!cancelled) setError(String(error))
      })
    return () => {
      cancelled = true
      if (uri) URL.revokeObjectURL(uri)
    }
  }, [recordId])
  async function transcribe() {
    if (!record || busy) return
    setBusy(true)
    setError("")
    let id = record.metadata.transcribe.id
    try {
      id = await queueTranscription(id, record.uri)
      const queued = { transcribe: { id, status: "QUEUED" as const, text: "" } }
      await updateMetadata(record.filename, queued)
      setRecord({ ...record, metadata: queued })
      const result = await pollTranscription(id, 120)
      const metadata = {
        transcribe: { id, status: result.status, text: result.text ?? "" },
      }
      await updateMetadata(record.filename, metadata)
      setRecord({ ...record, metadata })
      if (result.status === "FAILED")
        setError("Transcription failed. Try again.")
    } catch (error) {
      setError(String(error))
    } finally {
      setBusy(false)
    }
  }
  async function saveNote() {
    if (!record || busy) return
    setBusy(true)
    try {
      await createLocalNote(record.title, record.metadata.transcribe.text)
      await queryClient.invalidateQueries({ queryKey: NOTES_LOCAL_QUERY_KEY })
      setSaved(true)
    } catch (error) {
      setError(String(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <ScrollView className="flex-1 bg-background p-6">
      <View className="mx-auto w-full max-w-3xl gap-4">
        <Button variant="ghost" onPress={() => router.replace("/records")}>
          <MText>Back to recordings</MText>
        </Button>
        {error && (
          <MText accessibilityRole="alert" className="text-red-500">
            {error}
          </MText>
        )}
        {record && (
          <>
            <MText className="text-3xl font-bold">{record.title}</MText>
            <MText>{record.dateString}</MText>
            <audio
              aria-label="Recording playback"
              controls
              src={record.uri}
              style={{ width: "100%" }}
            />
            <MText selectable>
              {record.metadata.transcribe.text ||
                "Transcribe this recording to create a note."}
            </MText>
            <Button
              isDisabled={busy}
              onPress={() => {
                void transcribe()
              }}
            >
              <MText>{busy ? "Working…" : "Transcribe"}</MText>
            </Button>
            <Button
              isDisabled={busy || saved || !record.metadata.transcribe.text}
              onPress={() => {
                void saveNote()
              }}
            >
              <MText>{saved ? "Note saved" : "Save transcript as note"}</MText>
            </Button>
            <Button
              variant="outline"
              onPress={() => {
                void getRecording(record.filename)
                  .then(value =>
                    downloadBlob(
                      value.blob,
                      `${record.title}.${record.extension}`
                    )
                  )
                  .catch(error => setError(String(error)))
              }}
            >
              <MText>Download audio</MText>
            </Button>
            <Button
              variant="danger"
              isDisabled={busy}
              onPress={() =>
                Alert.alert("Delete recording?", record.title, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      void deleteRecordFile(record)
                        .then(() => router.replace("/records"))
                        .catch(error => setError(String(error)))
                    },
                  },
                ])
              }
            >
              <MText>Delete recording</MText>
            </Button>
          </>
        )}
      </View>
    </ScrollView>
  )
}

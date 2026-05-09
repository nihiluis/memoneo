import AudioPlayer from "@/components/audio/AudioPlayer"
import AuthScreen from "@/components/auth/AuthScreen"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import MView from "@/components/reusables/MView"
import MRootView from "@/components/ui/MRootView"
import {
  getRecordMetadata,
  RecordFileDataWithMetadata,
  RecordFileMetadata,
  updateMetadata,
} from "@/lib/audio/file"
import { Stack, useLocalSearchParams } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { Alert } from "react-native"
import { isAvailableAsync, shareAsync } from "expo-sharing"
import { pollTranscription, queueTranscription } from "@/lib/transcribe"
import { useMutation } from "@tanstack/react-query"
import { uploadTranscript } from "@/lib/upload/api"
import { authAtom, tokenAtom } from "@/lib/auth/state"
import { useAtomValue } from "jotai"

export default function RecordScreen() {
  const token = useAtomValue(tokenAtom)
  const auth = useAtomValue(authAtom)
  const { recordId } = useLocalSearchParams()
  const [metadata, setMetadata] = useState<RecordFileMetadata | null>(null)
  const [recordFileData, setRecordFileData] =
    useState<RecordFileDataWithMetadata | null>(null)
  const [pendingTranscription, setPendingTranscription] =
    useState<boolean>(false)

  const hasTranscript =
    metadata?.transcribe.status === "COMPLETED" &&
    metadata?.transcribe.text.length > 0

  useEffect(() => {
    if (!recordId) {
      setRecordFileData(null)
      setMetadata(null)
      return
    }

    getRecordMetadata(recordId as string).then(fileData => {
      setRecordFileData(fileData)
      setMetadata(fileData.metadata)
    })
  }, [recordId])

  const openRecordExternally = useCallback(async () => {
    if (!recordFileData) return

    const available = await isAvailableAsync()
    if (!available) {
      Alert.alert("Error", "Sharing is not available.")
      return
    }

    try {
      console.log("Sharing audio file", recordFileData.uri)
      await shareAsync(recordFileData.uri, {
        mimeType: "audio/mpeg",
        dialogTitle: "Open audio file",
      })
    } catch (error) {
      console.error("Failed to share record", error)
      Alert.alert("Error", "Failed to share record.")
    }
  }, [recordFileData])

  const transcribeMutation = useMutation({
    mutationFn: async (uri: string) => {
      return await queueTranscription(metadata?.transcribe.id ?? "", uri)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!recordFileData) return
      if (!auth.enckey) return
      if (!hasTranscript) return
      return await uploadTranscript(
        token,
        auth.enckey.salt,
        auth.user.id,
        recordFileData,
        metadata.transcribe.text
      )
    },
  })

  const syncMetadata = useCallback(
    async (uri: string, newMetadata: RecordFileMetadata) => {
      if (!recordFileData) return
      if (pendingTranscription) return

      await updateMetadata(uri, newMetadata)
      setMetadata(newMetadata)
    },
    [recordFileData, pendingTranscription]
  )

  const transcribeRecord = useCallback(async () => {
    if (!recordFileData) return
    if (pendingTranscription) return

    try {
      const id = await transcribeMutation.mutateAsync(recordFileData.uri)

      await syncMetadata(recordFileData.uri, {
        transcribe: { id, text: "", status: "QUEUED" },
      })
      setPendingTranscription(true)

      try {
        const finalResult = await pollTranscription(id)

        console.log("transcribe finalResult", finalResult)
        await syncMetadata(recordFileData.uri, {
          transcribe: {
            id,
            text: finalResult.text ?? "",
            status: finalResult.status,
          },
        })
      } catch (error) {
        console.error("Failed to poll transcription", error)
        await syncMetadata(recordFileData.uri, {
          transcribe: {
            id,
            text: "",
            status: "error",
          },
        })
      } finally {
        setPendingTranscription(false)
      }
    } catch (error) {
      console.error("Failed to queue transcription", error)
      Alert.alert("Error", "Failed to queue transcription.")
    }
  }, [recordFileData, transcribeMutation])

  return (
    <AuthScreen>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <MRootView>
        {!recordFileData && (
          <MView className="flex-1">
            <MText className="text-muted-foreground">
              Record not available.
            </MText>
          </MView>
        )}
        {recordFileData && (
          <MView className="mt-12 flex-1">
            <MView className="flex-1 gap-4">
              <MText className="text-4xl font-bold">
                {recordFileData.title}
              </MText>
              <MText className="text-lg text-muted-foreground">
                {hasTranscript
                  ? metadata.transcribe.text
                  : "Click on the transcribe button to convert this audio file to text."}
              </MText>
            </MView>
            <MView className="gap-4">
              <AudioPlayer uri={recordFileData.uri} />
              <Button
                variant="outline"
                size="lg"
                onPress={openRecordExternally}>
                <MText>Share</MText>
              </Button>
              {!hasTranscript && (
                <Button variant="outline" size="lg" onPress={transcribeRecord}>
                  <MText>Transcribe</MText>
                </Button>
              )}
              {hasTranscript && (
                <Button
                  variant="outline"
                  size="lg"
                  onPress={() => uploadMutation.mutate()}>
                  <MText>Upload</MText>
                </Button>
              )}
              <Button variant="danger" size="lg">
                <MText>Delete</MText>
              </Button>
            </MView>
          </MView>
        )}
      </MRootView>
    </AuthScreen>
  )
}

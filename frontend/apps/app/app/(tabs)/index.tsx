import AudioPlayer from "@/components/audio/AudioPlayer"
import AudioRecorder from "@/components/audio/AudioRecorder"
import AuthScreen from "@/components/auth/AuthScreen"
import { FormInput } from "@/components/form/FormInput"
import Logo from "@/components/Logo"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import MView from "@/components/reusables/MView"
import MRootView from "@/components/ui/MRootView"
import { audioAtom } from "@/lib/audio/state"
import { useAtom } from "jotai"
import { useForm } from "react-hook-form"
import { Directory, File, Paths } from "expo-file-system"
import { useState } from "react"
import { Trash } from "@/lib/icons"
import { createMetadataFile } from "@/lib/audio/file"

export default function HomeScreen() {
  const [audioState, setAudioState] = useAtom(audioAtom)
  const [{ success, savedTitle }, setSuccessState] = useState({
    success: false,
    savedTitle: "",
  })

  const hasAudioRecording = !!audioState.uri

  function discardAudioRecording() {
    setAudioState({ uri: "" })
  }

  function saveAudioRecording(data: RecordFormData) {
    if (!audioState.uri) {
      console.error("No audio recording to save")
      return
    }

    const tmpAudioFile = new File(audioState.uri)
    // Assumption: file is a valid m4a file
    const newFileName = `${Date.now()}-${data.title}.m4a`

    try {
      const recordsDir = new Directory(Paths.document, "records")
      if (!recordsDir.exists) {
        recordsDir.create()
      }
      const newFile = new File(recordsDir.uri, newFileName)
      tmpAudioFile.move(newFile)
      createMetadataFile(newFile)
      setSuccessState({ success: true, savedTitle: data.title })
    } catch (error) {
      console.error("Error while saving record", error)
    }
  }

  function resetState() {
    setSuccessState({ success: false, savedTitle: "" })
    setAudioState({ uri: "" })
  }

  return (
    <AuthScreen>
      <MRootView>
        <MView>
          <MView className="items-center mb-4">
            <Logo width={128} height={128} />
          </MView>
          {!success && (
            <MView>
              <MView className="mb-8">
                <MText className="text-xl text-muted-foreground text-center">
                  {hasAudioRecording
                    ? "Finalize the recording."
                    : "Record your message."}
                </MText>
              </MView>
              {!hasAudioRecording && <AudioRecorder />}
              {hasAudioRecording && (
                <MView className="">
                  <MView className="flex-row justify-center gap-4 mb-8">
                    <AudioPlayer uri={audioState.uri} />
                    <Button size="lg" isIconOnly onPress={discardAudioRecording}>
                      <Trash size={24} />
                    </Button>
                  </MView>
                  <RecordForm saveAudioRecording={saveAudioRecording} />
                </MView>
              )}
            </MView>
          )}
          {success && savedTitle && (
            <MView className="flex gap-8">
              <MText className="text-xl text-muted-foreground text-center">
                {savedTitle} record saved to file system.
              </MText>
              <Button size="lg" onPress={resetState}>
                <MText>Reset</MText>
              </Button>
            </MView>
          )}
        </MView>
      </MRootView>
    </AuthScreen>
  )
}

interface FormProps {
  saveAudioRecording: (data: RecordFormData) => void
}

type RecordFormData = {
  title: string
}

function RecordForm({ saveAudioRecording }: FormProps) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RecordFormData>({
    defaultValues: {
      title: "",
    },
  })

  return (
    <MView>
      <FormInput
        control={control}
        name="title"
        label="Title"
        placeholder=""
        autoCapitalize="none"
        error={errors.title?.message}
        rules={{
          required: "Title is required",
          pattern: {
            value: /^[a-zA-Z0-9]+$/,
            message: "Only alphanumeric characters allowed"
          },
          minLength: {
            value: 3,
            message: "Title must be at least 3 characters long",
          },
          maxLength: {
            value: 64,
            message: "Title must be at most 100 characters long",
          },
        }}
      />
      <Button size="lg" onPress={handleSubmit(saveAudioRecording)}>
        <MText>Save</MText>
      </Button>
    </MView>
  )
}

import { useEffect, useRef, useState } from "react"
import { View } from "react-native"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import { saveRecording } from "@/lib/audio/file.web"
import { Alert } from "@/lib/alert"
import { useColorScheme } from "@/hooks/useColorScheme"

export default function AudioRecorder({ onSaved }: { onSaved?: () => void }) {
  const { isDarkColorScheme } = useColorScheme()
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const mounted = useRef(true)
  const [status, setStatus] = useState<
    "idle" | "starting" | "recording" | "paused" | "saving"
  >("idle")
  const [title, setTitle] = useState("")
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (recorder.current?.state !== "inactive") recorder.current?.stop()
      stream.current?.getTracks().forEach(track => track.stop())
    }
  }, [])
  async function start() {
    setStatus("starting")
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        throw new Error(
          "Recording requires a supported browser and HTTPS (or localhost)."
        )
      }
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mounted.current) {
        media.getTracks().forEach(track => track.stop())
        return
      }
      stream.current = media
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find(type => MediaRecorder.isTypeSupported(type))
      const next = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
      recorder.current = next
      const chunks: Blob[] = []
      let failed = false
      next.onerror = () => {
        failed = true
        media.getTracks().forEach(track => track.stop())
        if (mounted.current) {
          setStatus("idle")
          Alert.alert(
            "Recording failed",
            "The microphone stopped unexpectedly. Try recording again."
          )
        }
      }
      next.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data)
      }
      next.onstop = async () => {
        media.getTracks().forEach(track => track.stop())
        if (!mounted.current || failed) return
        setStatus("saving")
        try {
          await saveRecording(new Blob(chunks, { type: next.mimeType }), title)
          onSaved?.()
        } catch (error) {
          Alert.alert("Save recording failed", String(error))
        } finally {
          if (mounted.current) setStatus("idle")
        }
      }
      next.start()
      setStatus("recording")
    } catch (error) {
      stream.current?.getTracks().forEach(track => track.stop())
      Alert.alert("Recording failed", String(error))
      setStatus("idle")
    }
  }
  const busy = status === "starting" || status === "saving"
  return (
    <View className="gap-3 border-b border-border p-4">
      <input
        aria-label="Recording title"
        placeholder="Voice note title"
        value={title}
        disabled={status !== "idle"}
        onChange={event => setTitle(event.target.value)}
        style={{
          padding: 12,
          borderRadius: 6,
          border: "1px solid #71717a",
          background: "transparent",
          color: isDarkColorScheme ? "#fafafa" : "#18181b",
        }}
      />
      <View className="flex-row gap-3">
        <Button
          isDisabled={busy}
          onPress={() => {
            if (status === "idle") void start()
            else {
              setStatus("saving")
              recorder.current?.stop()
            }
          }}
        >
          <MText>
            {busy
              ? "Please wait…"
              : status === "idle"
              ? "Record"
              : "Stop and save"}
          </MText>
        </Button>
        {(status === "recording" || status === "paused") && (
          <Button
            variant="outline"
            onPress={() => {
              if (status === "paused") {
                recorder.current?.resume()
                setStatus("recording")
              } else {
                recorder.current?.pause()
                setStatus("paused")
              }
            }}
          >
            <MText>{status === "paused" ? "Resume" : "Pause"}</MText>
          </Button>
        )}
      </View>
      <MText accessibilityLiveRegion="polite">
        {status === "recording"
          ? "Recording…"
          : status === "paused"
          ? "Paused"
          : ""}
      </MText>
    </View>
  )
}

import axios from "axios"
export async function uploadRecording(id: string, uri: string) {
  const blob = await (await fetch(uri)).blob()
  const extension = blob.type.includes("mp4")
    ? "m4a"
    : blob.type.includes("ogg")
    ? "ogg"
    : "webm"
  const form = new FormData()
  form.append("file", blob, `recording.${extension}`)
  return axios.post(
    `${process.env.EXPO_PUBLIC_TRANSCRIBE_BASE_URL}/transcribe/${id}`,
    form,
    { timeout: 30000 }
  )
}

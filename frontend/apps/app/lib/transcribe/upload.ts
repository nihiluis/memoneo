import axios from "axios"
export async function uploadRecording(id: string, uri: string) {
  const form = new FormData()
  // React Native multipart uploads use a local URI instead of a browser Blob.
  // @ts-expect-error React Native's FormData accepts URI descriptors.
  form.append("file", { name: "recording.m4a", uri, type: "audio/x-m4a" })
  return axios.post(
    `${process.env.EXPO_PUBLIC_TRANSCRIBE_BASE_URL}/transcribe/${id}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 1000 }
  )
}

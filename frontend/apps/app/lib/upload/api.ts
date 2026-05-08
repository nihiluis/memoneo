import enckey from "@/modules/enckey"
import { RecordFileData } from "../audio/file"
import { randomUUID } from "expo-crypto"
import axios from "axios"
import { getApiUrl } from "../settings/urls"

export async function uploadTranscript(
  token: string,
  ivStr: string,
  userId: string,
  recordFileData: RecordFileData,
  transcript: string,
) {
  console.log("Uploading transcript", transcript)
  let encryptedText = ""
  let textIv = ""
  try {
    const encryptedResult = await enckey.encryptText(transcript)
    // The first 12 bytes (16 chars in base64) of the result is the IV
    textIv = encryptedResult.substring(0, 16)
    encryptedText = encryptedResult.substring(16)
  } catch (error) {
    console.error("Failed to encrypt transcript", error)
    return
  }

  const uuid = randomUUID()

  const title = recordFileData.title
  const date = new Date(recordFileData.timestamp).toISOString()

  const note = {
    id: uuid,
    body: encryptedText,
    body_iv: textIv,
    title,
    date,
    archived: false,
    version: 1,
    user_id: userId,
  }

  try {
    console.log("Uploading note", note)
    const res = await axios.put(
      getApiUrl("/note"),
      note,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      }
    )
    console.log("Uploaded transcript", res.data)
  } catch (error) {
    console.error("Failed to upload transcript", error)
    return
  }
}

import {
  databaseRequest,
  deleteRecord,
  listRecords,
  putRecord,
} from "@/lib/web/database"
import type {
  RecordFileData,
  RecordFileMetadata,
  RecordFileDataWithMetadata,
} from "./file"
export type {
  RecordFileData,
  RecordFileMetadata,
  RecordFileDataWithMetadata,
} from "./file"

type Recording = {
  id: string
  title: string
  timestamp: number
  blob: Blob
  metadata: RecordFileMetadata
}
export async function saveRecording(blob: Blob, title: string) {
  const id = crypto.randomUUID()
  await putRecord("recordings", {
    id,
    title: title.trim() || "Voice note",
    timestamp: Date.now(),
    blob,
    metadata: { transcribe: { status: "UNINITIALIZED", text: "", id: "" } },
  } satisfies Recording)
  return id
}
function data(record: Recording, uri = record.id): RecordFileData {
  const extension = record.blob.type.includes("mp4")
    ? "m4a"
    : record.blob.type.includes("ogg")
    ? "ogg"
    : "webm"
  return {
    filename: record.id,
    title: record.title,
    timestamp: record.timestamp,
    uri,
    extension,
    dateString: new Date(record.timestamp).toLocaleString(),
  }
}
export async function getRecordFiles(): Promise<RecordFileData[]> {
  return (await listRecords<Recording>("recordings"))
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(record => data(record))
}
export async function getRecording(id: string): Promise<Recording> {
  const record = await databaseRequest<Recording | undefined>(
    "recordings",
    "readonly",
    store => store.get(id)
  )
  if (!record) throw new Error("Recording not found.")
  return record
}
export async function getRecordMetadata(
  id: string
): Promise<RecordFileDataWithMetadata> {
  const record = await getRecording(id)
  return {
    ...data(record, URL.createObjectURL(record.blob)),
    metadata: record.metadata,
  }
}
export async function updateMetadata(id: string, metadata: RecordFileMetadata) {
  await putRecord("recordings", { ...(await getRecording(id)), metadata })
}
export async function deleteRecordFile(file: RecordFileData) {
  await deleteRecord("recordings", file.filename)
}

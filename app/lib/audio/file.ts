import { Paths, Directory, File } from "expo-file-system/next"
import { TranscriptionStatus } from "../transcribe"

export interface RecordFileMetadata {
  transcribe: {
    status: TranscriptionStatus
    text: string
    id?: string
  }
}

export function getRecordDir() {
  return new Directory(Paths.document, "records")
}

export function createMetadataFile(file: File) {
  const data: RecordFileMetadata = {
    transcribe: {
      status: "uninitialized",
      text: "",
    },
  }

  const uri = file.uri.replace(".m4a", ".json")
  const metadataFile = new File(uri)
  metadataFile.create()
  metadataFile.write(JSON.stringify(data))
}

export function updateMetadata(
  uri: string,
  metadata: Partial<RecordFileMetadata>
) {
  const metadataFile = new File(uri.replace(".m4a", ".json"))

  const existingMetadata = JSON.parse(metadataFile.text()) as RecordFileMetadata

  metadataFile.write(JSON.stringify({ ...existingMetadata, metadata }))
}

export interface RecordFileData {
  title: string
  uri: string
  filename: string
  timestamp: number
  extension: string
  dateString: string
}

export type RecordFileDataWithMetadata = RecordFileData & {
  metadata: RecordFileMetadata
}

export function getRecordMetadata(
  filename: string
): RecordFileDataWithMetadata {
  const recordDir = getRecordDir()
  const file = new File(recordDir, filename)

  const nameSplit = filename.split("-")
  const fileNameSplit = nameSplit[1].split(".")
  const title = fileNameSplit[0]
  const timestamp = parseInt(nameSplit[0])
  const extension = fileNameSplit[1]

  const metadataFile = new File(recordDir, filename.split(".")[0] + ".json")

  const metadata = JSON.parse(metadataFile.text()) as RecordFileMetadata

  return {
    filename: file.name,
    title,
    uri: file.uri,
    timestamp,
    extension,
    dateString: timestampToDateString(timestamp),
    metadata,
  }
}

function timestampToDateString(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export function getRecordFiles(): RecordFileData[] {
  const recordDir = getRecordDir()
  const contents = recordDir.list()

  const files: RecordFileData[] = []

  for (const item of contents) {
    if (item instanceof Directory) {
      continue
    }

    if (item.name.endsWith(".json")) {
      continue
    }

    const nameSplit = item.name.split("-")
    const fileNameSplit = nameSplit[1].split(".")
    const title = fileNameSplit[0]
    const timestamp = parseInt(nameSplit[0])
    const extension = fileNameSplit[1]

    const fileData: RecordFileData = {
      filename: item.name,
      title: title,
      uri: item.uri,
      timestamp,
      extension,
      dateString: timestampToDateString(timestamp),
    }
    files.push(fileData)
  }

  return files.sort((a, b) => b.timestamp - a.timestamp)
}

export function deleteRecordFile(fileData: RecordFileData) {
  const file = new File(fileData.uri)
  file.delete()
}

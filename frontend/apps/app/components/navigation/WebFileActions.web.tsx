import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { useRouter } from "expo-router"
import { View } from "react-native"
import { parseMarkdownNoteFile, serializeMarkdownNote } from "@memoneo/shared"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import { createLocalNote } from "@/lib/notes/local"
import { NOTES_LOCAL_QUERY_KEY } from "@/lib/notes/query"
import { selectedNoteAtom } from "@/lib/notes/state"
import { downloadBlob } from "@/lib/web/download"
import { Alert } from "@/lib/alert"

export function WebFileActions() {
  const input = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const note = useAtomValue(selectedNoteAtom)
  const router = useRouter()
  const [importing, setImporting] = useState(false)
  async function importFiles(files: FileList | null) {
    if (!files) return
    setImporting(true)
    try {
      for (const file of Array.from(files)) {
        const parsed = parseMarkdownNoteFile(await file.text())
        await createLocalNote(
          parsed.metadata.title || file.name.replace(/\.md$/i, ""),
          parsed.content
        )
      }
    } catch (error) {
      Alert.alert("Import failed", String(error))
    } finally {
      await queryClient.invalidateQueries({ queryKey: NOTES_LOCAL_QUERY_KEY })
      setImporting(false)
      if (input.current) input.current.value = ""
    }
  }
  return (
    <View className="gap-2 border-t border-border bg-background p-3">
      <input
        ref={input}
        type="file"
        accept=".md,text/markdown"
        multiple
        hidden
        onChange={event => {
          void importFiles(event.target.files)
        }}
      />
      <Button
        variant="outline"
        isDisabled={importing}
        onPress={() => input.current?.click()}
      >
        <MText>{importing ? "Importing…" : "Import markdown"}</MText>
      </Button>
      <Button
        variant="outline"
        isDisabled={!note || note.id === "unsaved"}
        onPress={() => {
          if (note)
            downloadBlob(
              new Blob(
                [serializeMarkdownNote(note, note.decryptedBody ?? note.body)],
                { type: "text/markdown;charset=utf-8" }
              ),
              `${note.file?.title ?? note.title}.md`
            )
        }}
      >
        <MText>Export selected note</MText>
      </Button>
      <Button variant="ghost" onPress={() => router.push("/records")}>
        <MText>Voice recordings</MText>
      </Button>
    </View>
  )
}

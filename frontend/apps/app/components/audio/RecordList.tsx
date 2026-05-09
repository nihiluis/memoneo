import {
  deleteRecordFile,
  getRecordFiles,
  RecordFileData,
} from "@/lib/audio/file"
import { FlashList } from "@shopify/flash-list"
import { useCallback, useEffect, useState } from "react"
import MView from "../reusables/MView"
import { MText } from "../reusables/MText"
import { Button } from "../reusables/Button"
import { Separator } from "../reusables/Separator"
import { cn } from "@/lib/reusables/utils"
import { useFocusEffect, useRouter } from "expo-router"
import { useColorScheme } from "react-native"
import { EllipsisVertical } from "@/lib/icons/EllipsisVertical"
import { DropdownMenu, DropdownMenuTrigger } from "../reusables/DropdownMenu"
import RecordItemDropdown from "./RecordItemDropdown"

export function RecordList() {
  const router = useRouter()

  const [recordFiles, setRecordFiles] = useState<RecordFileData[]>([])

  useFocusEffect(
    useCallback(() => {
      const recordFiles = getRecordFiles()
      console.log("Refreshing record files", recordFiles)
      setRecordFiles(recordFiles)
    }, [setRecordFiles])
  )

  const deleteRecord = useCallback(
    (fileData: RecordFileData) => {
      deleteRecordFile(fileData)
      setRecordFiles(recordFiles.filter(f => f.uri !== fileData.uri))
    },
    [recordFiles]
  )

  const inspectRecord = useCallback((file: RecordFileData) => {
    router.push(`/records/${file.filename}` as any)
  }, [])

  return (
    <MView className="flex-1">
      {recordFiles.length === 0 && (
        <MView className="flex-1 items-center justify-center">
          <MText className="text-lg text-muted-foreground">
            No records found.
          </MText>
        </MView>
      )}
      {recordFiles.length > 0 && <MView
        className={cn("flex-1 gap-2 h-full")}
        style={{ minHeight: 1 }}>
        <FlashList
          data={recordFiles}
          keyExtractor={item => item.uri}
          renderItem={({ item }) => (
            <RecordItem
              item={item}
              handleDelete={deleteRecord}
              handleInspect={inspectRecord}
            />
          )}
        />
      </MView>}
    </MView>
  )
}

interface RecordItemProps {
  item: RecordFileData
  handleDelete: (file: RecordFileData) => void
  handleInspect: (file: RecordFileData) => void
}

function RecordItem({ item, handleInspect, handleDelete }: RecordItemProps) {
  return (
    <MView>
      <Button
        className="flex-1 py-4 px-2"
        variant="ghost"
        onPress={() => handleInspect(item)}>
        <MView className="flex-row items-center justify-between">
          <MView className="flex-1">
            <MText className="text-2xl">{item.title}</MText>
            <MText className="text-sm text-muted-foreground">
              {item.dateString}
            </MText>
          </MView>
          <MView className="flex-row gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" isIconOnly variant="ghost" onPress={() => {}}>
                  <EllipsisVertical size={32} className="text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <RecordItemDropdown
                handleDelete={() => handleDelete(item)}
                handleInspect={() => handleInspect(item)}
              />
            </DropdownMenu>
          </MView>
        </MView>
      </Button>

      <Separator />
    </MView>
  )
}

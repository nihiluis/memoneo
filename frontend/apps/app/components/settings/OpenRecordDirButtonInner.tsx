import { MText } from "../reusables/MText"
import { Button } from "../reusables/Button"
import { getRecordDir } from "@/lib/audio/file"
import { Alert } from "react-native"

interface OpenRecordDirButtonInnerProps {
  openRecordDir: () => void
}

export default function OpenRecordDirButtonInner({
  openRecordDir,
}: OpenRecordDirButtonInnerProps) {
  return (
    <Button variant="ghost" size="lg" onPress={openRecordDir}>
      <MText>Open record dir</MText>
    </Button>
  )
}

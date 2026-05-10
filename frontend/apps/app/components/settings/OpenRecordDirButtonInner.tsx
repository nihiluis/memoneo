import { MText } from "../reusables/MText"
import { Button } from "../reusables/Button"

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

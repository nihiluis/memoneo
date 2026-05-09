import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/reusables/DropdownMenu"
import { MText } from "@/components/reusables/MText"

interface RecordItemDropdownProps {
  handleDelete: () => void
  handleInspect: () => void
}

export default function RecordItemDropdown({ handleDelete, handleInspect }: RecordItemDropdownProps) {
  return (
    <DropdownMenuContent>
      <DropdownMenuItem onPress={handleInspect}>
        <MText>Inspect</MText>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onPress={handleDelete}>
        <MText className="text-destructive">Delete</MText>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

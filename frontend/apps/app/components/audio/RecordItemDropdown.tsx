import Animated, { FadeIn } from "react-native-reanimated"
import { Button } from "@/components/reusables/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/reusables/DropdownMenu"
import { MText } from "@/components/reusables/MText"

interface RecordItemDropdownProps {
  handleDelete: () => void
  handleInspect: () => void
}

export default function RecordItemDropdown({ handleDelete, handleInspect }: RecordItemDropdownProps) {
  return (
    <DropdownMenuContent
      insets={{ bottom: 0, left: 0, right: 0 }}
      className="w-64 native:w-72">
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

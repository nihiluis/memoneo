import { Plus } from "lucide-react-native"

import { DrawerAction } from "../DrawerAction"
import { useCreateNoteDrawerMutation } from "./mutations"

type NewNoteDrawerActionProps = {
  folderId: string
}

export function NewNoteDrawerAction({ folderId }: NewNoteDrawerActionProps) {
  const createNoteMutation = useCreateNoteDrawerMutation()

  return (
    <DrawerAction
      disabled={createNoteMutation.isPending}
      icon={<Plus size={32} color="#a1a1aa" />}
      label="New note"
      onPress={() => createNoteMutation.mutate(folderId)}
    />
  )
}

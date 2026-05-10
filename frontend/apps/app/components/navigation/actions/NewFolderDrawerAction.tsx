import { FolderPlus } from "lucide-react-native"

import { DrawerAction } from "../DrawerAction"
import { useCreateFolderDrawerMutation } from "./mutations"

type NewFolderDrawerActionProps = {
  folderId: string
}

export function NewFolderDrawerAction({ folderId }: NewFolderDrawerActionProps) {
  const createFolderMutation = useCreateFolderDrawerMutation()

  return (
    <DrawerAction
      disabled={createFolderMutation.isPending}
      icon={<FolderPlus size={32} color="#a1a1aa" />}
      label="New folder"
      onPress={() => createFolderMutation.mutate(folderId)}
    />
  )
}

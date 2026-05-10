import { Upload } from "lucide-react-native"

import { DrawerAction } from "../DrawerAction"

type UploadDrawerActionProps = {
  disabled: boolean
  onPress: () => void
}

export function UploadDrawerAction({ disabled, onPress }: UploadDrawerActionProps) {
  return (
    <DrawerAction
      disabled={disabled}
      icon={<Upload size={32} color="#a1a1aa" />}
      label="Upload"
      onPress={onPress}
    />
  )
}

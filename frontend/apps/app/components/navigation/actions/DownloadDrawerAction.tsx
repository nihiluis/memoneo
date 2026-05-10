import { Download } from "lucide-react-native"

import { DrawerAction } from "../DrawerAction"

type DownloadDrawerActionProps = {
  disabled: boolean
  onPress: () => void
}

export function DownloadDrawerAction({ disabled, onPress }: DownloadDrawerActionProps) {
  return (
    <DrawerAction
      disabled={disabled}
      icon={<Download size={32} color="#a1a1aa" />}
      label="Download"
      onPress={onPress}
    />
  )
}

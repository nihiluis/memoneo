import { RefreshCw } from "lucide-react-native"

import { DrawerAction } from "../DrawerAction"

type SyncDrawerActionProps = {
  disabled: boolean
  onPress: () => void
}

export function SyncDrawerAction({ disabled, onPress }: SyncDrawerActionProps) {
  return (
    <DrawerAction
      disabled={disabled}
      icon={<RefreshCw size={32} color="#a1a1aa" />}
      label="Sync"
      onPress={onPress}
    />
  )
}

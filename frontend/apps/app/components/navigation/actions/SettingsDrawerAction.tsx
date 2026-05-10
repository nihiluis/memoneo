import { useRouter } from "expo-router"
import { Settings } from "lucide-react-native"
import { useCallback } from "react"

import { useAppDrawer } from "../appDrawerContext"
import { DrawerAction } from "../DrawerAction"

export function SettingsDrawerAction() {
  const router = useRouter()
  const { closeDrawer } = useAppDrawer()

  const openSettings = useCallback(() => {
    closeDrawer()
    router.push("/settings")
  }, [closeDrawer, router])

  return (
    <DrawerAction
      icon={<Settings size={32} color="#a1a1aa" />}
      label="Settings"
      onPress={openSettings}
    />
  )
}

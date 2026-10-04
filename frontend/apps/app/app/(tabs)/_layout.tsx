import { Stack } from "expo-router"

import { AppDrawer } from "@/components/navigation/AppDrawer"

export default function AppLayout() {
  return (
    <AppDrawer>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="records" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="backend-settings" />
      </Stack>
    </AppDrawer>
  )
}

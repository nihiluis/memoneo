import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import "react-native-reanimated"
import "@/global.css"

import { useColorScheme } from "@/hooks/useColorScheme"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import AuthProvider from "@/components/auth/AuthProvider"
import { SetupProvider } from "@/components/setup/SetupProvider"
import { PortalHost } from "@rn-primitives/portal"

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

export default function RootLayout() {
  const { colorScheme } = useColorScheme()
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <SetupProvider>
          <AuthProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="records/[recordId]" options={{}} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthProvider>
        </SetupProvider>
      </QueryClientProvider>
      <StatusBar style="auto" />
      <PortalHost />
    </ThemeProvider>
  )
}

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import * as SystemUI from "expo-system-ui"
import { useEffect } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import "react-native-reanimated"
import "@/global.css"

import { useColorScheme } from "@/hooks/useColorScheme"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import AuthProvider from "@/components/auth/AuthProvider"
import { SetupProvider } from "@/components/setup/SetupProvider"

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()
const THEME_COLORS = {
  dark: {
    background: "#09090b",
    statusBarStyle: "light" as const,
  },
  light: {
    background: "#ffffff",
    statusBarStyle: "dark" as const,
  },
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === "dark"
  const themeColors = isDark ? THEME_COLORS.dark : THEME_COLORS.light
  const navigationTheme = isDark ? DarkTheme : DefaultTheme
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(themeColors.background)
  }, [themeColors.background])

  if (!loaded) {
    return null
  }

  return (
    <GestureHandlerRootView
      style={{ backgroundColor: themeColors.background, flex: 1 }}>
      <ThemeProvider
        value={{
          ...navigationTheme,
          colors: {
            ...navigationTheme.colors,
            background: themeColors.background,
          },
        }}>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <SetupProvider>
              <AuthProvider>
                <BottomSheetModalProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="auth/login" />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                </BottomSheetModalProvider>
              </AuthProvider>
            </SetupProvider>
          </QueryClientProvider>
        </KeyboardProvider>
        <StatusBar
          backgroundColor={themeColors.background}
          style={themeColors.statusBarStyle}
        />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

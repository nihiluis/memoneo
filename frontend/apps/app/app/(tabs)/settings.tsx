import { useAppDrawer } from "@/components/navigation/AppDrawer"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import { authAtom, tokenAtom } from "@/lib/auth/state"
import { useAtomValue, useSetAtom } from "jotai"
import { Menu } from "lucide-react-native"
import { Pressable, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"

export default function SettingsScreen() {
  const auth = useAtomValue(authAtom)
  const setAuth = useSetAtom(authAtom)
  const setToken = useSetAtom(tokenAtom)
  const { openDrawer } = useAppDrawer()
  const router = useRouter()

  function signOff() {
    setToken("")
    setAuth({
      isAuthenticated: false,
      isLoading: false,
      user: { id: "", mail: "" },
      enckey: null,
      error: "",
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="h-14 flex-row items-center border-b border-border px-4">
        <Pressable
          accessibilityRole="button"
          className="mr-3 h-10 w-10 items-center justify-center rounded-md"
          onPress={openDrawer}>
          <Menu size={24} color="#a1a1aa" />
        </Pressable>
        <MText className="flex-1 text-lg font-semibold">Settings</MText>
      </View>
      <View className="mt-4 items-center border-t border-border pt-4">
        {auth.isAuthenticated ? (
          <Button size="lg" variant="ghost" onPress={signOff}>
            <MText>Sign off</MText>
          </Button>
        ) : (
          <Button
            size="lg"
            variant="ghost"
            onPress={() => router.push("/auth/login")}>
            <MText>Sign in</MText>
          </Button>
        )}
      </View>
    </SafeAreaView>
  )
}

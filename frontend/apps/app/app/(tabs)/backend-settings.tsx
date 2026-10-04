import { useRouter } from "expo-router"
import { ArrowLeft } from "lucide-react-native"
import { Pressable, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { MText } from "@/components/reusables/MText"
import { BackendSettings } from "@/components/settings/BackendSettings"

export default function BackendSettingsScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="h-14 flex-row items-center border-b border-border px-4">
        <Pressable
          accessibilityLabel="Back to settings"
          accessibilityRole="button"
          className="mr-3 h-10 w-10 items-center justify-center rounded-md hover:bg-accent focus:bg-accent active:bg-accent web:cursor-pointer"
          onPress={() => router.canGoBack() ? router.back() : router.replace("/settings")}
        >
          <ArrowLeft size={24} color="#a1a1aa" />
        </Pressable>
        <MText className="flex-1 text-lg font-semibold">Backend connection</MText>
      </View>
      <ScrollView contentContainerClassName="pb-6">
        <BackendSettings />
      </ScrollView>
    </SafeAreaView>
  )
}

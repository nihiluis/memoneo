import { RecordList } from "@/components/audio/RecordList"
import { useAppDrawer } from "@/components/navigation/AppDrawer"
import { MText } from "@/components/reusables/MText"
import { Menu } from "lucide-react-native"
import { Pressable, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function RecordsScreen() {
  const { openDrawer } = useAppDrawer()

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="h-14 flex-row items-center border-b border-border px-4">
        <Pressable
          accessibilityRole="button"
          className="mr-3 h-10 w-10 items-center justify-center rounded-md"
          onPress={openDrawer}>
          <Menu size={24} color="#a1a1aa" />
        </Pressable>
        <MText className="flex-1 text-lg font-semibold">Records</MText>
      </View>
      <View className="mt-4 flex-1">
        <RecordList />
      </View>
    </SafeAreaView>
  )
}

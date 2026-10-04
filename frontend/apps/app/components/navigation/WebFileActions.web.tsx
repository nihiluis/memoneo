import { useRouter } from "expo-router"
import { View } from "react-native"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"

export function WebFileActions() {
  const router = useRouter()

  return (
    <View className="gap-2 border-t border-border bg-background p-3">
      <Button variant="ghost" onPress={() => router.push("/records")}>
        <MText>Voice recordings</MText>
      </Button>
    </View>
  )
}

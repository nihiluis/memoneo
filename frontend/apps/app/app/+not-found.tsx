import { View } from "react-native"
import { MText } from "@/components/reusables/MText"

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-4">
      <MText className="text-red-500">Not found</MText>
    </View>
  )
}

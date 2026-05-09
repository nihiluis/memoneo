import { authAtom } from "@/lib/auth/state"
import { useAtomValue } from "jotai"
import { View } from "react-native"
import { Spinner } from "../ui/Spinner"

export default function AuthScreen({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAtomValue(authAtom)

  if (isLoading) {
    return <Spinner />
  }

  if (!isAuthenticated) {
    return null
  }
  return <View className="flex-1">{children}</View>
}

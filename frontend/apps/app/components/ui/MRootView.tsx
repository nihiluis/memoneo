import * as React from "react"
import { View } from "react-native"

interface MRootViewProps {
  children?: React.ReactNode
}

export default function MRootView({ children }: MRootViewProps) {
  return (
    <View className="flex-1 justify-center p-4 bg-background">
      {children}
    </View>
  )
}

import * as React from "react"
import { View, ViewProps } from "react-native"

type Props = ViewProps

export default function MView({ children, ...props }: Props) {
  return <View {...props}>{children}</View>
}

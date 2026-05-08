import * as React from "react"
import { View, ViewProps } from "react-native"

interface Props extends ViewProps {}

export default function MView({ children, ...props }: Props) {
  return <View {...props}>{children}</View>
}

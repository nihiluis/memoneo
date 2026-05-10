import React from "react"

type HostProps = Record<string, unknown> & {
  children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode)
}

function host(type: string) {
  return React.forwardRef<unknown, HostProps>(({ children, ...props }, ref) =>
    React.createElement(
      type,
      { ...props, ref },
      typeof children === "function" ? children({ pressed: false }) : children
    )
  )
}

export const Text = host("Text")
export const View = host("View")
export const Pressable = host("Pressable")
export const TextInput = host("TextInput")
export const ScrollView = host("ScrollView")
export const ActivityIndicator = host("ActivityIndicator")

export const Platform = {
  OS: "ios",
  select: <T,>(values: { ios?: T; android?: T; default?: T }) =>
    values.ios ?? values.default,
}

export const StyleSheet = {
  create: <T,>(styles: T) => styles,
  flatten: (style: unknown) => style,
}

export function useColorScheme() {
  return "light"
}

export type TextProps = HostProps
export type TextInputProps = HostProps
export type PressableProps = HostProps & {
  disabled?: boolean
  onLongPress?: () => void
  onPress?: () => void
}

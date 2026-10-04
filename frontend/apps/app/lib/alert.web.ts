import type { AlertButton } from "react-native"
export const Alert = {
  alert(title: string, message = "", buttons?: AlertButton[]) {
    const text = [title, message].filter(Boolean).join("\n\n")
    if (typeof window === "undefined") return
    if (!buttons?.length) {
      window.alert(text)
      return
    }
    const cancel = buttons.find(button => button.style === "cancel")
    const action = buttons.find(button => button.style !== "cancel")
    if (window.confirm(text)) action?.onPress?.()
    else cancel?.onPress?.()
  },
}

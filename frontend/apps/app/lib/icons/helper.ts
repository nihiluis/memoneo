import { styled } from "nativewind"
import { LucideIcon } from "lucide-react-native"

export function iconWithClassName(icon: LucideIcon) {
  return styled(icon, {
    className: {
      target: "style",
      nativeStyleToProp: {
        color: true,
        opacity: true,
      },
    },
  } as never) as LucideIcon
}

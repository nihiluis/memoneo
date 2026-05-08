import * as Slot from "@rn-primitives/slot"
import { SlottableTextProps, TextRef } from "@rn-primitives/types"
import * as React from "react"
import { Text as RNText } from "react-native"
import { cn } from "@/lib/reusables/utils"

const TextClassContext = React.createContext<string | undefined>(undefined)

const MText = React.forwardRef<TextRef, SlottableTextProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext)
    const Component = asChild ? Slot.Text : RNText
    return (
      <Component
        className={cn(
          "text-base text-foreground web:select-text",
          textClass,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
MText.displayName = "Text"

export { MText, TextClassContext }

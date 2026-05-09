import * as React from "react"
import { Text as RNText, type TextProps } from "react-native"
import { cn } from "@/lib/reusables/utils"

const TextClassContext = React.createContext<string | undefined>(undefined)

const MText = React.forwardRef<RNText, TextProps>(
  ({ className, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext)
    return (
      <RNText
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

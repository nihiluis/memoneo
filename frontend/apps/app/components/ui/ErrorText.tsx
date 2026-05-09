import * as React from "react"
import type { Text, TextProps } from "react-native"
import { MText } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"

const ErrorText = React.forwardRef<Text, TextProps>(
  ({ className, ...props }, ref) => {
    return (
      <MText
        ref={ref}
        className={cn("font-medium text-destructive", className)}
        {...props}
      />
    )
  }
)

ErrorText.displayName = "ErrorText"

export { ErrorText }

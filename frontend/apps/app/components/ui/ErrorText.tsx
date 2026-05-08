import * as React from "react"
import { MText } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"
import type { SlottableTextProps, TextRef } from "@rn-primitives/types"

const ErrorText = React.forwardRef<TextRef, SlottableTextProps>(
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

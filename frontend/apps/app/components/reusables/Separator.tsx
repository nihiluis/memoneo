import * as React from "react"
import { View, type ViewProps } from "react-native"
import { cn } from "@/lib/reusables/utils"

type SeparatorProps = ViewProps & {
  className?: string
  orientation?: "horizontal" | "vertical"
}

const Separator = React.forwardRef<
  React.ElementRef<typeof View>,
  SeparatorProps
>(
  (
    { className, orientation = "horizontal", ...props },
    ref
  ) => (
    <View
      ref={ref}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }

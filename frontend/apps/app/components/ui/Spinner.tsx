import * as React from "react"
import { ActivityIndicator } from "react-native"
import { cn } from "@/lib/reusables/utils"

interface SpinnerProps {
  className?: string
  size?: number | "small" | "large"
  color?: string
}

const Spinner = React.forwardRef<
  React.ElementRef<typeof ActivityIndicator>,
  SpinnerProps
>(({ className, ...props }, ref) => {
  return (
    <ActivityIndicator
      ref={ref}
      className={cn("text-red", className)}
      {...props}
    />
  )
})

Spinner.displayName = "Spinner"

export { Spinner }

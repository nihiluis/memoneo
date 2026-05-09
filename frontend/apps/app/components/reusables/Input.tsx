import * as React from "react"
import { TextInput, type TextInputProps } from "react-native"
import { cn } from "@/lib/reusables/utils"

type InputProps = TextInputProps & {
  className?: string
}

const Input = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  InputProps
>(({ className, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      className={cn(
        "h-10 native:h-12 w-full rounded-md border border-input bg-background px-3 text-base native:text-lg native:leading-[1.25] text-foreground",
        props.editable === false && "opacity-50 web:cursor-not-allowed",
        className
      )}
      placeholderTextColor="#71717a"
      {...props}
    />
  )
})

Input.displayName = "Input"

export { Input }

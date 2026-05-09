import * as React from "react"
import { Pressable, type PressableProps, Text, type TextProps } from "react-native"
import { TextClassContext } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"

type ButtonVariant = "default" | "outline" | "ghost" | "danger"
type ButtonSize = "default" | "sm" | "lg"

type ButtonProps = PressableProps & {
  className?: string
  variant?: ButtonVariant
  size?: ButtonSize
  isIconOnly?: boolean
  isDisabled?: boolean
}

type ButtonLabelProps = TextProps & {
  className?: string
}

const buttonVariants: Record<ButtonVariant, string> = {
  default: "bg-primary",
  outline: "border border-input bg-background",
  ghost: "bg-transparent",
  danger: "bg-destructive",
}

const buttonLabelVariants: Record<ButtonVariant, string> = {
  default: "text-primary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  danger: "text-destructive-foreground",
}

const buttonSizes: Record<ButtonSize, string> = {
  default: "h-10 px-4",
  sm: "h-9 px-3",
  lg: "h-12 px-6",
}

const ButtonLabel = React.forwardRef<
  React.ComponentRef<typeof Text>,
  ButtonLabelProps
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-base font-medium", className)}
    {...props}
  />
))
ButtonLabel.displayName = "ButtonLabel"

const Button = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  ButtonProps
>(
  (
    {
      className,
      disabled,
      isDisabled,
      variant = "default",
      size = "default",
      isIconOnly = false,
      children,
      ...props
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isDisabled
    const labelClassName = buttonLabelVariants[variant]

    return (
      <Pressable
        ref={ref}
        disabled={isButtonDisabled}
        className={cn(
          "items-center justify-center rounded-md flex-row gap-2",
          buttonVariants[variant],
          isIconOnly ? "aspect-square px-0" : buttonSizes[size],
          isButtonDisabled && "opacity-50 web:cursor-not-allowed",
          className
        )}
        {...props}>
        {typeof children === "function" ? (
          state => (
            <TextClassContext.Provider value={labelClassName}>
              {children(state)}
            </TextClassContext.Provider>
          )
        ) : (
          <TextClassContext.Provider value={labelClassName}>
            {children}
          </TextClassContext.Provider>
        )}
      </Pressable>
    )
  }
)
Button.displayName = "Button"

export { Button, ButtonLabel }
export type { ButtonProps }

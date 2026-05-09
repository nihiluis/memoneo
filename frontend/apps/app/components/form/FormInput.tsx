import * as React from "react"
import { View } from "react-native"
import { Input } from "@/components/reusables/Input"
import { MText } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"
import type { TextInputProps } from "react-native"
import {
  Controller,
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from "react-hook-form"

interface FormInputProps<T extends FieldValues> extends TextInputProps {
  label?: string
  error?: string
  description?: string
  control?: Control<T>
  name?: Path<T>
  rules?: RegisterOptions<T, Path<T>>
}

function FormInputInner<T extends FieldValues>(
  {
    label,
    error,
    description,
    className,
    control,
    name,
    rules,
    ...props
  }: FormInputProps<T>,
  ref: React.ForwardedRef<React.ComponentRef<typeof Input>>
) {
  if (control && name) {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, value, onBlur } }) => (
          <View className="w-full mb-8">
            {label && (
              <MText className="text-lg mb-4 font-medium leading-none text-foreground">
                {label}
              </MText>
            )}
            <Input
              ref={ref}
              className={cn(error && "border-destructive mb-2", className)}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              {...props}
            />
            {description && (
              <MText className="text-sm text-muted-foreground">{description}</MText>
            )}
            {error && (
              <MText className="text-sm font-medium text-destructive">{error}</MText>
            )}
          </View>
        )}
      />
    )
  }

  return (
    <View className="w-full space-y-2">
      {label && (
        <MText className="text-sm font-medium leading-none text-foreground">
          {label}
        </MText>
      )}
      <Input
        ref={ref}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
      {description && (
        <MText className="text-sm text-muted-foreground">{description}</MText>
      )}
      {error && (
        <MText className="text-sm font-medium text-destructive">{error}</MText>
      )}
    </View>
  )
}

type FormInputComponent = (<T extends FieldValues>(
  props: FormInputProps<T> & React.RefAttributes<React.ComponentRef<typeof Input>>
) => React.ReactElement) & { displayName?: string }

const FormInput = React.forwardRef(FormInputInner) as FormInputComponent

FormInput.displayName = "FormInput"

export { FormInput }

import * as React from "react"
import {
  Dimensions,
  Modal,
  Pressable,
  type PressableProps,
  View,
  type ViewProps,
} from "react-native"
import { cn } from "@/lib/reusables/utils"
import { Separator } from "@/components/reusables/Separator"

const MENU_WIDTH = 256

type AnchorRect = {
  x: number
  y: number
  width: number
  height: number
}

type DropdownMenuContextValue = {
  isOpen: boolean
  anchor: AnchorRect | null
  open: (anchor?: AnchorRect | null) => void
  close: () => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(
  null
)

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)

  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu")
  }

  return context
}

type DropdownMenuProps = {
  children: React.ReactNode
}

function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [anchor, setAnchor] = React.useState<AnchorRect | null>(null)

  const value = React.useMemo(
    () => ({
      isOpen,
      anchor,
      open: (nextAnchor?: AnchorRect | null) => {
        if (nextAnchor) {
          setAnchor(nextAnchor)
        }
        setIsOpen(true)
      },
      close: () => setIsOpen(false),
    }),
    [anchor, isOpen]
  )

  return (
    <DropdownMenuContext.Provider value={value}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

type DropdownMenuTriggerProps = PressableProps & {
  asChild?: boolean
  children: React.ReactElement
}

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  DropdownMenuTriggerProps
>(({ asChild, children, onPress, ...props }, ref) => {
  const { open } = useDropdownMenu()
  const triggerRef = React.useRef<React.ElementRef<typeof Pressable>>(null)
  const childOnPress = React.isValidElement<PressableProps>(children)
    ? children.props.onPress
    : undefined

  React.useImperativeHandle(ref, () => triggerRef.current as React.ElementRef<typeof Pressable>)

  const handlePress: PressableProps["onPress"] = event => {
    childOnPress?.(event)
    onPress?.(event)

    if (triggerRef.current?.measureInWindow) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        open({ x, y, width, height })
      })
      return
    }

    open()
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ref: triggerRef,
      onPress: handlePress,
    } as Partial<PressableProps> & React.RefAttributes<React.ElementRef<typeof Pressable>>)
  }

  return (
    <Pressable ref={triggerRef} onPress={handlePress} {...props}>
      {children}
    </Pressable>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

type DropdownMenuContentProps = ViewProps & {
  className?: string
  portalClassName?: string
}

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof View>,
  DropdownMenuContentProps
>(({ children, className, portalClassName, style, ...props }, ref) => {
  const { anchor, isOpen, close } = useDropdownMenu()
  const windowWidth = Dimensions.get("window").width
  const menuLeft = anchor
    ? Math.max(8, Math.min(anchor.x + anchor.width - MENU_WIDTH, windowWidth - MENU_WIDTH - 8))
    : windowWidth - MENU_WIDTH - 16
  const menuTop = anchor ? anchor.y + anchor.height + 4 : 112

  return (
    <Modal
      animationType="fade"
      transparent
      visible={isOpen}
      onRequestClose={close}>
      <Pressable
        className={cn("flex-1", portalClassName)}
        onPress={close}>
        <Pressable onPress={event => event.stopPropagation()}>
          <View
            ref={ref}
            className={cn(
              "w-64 native:w-72 rounded-md border border-border bg-popover py-1 shadow-lg",
              className
            )}
            style={[{ left: menuLeft, position: "absolute", top: menuTop }, style]}
            {...props}>
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

type DropdownMenuItemProps = PressableProps & {
  className?: string
}

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  DropdownMenuItemProps
>(({ className, onPress, ...props }, ref) => {
  const { close } = useDropdownMenu()

  const handlePress: PressableProps["onPress"] = event => {
    onPress?.(event)
    close()
  }

  return (
    <Pressable
      ref={ref}
      className={cn("min-h-11 flex-row items-center gap-2 px-3 py-2", className)}
      onPress={handlePress}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = () => <Separator className="my-1" />

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}

import { createContext, useContext } from "react"

export type AppDrawerContextValue = {
  closeDrawer: () => void
  drawerOpen: boolean
  openDrawer: () => void
}

export const AppDrawerContext = createContext<AppDrawerContextValue | null>(null)

export function useAppDrawer() {
  const context = useContext(AppDrawerContext)
  if (!context) {
    throw new Error("useAppDrawer must be used inside AppDrawer")
  }
  return context
}

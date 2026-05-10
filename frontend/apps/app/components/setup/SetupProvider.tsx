import { PropsWithChildren, useEffect } from "react"

export function SetupProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    async function runSetup() {}

    runSetup()
  }, [])
  return <>{children}</>
}

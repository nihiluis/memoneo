import { PropsWithChildren, useEffect } from "react"
import { useAtom } from "jotai"
import { setupAtom } from "@/lib/setup/state"

export function SetupProvider({ children }: PropsWithChildren) {
  const [setup, setSetup] = useAtom(setupAtom)

  useEffect(() => {
    async function setup() {}

    setup()
  }, [])
  return <>{children}</>
}

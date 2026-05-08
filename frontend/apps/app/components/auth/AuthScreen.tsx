import { authAtom } from "@/lib/auth/state"
import { useAtomValue } from "jotai"
import { Spinner } from "../ui/Spinner"

export default function AuthScreen({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAtomValue(authAtom)

  if (isLoading) {
    return <Spinner />
  }

  if (!isAuthenticated) {
    return null
  }
  return <>{children}</>
}

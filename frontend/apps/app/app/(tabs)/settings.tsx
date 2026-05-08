import AuthScreen from "@/components/auth/AuthScreen"
import { FormInput } from "@/components/form/FormInput"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import MView from "@/components/reusables/MView"
import { Separator } from "@/components/reusables/Separator"
import MRootView from "@/components/ui/MRootView"
import { authAtom } from "@/lib/auth/state"
import { useSetAtom } from "jotai"

export default function SettingsScreen() {
  const setAuth = useSetAtom(authAtom)

  function signOff() {
    setAuth({
      isAuthenticated: false,
      isLoading: false,
      user: { id: "", mail: "" },
      enckey: null,
      error: "",
    })
  }

  function setEncryptionKey() {
  }

  return (
    <AuthScreen>
      <MRootView>
        <MView className="flex">
        </MView>
        <Separator className="my-4" />
        <MView className="items-center mb-4">
          <Button size="lg" variant="ghost" onPress={signOff}>
            <MText>Sign off</MText>
          </Button>
        </MView>
      </MRootView>
    </AuthScreen>
  )
}

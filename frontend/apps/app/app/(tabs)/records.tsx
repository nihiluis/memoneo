import { RecordList } from "@/components/audio/RecordList"
import AuthScreen from "@/components/auth/AuthScreen"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import MView from "@/components/reusables/MView"
import { Separator } from "@/components/reusables/Separator"
import MRootView from "@/components/ui/MRootView"
import { authAtom } from "@/lib/auth/state"
import { useSetAtom } from "jotai"

export default function RecordsScreen() {

  return (
    <AuthScreen>
      <MRootView>
        <MView className="mt-8 flex-1 bg-red">
          <RecordList />
        </MView>
      </MRootView>
    </AuthScreen>
  )
}

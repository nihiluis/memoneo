import { AlertCircle, CloudCheck, Search } from "lucide-react-native"
import { ActivityIndicator, View } from "react-native"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"

export function TransferListState({
  loading,
  error,
  signedIn,
  searching,
  retry,
}: {
  loading: boolean
  error: boolean
  signedIn: boolean
  searching: boolean
  retry: () => void
}) {
  const Icon = error ? AlertCircle : searching ? Search : CloudCheck
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6 py-16">
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading notes" />
      ) : (
        <Icon
          size={30}
          color={error ? "#f87171" : "#71717a"}
          strokeWidth={1.5}
        />
      )}
      <MText className="text-lg font-semibold text-center">
        {!signedIn
          ? "Sign in to see your notes"
          : loading
          ? "Finding your notes…"
          : error
          ? "Couldn’t load your notes"
          : searching
          ? "No matching notes"
          : "You’re all caught up"}
      </MText>
      <MText className="max-w-sm text-center text-sm leading-6 text-muted-foreground">
        {!signedIn
          ? "Connect your account to upload, download, and sync."
          : error
          ? "We couldn’t reach your notes server. Check your connection and backend URL in Settings, then try again."
          : loading
          ? "Checking this device and your remote library."
          : searching
          ? "Try another title or folder name."
          : "There are no notes available for this action."}
      </MText>
      {error && (
        <Button variant="outline" className="mt-2" onPress={retry}>
          <MText>Try again</MText>
        </Button>
      )}
    </View>
  )
}

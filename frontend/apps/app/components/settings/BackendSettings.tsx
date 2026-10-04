import { useState } from "react"
import { Platform, View } from "react-native"
import { useMutation } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { Button } from "@/components/reusables/Button"
import { Input } from "@/components/reusables/Input"
import { MText } from "@/components/reusables/MText"
import { resetNoteCache } from "@/lib/notes/cache"
import { clearStoredToken, authAtom } from "@/lib/auth/state"
import {
  getBackendUrls,
  normalizeBackendUrl,
  saveBackendUrls,
} from "@/lib/settings/urls"
import { checkBackendConnection } from "@/lib/settings/connection"

export function BackendSettings() {
  const auth = useAtomValue(authAtom)
  const [urls, setUrls] = useState(getBackendUrls)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const connection = useMutation({
    mutationFn: () => checkBackendConnection(urls),
    onSuccess: () =>
      setMessage("Connected to the notes API and authentication service."),
    onError: error => setMessage(`Connection failed: ${error.message}`),
  })
  if (Platform.OS !== "web") return null

  async function save() {
    setSaving(true)
    try {
      const normalized = {
        apiUrl: normalizeBackendUrl(urls.apiUrl),
        authUrl: normalizeBackendUrl(urls.authUrl),
      }
      await clearStoredToken()
      await resetNoteCache()
      saveBackendUrls(normalized)
      // Reload so no session or sync cache from the previous backend is reused.
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className="mx-4 mt-4 gap-3 rounded-md border border-border p-4">
      <MText className="text-lg font-semibold">Backend connection</MText>
      <MText className="text-sm text-muted-foreground">
        Set the notes API and authentication service URLs for this browser.
        {auth.isAuthenticated ? " Sign out before changing servers." : ""}
      </MText>
      <MText>Notes API URL</MText>
      <Input
        accessibilityLabel="Notes API URL"
        value={urls.apiUrl}
        editable={!auth.isAuthenticated && !connection.isPending && !saving}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={apiUrl => {
          setUrls(current => ({ ...current, apiUrl }))
          setMessage("")
        }}
        placeholder="https://api.example.com"
      />
      <MText>Authentication URL</MText>
      <Input
        accessibilityLabel="Authentication URL"
        value={urls.authUrl}
        editable={!auth.isAuthenticated && !connection.isPending && !saving}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={authUrl => {
          setUrls(current => ({ ...current, authUrl }))
          setMessage("")
        }}
        placeholder="https://auth.example.com"
      />
      <Button
        variant="outline"
        isDisabled={connection.isPending || saving}
        onPress={() => {
          setMessage("")
          connection.mutate()
        }}
      >
        <MText>{connection.isPending ? "Checking…" : "Check connection"}</MText>
      </Button>
      <Button
        isDisabled={auth.isAuthenticated || connection.isPending || saving}
        onPress={() => { void save() }}
      >
        <MText>{saving ? "Saving…" : "Save backend URLs"}</MText>
      </Button>
      {!!message && <MText accessibilityRole="alert">{message}</MText>}
    </View>
  )
}

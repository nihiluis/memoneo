import { useState } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { FlatList, Pressable, TextInput, View } from "react-native"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useAtomValue } from "jotai"
import { useQuery } from "@tanstack/react-query"
import { authAtom, tokenAtom } from "@/lib/auth/state"
import { listTransferNotes } from "@/lib/notes/sync"
import type { TransferAction } from "@/lib/notes/transfer"
import { useSyncDrawerMutation } from "@/components/navigation/actions/mutations"
import { MText } from "@/components/reusables/MText"
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Search,
} from "lucide-react-native"
import { Button } from "@/components/reusables/Button"
import { TransferListState } from "@/components/transfers/TransferListState"
import { TransferNoteRow } from "@/components/transfers/TransferNoteRow"

const labels = { upload: "Upload", download: "Download", sync: "Sync" }

export default function TransferScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ action?: string }>()
  const initial = params.action
  const [action, setAction] = useState<TransferAction>(
    initial === "upload" || initial === "download" ? initial : "sync"
  )
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const auth = useAtomValue(authAtom)
  const token = useAtomValue(tokenAtom)
  const router = useRouter()
  const { isSyncing, runSelected } = useSyncDrawerMutation()
  const query = useQuery({
    queryKey: ["transfer-notes", auth.user.id, action],
    enabled: auth.isAuthenticated && !!token,
    queryFn: () => listTransferNotes({ token, userId: auth.user.id }, action),
  })
  const notes = query.data ?? []
  const visible = notes.filter(note =>
    `${note.title} ${note.path}`.toLowerCase().includes(search.toLowerCase())
  )
  const selectedIds = new Set(
    notes.filter(note => selected.has(note.id)).map(note => note.id)
  )
  const disabled =
    isSyncing ||
    query.isFetching ||
    !!query.error ||
    !auth.isAuthenticated ||
    !token

  async function run(all: boolean) {
    setMessage("")
    try {
      const result = await runSelected({
        action,
        selectedIds: all ? new Set(notes.map(note => note.id)) : selectedIds,
      })
      setMessage(
        `Completed: ${result.uploaded + result.updatedRemote} uploaded, ${
          result.downloaded + result.updatedLocal
        } downloaded.`
      )
      setSelected(new Set())
    } catch {
      setMessage(
        "The action stopped. Some notes may have completed. Refreshing the list before you retry."
      )
    } finally {
      await query.refetch()
    }
  }

  const hasError = !!query.error
  const loading = query.isPending && auth.isAuthenticated && !!token
  const icons = {
    upload: ArrowUpFromLine,
    download: ArrowDownToLine,
    sync: RefreshCw,
  }
  const ActionIcon = icons[action]

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View className="w-full max-w-5xl flex-1 self-center px-4 py-5 sm:px-8 sm:py-8">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to notes"
          onPress={() => router.back()}
          className="mb-6 min-h-10 flex-row items-center gap-2 self-start rounded-md pr-3 hover:opacity-70"
        >
          <ArrowLeft size={18} color="#71717a" />
          <MText className="text-sm text-muted-foreground">Back to notes</MText>
        </Pressable>
        <View className="mb-6 gap-2">
          <MText className="text-3xl font-semibold tracking-tight">
            Your notes, everywhere.
          </MText>
          <MText className="text-sm leading-6 text-muted-foreground">
            Choose what moves between this device and your remote library.
          </MText>
        </View>
        <View
          accessibilityRole="tablist"
          className="mb-5 flex-row gap-1 self-start rounded-xl bg-muted p-1"
        >
          {(Object.keys(labels) as TransferAction[]).map(kind => {
            const Icon = icons[kind]
            return (
              <Pressable
                key={kind}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: action === kind,
                  disabled: isSyncing,
                }}
                disabled={isSyncing}
                className={`min-h-11 flex-row items-center justify-center gap-2 rounded-lg px-4 ${
                  action === kind ? "bg-background" : "hover:opacity-70"
                }`}
                onPress={() => {
                  setAction(kind)
                  setSelected(new Set())
                  setMessage("")
                }}
              >
                <Icon size={16} color="#71717a" />
                <MText
                  className={`text-sm ${
                    action === kind ? "font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {labels[kind]}
                </MText>
              </Pressable>
            )
          })}
        </View>
        <View className="mb-5 flex-row items-start gap-3">
          <ActionIcon size={18} color="#71717a" />
          <MText className="flex-1 text-sm leading-5 text-muted-foreground">
            {action === "download"
              ? "Bring remote notes that are missing on this device into your local library."
              : action === "upload"
              ? "Back up new notes from this device to your remote library."
              : "Send local changes and receive remote updates. Local changes take priority."}
          </MText>
        </View>
        <View className="flex-1 overflow-hidden rounded-2xl border border-border bg-background">
          <View className="gap-4 border-b border-border p-4 sm:p-5">
            <View className="min-h-11 flex-row items-center gap-3 rounded-lg border border-border px-3">
              <Search size={17} color="#71717a" />
              <TextInput
                accessibilityLabel="Search notes"
                placeholder="Search notes or folders…"
                placeholderTextColor="#71717a"
                value={search}
                onChangeText={setSearch}
                className="min-h-11 flex-1 text-sm text-foreground web:outline-none"
              />
            </View>
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <MText className="text-xs text-muted-foreground">
                {hasError || loading
                  ? "Your library"
                  : `${notes.length} notes available · ${selectedIds.size} selected`}
              </MText>
              <View className="flex-row gap-4">
                <Pressable
                  accessibilityRole="button"
                  disabled={disabled || !visible.length}
                  className="min-h-8 justify-center disabled:opacity-40"
                  onPress={() =>
                    setSelected(new Set(visible.map(note => note.id)))
                  }
                >
                  <MText className="text-xs font-medium">
                    Select {search ? "results" : "all"}
                  </MText>
                </Pressable>
                {!!selectedIds.size && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSyncing}
                    className="min-h-8 justify-center"
                    onPress={() => setSelected(new Set())}
                  >
                    <MText className="text-xs text-muted-foreground">
                      Clear
                    </MText>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
          <FlatList
            style={{ flex: 1 }}
            contentContainerStyle={
              visible.length && !hasError ? undefined : { flexGrow: 1 }
            }
            data={hasError ? [] : visible}
            extraData={selected}
            keyExtractor={note => note.id}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={7}
            ListEmptyComponent={
              <TransferListState
                loading={loading}
                error={hasError}
                signedIn={auth.isAuthenticated && !!token}
                searching={!!search}
                retry={() => {
                  void query.refetch()
                }}
              />
            }
            renderItem={({ item }) => (
              <TransferNoteRow
                note={item}
                checked={selected.has(item.id)}
                disabled={isSyncing}
                onPress={() =>
                  setSelected(current => {
                    const next = new Set(current)
                    if (next.has(item.id)) next.delete(item.id)
                    else next.add(item.id)
                    return next
                  })
                }
              />
            )}
          />
          <View className="gap-3 border-t border-border p-4 sm:p-5">
            {!!message && (
              <MText
                accessibilityLiveRegion="polite"
                className="text-sm text-muted-foreground"
              >
                {message}
              </MText>
            )}
            <View className="flex-row flex-wrap items-center justify-between gap-3">
              <MText
                accessibilityLiveRegion="polite"
                className="text-xs text-muted-foreground"
              >
                {isSyncing
                  ? `${labels[action]} in progress…`
                  : "Choose individual notes or transfer all."}
              </MText>
              <View className="flex-row flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={disabled || !notes.length}
                  onPress={() => {
                    void run(true)
                  }}
                >
                  <MText className="text-sm">
                    {labels[action]} all
                    {notes.length ? ` (${notes.length})` : ""}
                  </MText>
                </Button>
                <Button
                  disabled={disabled || !selectedIds.size}
                  onPress={() => {
                    void run(false)
                  }}
                >
                  <MText className="text-sm">
                    {labels[action]} selected
                    {selectedIds.size ? ` (${selectedIds.size})` : ""}
                  </MText>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

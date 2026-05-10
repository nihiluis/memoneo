import { useAppDrawer } from "@/components/navigation/AppDrawer"
import { Button } from "@/components/reusables/Button"
import { MText } from "@/components/reusables/MText"
import { authAtom, tokenAtom } from "@/lib/auth/state"
import { resetNoteCache } from "@/lib/notes/cache"
import { deleteAllLocalNotes } from "@/lib/notes/local"
import {
  LAST_OPENED_NOTE_KEY,
  NOTES_CACHE_QUERY_KEY,
  NOTES_LOCAL_QUERY_KEY,
} from "@/lib/notes/query"
import { selectedFolderIdAtom, selectedNoteIdAtom } from "@/lib/notes/state"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useAtomValue, useSetAtom } from "jotai"
import { Menu } from "lucide-react-native"
import { Alert, Pressable, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function SettingsScreen() {
  const auth = useAtomValue(authAtom)
  const setAuth = useSetAtom(authAtom)
  const setToken = useSetAtom(tokenAtom)
  const setSelectedFolderId = useSetAtom(selectedFolderIdAtom)
  const setSelectedNoteId = useSetAtom(selectedNoteIdAtom)
  const { openDrawer } = useAppDrawer()
  const router = useRouter()
  const queryClient = useQueryClient()

  function signOff() {
    setToken("")
    setAuth({
      isAuthenticated: false,
      isLoading: false,
      user: { id: "", mail: "" },
      enckey: null,
      error: "",
    })
  }

  const resetLocalDataMutation = useMutation({
    mutationFn: async () => {
      await deleteAllLocalNotes()
      await Promise.all([
        resetNoteCache(),
        AsyncStorage.removeItem(LAST_OPENED_NOTE_KEY),
      ])
    },
    onSuccess: async () => {
      setSelectedNoteId("")
      setSelectedFolderId("")
      queryClient.setQueryData(NOTES_LOCAL_QUERY_KEY, [])
      queryClient.setQueryData(NOTES_CACHE_QUERY_KEY, {})
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: NOTES_LOCAL_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: NOTES_CACHE_QUERY_KEY }),
      ])
      Alert.alert("Local data reset", "All local notes and sync cache were deleted.")
    },
    onError: error => {
      Alert.alert(
        "Reset failed",
        error instanceof Error ? error.message : String(error)
      )
    },
  })

  function confirmResetLocalData() {
    Alert.alert(
      "Delete all local notes?",
      "This deletes every note stored on this device and resets the local sync cache. Remote notes are not deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => resetLocalDataMutation.mutate(),
        },
      ]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="h-14 flex-row items-center border-b border-border px-4">
        <Pressable
          accessibilityRole="button"
          className="mr-3 h-10 w-10 items-center justify-center rounded-md"
          onPress={openDrawer}>
          <Menu size={24} color="#a1a1aa" />
        </Pressable>
        <MText className="flex-1 text-lg font-semibold">Settings</MText>
      </View>
      <View className="mt-4 items-center border-t border-border pt-4">
        {auth.isAuthenticated ? (
          <Button size="lg" variant="ghost" onPress={signOff}>
            <MText>Sign off</MText>
          </Button>
        ) : (
          <Button
            size="lg"
            variant="ghost"
            onPress={() => router.push("/auth/login")}>
            <MText>Sign in</MText>
          </Button>
        )}
      </View>
      <View className="mt-4 items-center border-t border-border pt-4">
        <Button
          isDisabled={resetLocalDataMutation.isPending}
          size="lg"
          variant="danger"
          onPress={confirmResetLocalData}>
          <MText>
            {resetLocalDataMutation.isPending
              ? "Deleting..."
              : "Delete all notes and reset cache"}
          </MText>
        </Button>
      </View>
    </SafeAreaView>
  )
}

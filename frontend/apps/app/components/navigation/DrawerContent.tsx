import type { Note } from "@memoneo/shared"
import { memo } from "react"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { DrawerActions } from "./DrawerActions"
import { DrawerNoteTreeList } from "./DrawerNoteTreeList"

type DrawerContentProps = {
  onOpenNoteOptions: (note: Note) => void
}

function DrawerContentComponent({ onOpenNoteOptions }: DrawerContentProps) {
  return (
    <SafeAreaView className="bg-background" style={styles.flex}>
      <View className="px-3 py-4" style={styles.flex}>
        <DrawerNoteTreeList onOpenNoteOptions={onOpenNoteOptions} />
        <DrawerActions />
      </View>
    </SafeAreaView>
  )
}

export const DrawerContent = memo(DrawerContentComponent)

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
})

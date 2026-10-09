import { atom, createStore, Provider } from "jotai"
import type { Note } from "@memoneo/shared"
import { describe, expect, it, vi } from "vitest"
import { View } from "react-native"
import { testingLibrary } from "../../test/react-native-testing"

vi.doMock("lucide-react-native", () => ({ ChevronDown: () => null, ChevronRight: () => null, Folder: () => null, Ellipsis: () => null }))

let segments = ["(tabs)"]
const push = vi.fn()
const closeDrawer = vi.fn()
const note = { id: "note-1", title: "Test", file: { title: "Test", path: "Diary/2024" } } as Note
vi.doMock("expo-router", () => ({ useRouter: () => ({ push }), useSegments: () => segments }))
vi.doMock("./appDrawerContext", () => ({ useAppDrawer: () => ({ closeDrawer, drawerOpen: true }) }))
vi.doMock("@/lib/notes/query", () => ({ useNoteFoldersQuery: () => ({ data: [], isLoading: false }) }))
vi.doMock("@/lib/notes/state", () => ({
  selectedNoteIdAtom: atom("note-1"), selectedFolderIdAtom: atom(""),
  drawerExpandedFolderIdsAtom: atom(new Set<string>()),
  useNotesState: () => ({ notes: [note], isLoading: false }),
}))
vi.doMock("@shopify/flash-list", () => ({
  FlashList: ({ data, renderItem }: { data: unknown[]; renderItem: (props: { item: unknown }) => React.ReactNode }) => (
    <View>{data.map((item, index) => <View key={index}>{renderItem({ item })}</View>)}</View>
  ),
}))
const { DrawerNoteTreeList } = await import("./DrawerNoteTreeList")
const { selectedNoteIdAtom, drawerExpandedFolderIdsAtom } = await import("@/lib/notes/state")
const { render, fireEvent } = testingLibrary

describe("DrawerNoteTreeList selection", () => {
  it("allows collapsing ancestors of the selected note", () => {
    segments = ["(tabs)"]
    const store = createStore()
    const result = render(<Provider store={store}><DrawerNoteTreeList onOpenNoteOptions={vi.fn()} /></Provider>)
    expect(store.get(drawerExpandedFolderIdsAtom).has("Diary/2024")).toBe(true)
    fireEvent.press(result.getAllByLabelText("Collapse folder")[1])
    expect(store.get(drawerExpandedFolderIdsAtom).has("Diary/2024")).toBe(false)
    fireEvent.press(result.getByLabelText("Collapse folder"))
    expect(store.get(drawerExpandedFolderIdsAtom).has("Diary")).toBe(false)
  })
  it("highlights the last-opened note only on the notes view", () => {
    segments = ["(tabs)"]
    const store = createStore()
    const result = render(<Provider store={store}><DrawerNoteTreeList onOpenNoteOptions={vi.fn()} /></Provider>)
    expect(result.getByLabelText("Test").props.accessibilityState.selected).toBe(true)
    for (const screen of ["settings", "backend-settings", "records"]) {
      segments = ["(tabs)", screen]
      result.rerender(<Provider store={store}><DrawerNoteTreeList onOpenNoteOptions={vi.fn()} /></Provider>)
      expect(result.getByLabelText("Test").props.accessibilityState.selected).toBe(false)
      expect(store.get(selectedNoteIdAtom)).toBe("note-1")
    }
    fireEvent.press(result.getByLabelText("Test"))
    expect(push).toHaveBeenCalledWith("/")
    expect(closeDrawer).toHaveBeenCalled()
  })
})

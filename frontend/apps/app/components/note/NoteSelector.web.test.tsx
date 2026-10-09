import { atom, createStore, Provider } from "jotai"
import type { Note } from "@memoneo/shared"
import { describe, expect, it, vi } from "vitest"
import { testingLibrary } from "../../test/react-native-testing"

let routeNote: string | undefined = "note-1"
const setParams = vi.fn()
const router = { setParams }
vi.doMock("expo-router", () => ({
  useLocalSearchParams: () => ({ note: routeNote }),
  useRouter: () => router,
}))
vi.doMock("@/lib/notes/state", () => ({
  selectedNoteIdAtom: atom(""),
  selectedFolderIdAtom: atom(""),
  getNoteParentFolderId: (note: Note) => note.file?.path ?? "",
  useNotesState: () => ({
    notes: [{ id: "note-1", file: { path: "Diary/2024" } }, { id: "note-2" }],
    isLoading: false,
  }),
}))
const { NoteSelector } = await import("./NoteSelector.web")
const { selectedNoteIdAtom, selectedFolderIdAtom } = await import("@/lib/notes/state")
const { render, act } = testingLibrary

describe("web note URLs", () => {
  it("restores selection from the URL, writes selections, and follows history", () => {
    const store = createStore()
    const result = render(<Provider store={store}><NoteSelector /></Provider>)
    expect(store.get(selectedNoteIdAtom)).toBe("note-1")
    expect(store.get(selectedFolderIdAtom)).toBe("Diary/2024")
    act(() => store.set(selectedNoteIdAtom, "note-2"))
    expect(setParams).toHaveBeenCalledWith({ note: "note-2" })
    routeNote = "note-2"
    result.rerender(<Provider store={store}><NoteSelector /></Provider>)
    routeNote = "note-1"
    result.rerender(<Provider store={store}><NoteSelector /></Provider>)
    expect(store.get(selectedNoteIdAtom)).toBe("note-1")
    result.unmount()
  })
})

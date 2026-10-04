import { describe, expect, it, vi } from "vitest"
import type { Note } from "@memoneo/shared"
import { testingLibrary } from "../../test/react-native-testing"

vi.doMock("lucide-react-native", () => ({ FileText: () => null, RefreshCw: () => null, Trash2: () => null, Upload: () => null }))
vi.doMock("./NoteDetailsTable", () => ({ NoteDetailsTable: () => null }))
const { NoteOptionsSheet } = await import("./NoteOptionsSheet")
const { render, fireEvent } = testingLibrary
const note = { id: "note-1", title: "Test", file: { title: "Test", path: "" } } as Note

describe("NoteOptionsSheet authentication", () => {
  it("hides upload and sync while keeping local deletion when signed out", () => {
    const onDelete = vi.fn()
    const result = render(<NoteOptionsSheet note={note} isAuthenticated={false} isDeleting={false} isSyncing={false} onDelete={onDelete} onSync={vi.fn()} />)
    expect(result.queryByText("Upload note")).toBeNull()
    expect(result.queryByText("Sync note")).toBeNull()
    fireEvent.press(result.getByText("Delete note"))
    expect(onDelete).toHaveBeenCalledWith(note)
  })
  it("exposes single-note actions when signed in", () => {
    const onSync = vi.fn()
    const result = render(<NoteOptionsSheet note={note} isAuthenticated isDeleting={false} isSyncing={false} onDelete={vi.fn()} onSync={onSync} />)
    fireEvent.press(result.getByText("Upload note"))
    fireEvent.press(result.getByText("Sync note"))
    expect(onSync.mock.calls).toEqual([[note, "upload"], [note, "sync"]])
  })
})

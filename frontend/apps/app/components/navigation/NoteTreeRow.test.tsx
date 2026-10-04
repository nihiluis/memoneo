import type { Note } from "@memoneo/shared"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Platform } from "../../test/mocks/react-native"
import { testingLibrary } from "../../test/react-native-testing"

vi.doMock("lucide-react-native", () => ({
  ChevronDown: () => null,
  ChevronRight: () => null,
  Folder: () => null,
  Ellipsis: () => null,
}))

const { NoteTreeRow } = await import("./NoteTreeRow")
const { fireEvent, render } = testingLibrary

const note = { id: "note-1", title: "My note" } as Note

function renderRow() {
  const onSelectNote = vi.fn()
  const onOpenNoteOptions = vi.fn()
  const result = render(
    <NoteTreeRow
      expanded={false}
      item={{ kind: "note", id: note.id, depth: 0, note }}
      onOpenNoteOptions={onOpenNoteOptions}
      onSelectFolder={vi.fn()}
      onSelectNote={onSelectNote}
      onToggleFolder={vi.fn()}
      selectedFolderId=""
      selectedNoteId={note.id}
    />
  )
  return { result, onSelectNote, onOpenNoteOptions }
}

afterEach(() => {
  Platform.OS = "ios"
})

describe("NoteTreeRow", () => {
  it("keeps web selection and options as independent sibling buttons", () => {
    Platform.OS = "web"
    const { result, onSelectNote, onOpenNoteOptions } = renderRow()
    const buttons = result.UNSAFE_getAllByType("Pressable")

    expect(buttons).toHaveLength(2)
    for (const button of buttons) {
      let ancestor = button.parent
      while (ancestor) {
        expect(ancestor.type).not.toBe("Pressable")
        ancestor = ancestor.parent
      }
    }
    fireEvent.press(result.getByLabelText("Options for My note"))
    expect(onOpenNoteOptions).toHaveBeenCalledWith(note)
    expect(onSelectNote).not.toHaveBeenCalled()

    fireEvent.press(result.getByLabelText("My note"))
    expect(onSelectNote).toHaveBeenCalledWith(note.id)
    expect(onOpenNoteOptions).toHaveBeenCalledOnce()
  })

  it("preserves native long press for note options", () => {
    const { result, onSelectNote, onOpenNoteOptions } = renderRow()

    expect(result.UNSAFE_getAllByType("Pressable")).toHaveLength(1)
    fireEvent(result.getByLabelText("My note"), "longPress")
    expect(onOpenNoteOptions).toHaveBeenCalledWith(note)
    expect(onSelectNote).not.toHaveBeenCalled()
  })
})

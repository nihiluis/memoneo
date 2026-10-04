import type { Note } from "@memoneo/shared"
import { describe, expect, it, vi } from "vitest"

import { testingLibrary } from "../../test/react-native-testing"

vi.doMock("./NoteOptionsSheet", () => ({ NoteOptionsSheet: () => null }))
vi.doMock("lucide-react-native", () => ({ X: () => null }))

const { WebNoteOptionsDialog } = await import("./WebNoteOptionsDialog.web")
const { fireEvent, render } = testingLibrary

describe("WebNoteOptionsDialog", () => {
  it("dismisses from the backdrop or close icon, but not the dialog content", () => {
    const onClose = vi.fn()
    const result = render(
      <WebNoteOptionsDialog
        note={{ id: "note-1", title: "My note" } as Note}
        isAuthenticated={true}
        isDeleting={false}
        isSyncing={false}
        onClose={onClose}
        onDelete={vi.fn()}
        onSync={vi.fn()}
      />
    )
    const backdrop = result.getByLabelText("Dismiss dialog")
    const close = result.getByLabelText("Close")

    // The backdrop is a sibling, so content clicks cannot bubble into it.
    let ancestor = close.parent
    while (ancestor) {
      expect(ancestor).not.toBe(backdrop)
      ancestor = ancestor.parent
    }
    let panel = close.parent!
    while (panel.type !== "View") {
      panel = panel.parent!
    }
    fireEvent.press(panel)
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.press(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
    fireEvent.press(close)
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

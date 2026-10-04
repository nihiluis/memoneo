import type { Note } from "@memoneo/shared"
import { describe, expect, it } from "vitest"

import { testingLibrary } from "../../test/react-native-testing"

const { NoteDetailsTable } = await import("./NoteDetailsTable")
const { render } = testingLibrary

describe("NoteDetailsTable", () => {
  it("pairs each label with its value in an accessible table", () => {
    const date = "2026-10-04T16:33:00.000Z"
    const note = { created_at: date, updated_at: date } as Note
    const result = render(<NoteDetailsTable note={note} lastSync={date} />)
    const expectedDate = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date))

    expect(result.getByLabelText("Note details").props.role).toBe("table")
    for (const label of ["Created", "Modified", "Last sync"]) {
      expect(result.getByText(label)).toBeTruthy()
    }
    expect(result.getAllByText(expectedDate)).toHaveLength(3)
    const views = result.UNSAFE_getAllByType("View")
    expect(views.filter(view => view.props.role === "row")).toHaveLength(3)
    expect(views.filter(view => view.props.role === "rowheader")).toHaveLength(3)
    expect(views.filter(view => view.props.role === "cell")).toHaveLength(3)
  })

  it("handles missing or invalid dates and an unsynced note", () => {
    const note = { created_at: null, updated_at: "invalid" } as Note
    const result = render(<NoteDetailsTable note={note} />)

    expect(result.getAllByText("Unknown")).toHaveLength(2)
    expect(result.getByText("Not synced")).toBeTruthy()
  })
})

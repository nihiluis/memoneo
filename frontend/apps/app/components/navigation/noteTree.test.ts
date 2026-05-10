import type { Note } from "@memoneo/shared"
import { describe, expect, it } from "vitest"

import {
  buildNoteTree,
  flattenVisibleTree,
  getFolderPathFromId,
  getNoteFolderId,
  getNoteTitle,
  getSelectedFolderIds,
  setsAreEqual,
} from "./noteTree"

function note(id: string, title: string, path?: string, fileTitle = title): Note {
  return {
    id,
    title,
    body: "",
    body_iv: "",
    date: "2026-01-01T00:00:00.000Z",
    version: 1,
    archived: false,
    user_id: "user-1",
    file: path === undefined ? null : { title: fileTitle, path, note_id: id },
  } as Note
}

describe("note tree helpers", () => {
  it("groups notes by folder path and sorts folders and notes", () => {
    const root = buildNoteTree([
      note("b", "Bravo", "Work"),
      note("a", "Alpha", "Work/Ideas"),
      note("c", "Charlie"),
    ])

    expect(root.folders.map(folder => folder.name)).toEqual(["Work"])
    expect(root.folders[0].folders[0].name).toBe("Ideas")
    expect(root.folders[0].notes.map(item => item.id)).toEqual(["b"])
    expect(root.notes.map(item => item.id)).toEqual(["c"])
  })

  it("includes empty local folders in the tree", () => {
    const root = buildNoteTree([note("a", "Alpha", "Work")], [
      "Archive/2026",
      "Work/Ideas",
    ])

    expect(root.folders.map(folder => folder.id)).toEqual(["Archive", "Work"])
    expect(root.folders[0].folders[0].id).toBe("Archive/2026")
    expect(root.folders[1].folders[0].id).toBe("Work/Ideas")
  })

  it("flattens only expanded folders", () => {
    const root = buildNoteTree([
      note("a", "Alpha", "Work/Ideas"),
      note("b", "Bravo", "Work"),
      note("c", "Charlie"),
    ])

    expect(flattenVisibleTree(root, new Set()).map(row => row.id)).toEqual([
      "folder:Work",
      "note:c",
    ])
    expect(
      flattenVisibleTree(root, new Set(["Work", "Work/Ideas"])).map(row => row.id)
    ).toEqual(["folder:Work", "folder:Work/Ideas", "note:a", "note:b", "note:c"])
  })

  it("returns ancestor folder ids for the selected note", () => {
    expect(getSelectedFolderIds([note("a", "Alpha", "Work/Ideas")], "a")).toEqual([
      "Work",
      "Work/Ideas",
    ])
    expect(getSelectedFolderIds([], "missing")).toEqual([])
  })

  it("compares sets and resolves note titles", () => {
    expect(setsAreEqual(new Set(["a", "b"]), new Set(["b", "a"]))).toBe(true)
    expect(setsAreEqual(new Set(["a"]), new Set(["a", "b"]))).toBe(false)
    expect(getNoteTitle(note("a", "Remote", "", "Local"))).toBe("Local")
  })

  it("maps notes and folder ids to creation targets", () => {
    expect(getNoteFolderId(note("a", "Alpha", "Work/Ideas"))).toBe("Work/Ideas")
    expect(getNoteFolderId(note("b", "Bravo"))).toBe("")
    expect(getFolderPathFromId("")).toBe("")
    expect(getFolderPathFromId("Work/Ideas")).toBe("Work/Ideas")
  })
})

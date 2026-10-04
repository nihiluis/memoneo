import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import {
  createLocalFolder,
  createLocalNote,
  deleteAllLocalNotes,
  deleteLocalMarkdownFile,
  deleteLocalNote,
  listLocalFolderPaths,
  listLocalMarkdownFiles,
  listLocalNotes,
  writeLocalNote,
} from "./local.web"

describe("browser note persistence", () => {
  beforeEach(deleteAllLocalNotes)
  it("persists edits across storage connections while preserving note identity", async () => {
    const note = await createLocalNote("A note", "First body", "work/project")
    await writeLocalNote({ ...note, title: "Edited title" }, "Updated **body**")
    const [loaded] = await listLocalNotes()
    expect(loaded).toMatchObject({
      id: note.id,
      title: "Edited title",
      body: "Updated **body**",
      file: { path: "work/project", title: "A note" },
    })
    expect(await listLocalFolderPaths()).toEqual(["work", "work/project"])
  })
  it("preserves remote IDs and versions for subsequent sync", async () => {
    const note = await createLocalNote("Synced", "body")
    await writeLocalNote(
      { ...note, id: "remote-id", version: 7 },
      "remote body"
    )
    const [file] = await listLocalMarkdownFiles()
    expect(file.metadata).toMatchObject({ id: "remote-id", version: 7 })
    expect((await listLocalNotes())[0].id).toBe("remote-id")
  })
  it("creates unique files and empty folders without overwriting existing content", async () => {
    await createLocalNote("Same", "one")
    await createLocalNote("Same", "two")
    expect(
      (await listLocalMarkdownFiles()).map(file => file.fileName).sort()
    ).toEqual(["Same", "Same 2"])
    expect(await createLocalFolder("", "Empty")).toBe("Empty")
    expect(await createLocalFolder("", "Empty")).toBe("Empty 2")
    expect(await listLocalFolderPaths()).toEqual(["Empty", "Empty 2"])
  })
  it("deletes individual notes and resets all notes and folders", async () => {
    const note = await createLocalNote("Delete me", "body", "folder")
    await deleteLocalNote(note)
    expect(await listLocalNotes()).toEqual([])
    await createLocalNote("Other", "body")
    await deleteLocalMarkdownFile((await listLocalMarkdownFiles())[0])
    expect(await listLocalNotes()).toEqual([])
    await createLocalNote("Reset me", "body", "another")
    await deleteAllLocalNotes()
    expect(await listLocalNotes()).toEqual([])
    expect(await listLocalFolderPaths()).toEqual([])
  })
})

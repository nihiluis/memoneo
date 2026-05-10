import type { Note } from "@memoneo/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { testingLibrary } from "../../test/react-native-testing"

const listLocalNotes = vi.fn()
const listLocalFolderPaths = vi.fn()

vi.mock("./local", () => ({
  listLocalFolderPaths,
  listLocalNotes,
}))

const { renderHook, waitFor } = testingLibrary
const {
  NOTES_LOCAL_QUERY_KEY,
  upsertNoteInLocalQueryCache,
  useNoteFoldersQuery,
  useNotesQuery,
} = await import("./query")

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function note(id: string, updatedAt: string): Note {
  return {
    id,
    user_id: "user-1",
    title: id,
    body: "",
    body_iv: "",
    date: updatedAt,
    archived: false,
    version: 1,
    created_at: updatedAt,
    updated_at: updatedAt,
    decryptedBody: "",
    file: {
      note_id: id,
      title: id,
      path: "",
    },
  } as Note
}

describe("useNotesQuery", () => {
  it("returns an empty list when there are no persisted local notes", async () => {
    listLocalNotes.mockResolvedValueOnce([])

    const result = renderHook(() => useNotesQuery(), { wrapper })

    await waitFor(() => expect(result.result.current.isSuccess).toBe(true))
    expect(result.result.current.data).toEqual([])
  })

  it("sorts persisted local notes by most recent update", async () => {
    listLocalNotes.mockResolvedValueOnce([
      note("older", "2026-01-01T00:00:00.000Z"),
      note("newer", "2026-02-01T00:00:00.000Z"),
    ])

    const result = renderHook(() => useNotesQuery(), { wrapper })

    await waitFor(() => expect(result.result.current.isSuccess).toBe(true))
    expect(result.result.current.data?.map(item => item.id)).toEqual([
      "newer",
      "older",
    ])
  })
})

describe("useNoteFoldersQuery", () => {
  it("returns local folder paths", async () => {
    listLocalFolderPaths.mockResolvedValueOnce(["Work", "Work/Ideas"])

    const result = renderHook(() => useNoteFoldersQuery(), { wrapper })

    await waitFor(() => expect(result.result.current.isSuccess).toBe(true))
    expect(result.result.current.data).toEqual(["Work", "Work/Ideas"])
  })
})

describe("upsertNoteInLocalQueryCache", () => {
  it("inserts into an empty cache and sorts by recency", () => {
    const queryClient = new QueryClient()
    const n = note("a", "2026-03-01T00:00:00.000Z")
    upsertNoteInLocalQueryCache(queryClient, n)
    expect(
      queryClient.getQueryData(NOTES_LOCAL_QUERY_KEY)?.map(x => x.id)
    ).toEqual(["a"])
  })

  it("replaces an existing id and re-sorts", () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Note[]>(NOTES_LOCAL_QUERY_KEY, [
      note("older", "2026-01-01T00:00:00.000Z"),
      note("target", "2026-02-01T00:00:00.000Z"),
    ])
    upsertNoteInLocalQueryCache(
      queryClient,
      note("target", "2026-04-01T00:00:00.000Z")
    )
    expect(
      queryClient.getQueryData<Note[]>(NOTES_LOCAL_QUERY_KEY)?.map(x => x.id)
    ).toEqual(["target", "older"])
  })
})

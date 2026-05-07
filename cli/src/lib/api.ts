import { API_BASE_URL } from "../constants/env.js"
import { Note, NoteFileData } from "../shared/note/index.js"

type ApiResult<T> = { data?: T; error?: Error }

export class MemoneoApiClient {
  constructor(private readonly token: string) {}

  query(queryName: string, _variables: Record<string, unknown>) {
    return {
      toPromise: async (): Promise<ApiResult<any>> => {
        if (queryName === "DownloadQuery") {
          return this.getNotes()
        }
        if (queryName === "NoteIdQuery") {
          return this.getNoteIds()
        }
        return { error: new Error(`Unsupported API query: ${queryName}`) }
      },
    }
  }

  mutation(mutationName: string, variables: Record<string, any>) {
    return {
      toPromise: async (): Promise<ApiResult<any>> => {
        switch (mutationName) {
          case "InsertNoteMutation":
            return this.upsertNotes(variables.inputs)
          case "UpdateNoteMutation":
            return this.updateNote(variables.id, variables)
          case "ArchiveNotesMutation":
          case "ArchiveNoteMutation":
            return this.archiveNotes(variables.ids ?? [variables.id])
          case "DeleteNotesMutation":
            return this.deleteNotes(variables.ids)
          case "InsertNoteFileDataMutation":
          case "UpdateNoteFileDataMutation":
            return this.upsertNoteFiles(variables.inputs)
          default:
            return { error: new Error(`Unsupported API mutation: ${mutationName}`) }
        }
      },
    }
  }

  async getNotes(): Promise<ApiResult<{ note: Note[] }>> {
    return this.request("/notes")
  }

  async getNoteIds(): Promise<ApiResult<{ note: { id: string; title: string }[] }>> {
    return this.request("/notes/ids")
  }

  async upsertNotes(notes: Partial<Note>[]): Promise<ApiResult<{ insert_note: { returning: Note[] } }>> {
    return this.request("/notes/bulk", {
      method: "POST",
      body: JSON.stringify(notes),
    })
  }

  async updateNote(
    id: string,
    note: Partial<Note>
  ): Promise<ApiResult<{ update_note_by_pk: Note }>> {
    return this.request(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(note),
    })
  }

  async archiveNotes(ids: string[]): Promise<ApiResult<{ update_note: { returning: { id: string }[] } }>> {
    return this.request("/notes/archive", {
      method: "POST",
      body: JSON.stringify({ ids }),
    })
  }

  async deleteNotes(ids: string[]): Promise<ApiResult<{ delete_note: { returning: { id: string }[] } }>> {
    return this.request("/notes", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    })
  }

  async upsertNoteFiles(
    files: NoteFileData[]
  ): Promise<ApiResult<{ insert_note_file_data: { returning: NoteFileData[] } }>> {
    const returning: NoteFileData[] = []
    for (const file of files) {
      if (!file.note_id) {
        return { error: new Error("note_id is required for note file data") }
      }
      const result = await this.request<{ file: NoteFileData }>(
        `/notes/${file.note_id}/file`,
        {
          method: "PUT",
          body: JSON.stringify(file),
        }
      )
      if (result.error) {
        return { error: result.error }
      }
      if (result.data?.file) {
        returning.push(result.data.file)
      }
    }
    return { data: { insert_note_file_data: { returning } } }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${this.token}`,
          ...(init.headers ?? {}),
        },
      })
      if (!response.ok) {
        return { error: new Error(`API request failed: ${response.status} ${response.statusText}`) }
      }
      return { data: (await response.json()) as T }
    } catch (error) {
      return { error: error as Error }
    }
  }
}

export function createApiClient(token: string) {
  return new MemoneoApiClient(token)
}

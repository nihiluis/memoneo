import createClient from "openapi-fetch"
import type { operations, paths } from "./openapi-types.js"

type JsonContent<T> = T extends { content: { "application/json": infer Body } }
  ? Body
  : never

type JsonRequestBody<T> = T extends { requestBody: infer Body }
  ? JsonContent<Body>
  : never

type JsonResponse<T, Status extends number = 200> = T extends {
  responses: { [K in Status]: infer Response }
}
  ? JsonContent<Response>
  : never

export type Note = JsonResponse<operations["getNotes"]>[number] & {
  decryptedBody?: string
}
export type NoteInput = JsonRequestBody<operations["putNote"]>
export type NoteUpdate = JsonRequestBody<operations["putNotesById"]>
export type NoteFileData = JsonResponse<operations["putNotesByIdFile"]>
export type NoteFileDataInput = JsonRequestBody<operations["putNotesByIdFile"]>
export type NoteIdAndTitle = JsonResponse<operations["getNotesIds"]>[number]

export type ApiResult<T> = { data?: T; error?: Error }
type DeletedNote = JsonResponse<operations["deleteNotes"]>[number]
type OpenApiResult<T> = { data?: T; error?: unknown; response: Response }

export class MemoneoApiClient {
  private readonly client

  constructor(
    private readonly token: string,
    private readonly baseUrl: string
  ) {
    this.client = createClient<paths>({
      baseUrl,
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    })
  }

  async getNotes(): Promise<ApiResult<Note[]>> {
    return this.request(this.client.GET("/notes"))
  }

  async getNoteIds(): Promise<ApiResult<{ id: string; title: string }[]>> {
    return this.request(this.client.GET("/notes/ids"))
  }

  async upsertNotes(notes: NoteInput[]): Promise<ApiResult<Note[]>> {
    return this.request(this.client.POST("/notes/bulk", { body: notes }))
  }

  async updateNote(
    id: string,
    note: NoteUpdate
  ): Promise<ApiResult<Note>> {
    return this.request(
      this.client.PUT("/notes/{id}", {
        params: { path: { id } },
        body: note,
      })
    )
  }

  async archiveNotes(ids: string[]): Promise<ApiResult<DeletedNote[]>> {
    return this.request(this.client.POST("/notes/archive", { body: { ids } }))
  }

  async deleteNotes(ids: string[]): Promise<ApiResult<DeletedNote[]>> {
    return this.request(this.client.DELETE("/notes", { body: { ids } }))
  }

  async upsertNoteFiles(
    files: NoteFileDataInput[]
  ): Promise<ApiResult<NoteFileData[]>> {
    const returning: NoteFileData[] = []
    for (const file of files) {
      if (!file.note_id) {
        return { error: new Error("note_id is required for note file data") }
      }
      const result = await this.request<NoteFileData>(
        this.client.PUT(
          "/notes/{id}/file",
          {
            params: { path: { id: file.note_id } },
            body: file,
          }
        )
      )
      if (result.error) {
        return { error: result.error }
      }
      if (result.data) {
        returning.push(result.data)
      }
    }
    return { data: returning }
  }

  private async request<T>(request: Promise<OpenApiResult<T>>): Promise<ApiResult<T>> {
    try {
      const result = await request
      if (result.error) {
        return { error: this.toError(result.error, result.response) }
      }
      return { data: result.data as T }
    } catch (error) {
      return { error: this.toTransportError(error) }
    }
  }

  private toTransportError(error: unknown): Error {
    if (error instanceof Error) {
      return new Error(`API request failed for ${this.baseUrl}: ${getErrorMessages(error)}`, {
        cause: error,
      })
    }

    return new Error(`API request failed for ${this.baseUrl}: ${String(error)}`)
  }

  private toError(error: unknown, response: Response): Error {
    if (error instanceof Error) {
      return error
    }
    const detail = typeof error === "string" ? error : JSON.stringify(error)
    return new Error(`API request failed: ${response.status} ${response.statusText}${detail ? `: ${detail}` : ""}`)
  }
}

function getErrorMessages(error: Error): string {
  const messages: string[] = []
  let current: unknown = error

  while (current instanceof Error) {
    const currentMessage = current.message
    const alreadyIncluded = messages.some(
      message =>
        message === currentMessage || message.includes(currentMessage)
    )
    if (currentMessage && !alreadyIncluded) {
      messages.push(currentMessage)
    }

    current = current.cause
  }

  return messages.join(": ")
}

export function createApiClient(token: string, baseUrl: string) {
  return new MemoneoApiClient(token, baseUrl)
}

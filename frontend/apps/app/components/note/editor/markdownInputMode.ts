export function normalizeNoteBody(body: string) {
  if (body.includes("\n") || body.includes("\r")) {
    return body
  }

  return body.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n")
}

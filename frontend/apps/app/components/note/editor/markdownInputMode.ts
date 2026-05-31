const UNSUPPORTED_BLOCK_MARKDOWN_RE =
  /(^|\n)\s{0,3}(#{1,6}\s|[-+*](?=\s|[^\w\s])|\d+[.)]\s|>\s|```|~~~)/

export function normalizeNoteBody(body: string) {
  if (body.includes("\n") || body.includes("\r")) {
    return body
  }

  return body.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n")
}

export function shouldEditAsPlainMarkdown(body: string) {
  return UNSUPPORTED_BLOCK_MARKDOWN_RE.test(normalizeNoteBody(body))
}

export function escapeMarkdownForPlainEditing(body: string) {
  return normalizeNoteBody(body)
    .replace(/(^|\n)(\s{0,3})(#{1,6})(?=\s)/g, "$1$2\\$3")
    .replace(/(^|\n)(\s{0,3})([-+*])(?=\s|[^\w\s])/g, "$1$2\\$3")
    .replace(/(^|\n)(\s{0,3})(\d+[.)])(?=\s)/g, "$1$2\\$3")
    .replace(/(^|\n)(\s{0,3})(>)(?=\s)/g, "$1$2\\$3")
    .replace(/(^|\n)(\s{0,3})(```|~~~)/g, "$1$2\\$3")
}

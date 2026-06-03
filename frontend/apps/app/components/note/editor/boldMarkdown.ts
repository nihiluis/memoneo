export type BoldMarkdownSegment = {
  bold: boolean
  text: string
}

export type TextSelection = {
  end: number
  start: number
}

export type BoldMarkdownToggleResult = {
  body: string
  selection: TextSelection
}

const BOLD_MARKER = "**"

export function parseBoldMarkdownSegments(body: string): BoldMarkdownSegment[] {
  const segments: BoldMarkdownSegment[] = []
  let cursor = 0
  let isBold = false

  while (cursor < body.length) {
    const markerIndex = body.indexOf(BOLD_MARKER, cursor)
    if (markerIndex === -1) {
      pushSegment(segments, body.slice(cursor), isBold)
      break
    }

    pushSegment(segments, body.slice(cursor, markerIndex), isBold)
    pushSegment(segments, BOLD_MARKER, false)
    cursor = markerIndex + BOLD_MARKER.length
    isBold = !isBold
  }

  return segments.length > 0 ? segments : [{ bold: false, text: "" }]
}

export function isSelectionInBoldMarkdown(
  body: string,
  selection: TextSelection
): boolean {
  const position = clampSelection(selection, body.length).start
  let isBold = false
  let cursor = 0

  while (cursor < body.length) {
    const markerIndex = body.indexOf(BOLD_MARKER, cursor)
    if (markerIndex === -1 || markerIndex >= position) {
      return isBold
    }

    isBold = !isBold
    cursor = markerIndex + BOLD_MARKER.length
  }

  return isBold
}

export function toggleBoldMarkdown(
  body: string,
  selection: TextSelection
): BoldMarkdownToggleResult {
  const { start, end } = clampSelection(selection, body.length)
  const hasSelectedText = end > start
  const selectedText = body.slice(start, end)

  if (
    start >= BOLD_MARKER.length &&
    body.slice(start - BOLD_MARKER.length, start) === BOLD_MARKER &&
    body.slice(end, end + BOLD_MARKER.length) === BOLD_MARKER
  ) {
    return {
      body:
        body.slice(0, start - BOLD_MARKER.length) +
        selectedText +
        body.slice(end + BOLD_MARKER.length),
      selection: {
        start: start - BOLD_MARKER.length,
        end: end - BOLD_MARKER.length,
      },
    }
  }

  const nextBody =
    body.slice(0, start) +
    BOLD_MARKER +
    selectedText +
    BOLD_MARKER +
    body.slice(end)
  const nextPosition = start + BOLD_MARKER.length

  return {
    body: nextBody,
    selection: hasSelectedText
      ? {
          start: nextPosition,
          end: end + BOLD_MARKER.length,
        }
      : {
          start: nextPosition,
          end: nextPosition,
        },
  }
}

function clampSelection(selection: TextSelection, bodyLength: number): TextSelection {
  const start = Math.max(0, Math.min(selection.start, bodyLength))
  const end = Math.max(start, Math.min(selection.end, bodyLength))
  return { start, end }
}

function pushSegment(
  segments: BoldMarkdownSegment[],
  text: string,
  bold: boolean
) {
  if (!text) {
    return
  }
  segments.push({ bold, text })
}

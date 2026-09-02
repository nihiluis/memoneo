export const EDITOR_BASE_BOTTOM_PADDING = 24
export const MARKDOWN_TOOLBAR_GAP = 12
export const DEFAULT_MARKDOWN_TOOLBAR_HEIGHT = 56

export function getEditorBottomPadding(
  toolbarHeight: number,
  bottomInset: number,
): number {
  const resolvedToolbarHeight = Math.max(
    toolbarHeight,
    DEFAULT_MARKDOWN_TOOLBAR_HEIGHT,
  )
  return (
    EDITOR_BASE_BOTTOM_PADDING +
    resolvedToolbarHeight +
    MARKDOWN_TOOLBAR_GAP +
    Math.max(bottomInset, 0)
  )
}

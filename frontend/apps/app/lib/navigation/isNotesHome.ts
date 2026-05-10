/**
 * True when the focused route is the notes tab stack index (`(tabs)/index`).
 * Used to skip redundant `router.push("/")` when already there.
 */
export function isFocusedRouteNotesHome(segments: readonly string[]): boolean {
  return (
    segments[0] === "(tabs)" &&
    (segments.length === 1 || segments[1] === "index")
  )
}

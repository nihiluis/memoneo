import type { Note } from "@memoneo/shared"

export type NoteTreeNode = {
  id: string
  name: string
  folders: NoteTreeNode[]
  notes: Note[]
}

export type TreeRow =
  | {
      id: string
      depth: number
      folder: NoteTreeNode
      kind: "folder"
    }
  | {
      id: string
      depth: number
      kind: "note"
      note: Note
    }

export function buildNoteTree(
  notes: Note[],
  folderPaths: readonly string[] = []
): NoteTreeNode {
  const root: NoteTreeNode = { id: "", name: "root", folders: [], notes: [] }

  folderPaths.forEach(path => {
    ensureFolderPath(root, path.split(/[\\/]/).filter(Boolean))
  })

  notes.forEach(note => {
    const current = ensureFolderPath(root, getDirectorySegments(note))
    current.notes.push(note)
  })

  sortTree(root)
  return root
}

export function flattenVisibleTree(
  root: NoteTreeNode,
  expandedFolderIds: Set<string>
) {
  const rows: TreeRow[] = []

  function appendNode(node: NoteTreeNode, depth: number) {
    node.folders.forEach(folder => {
      rows.push({
        id: `folder:${folder.id}`,
        depth,
        folder,
        kind: "folder",
      })

      if (expandedFolderIds.has(folder.id)) {
        appendNode(folder, depth + 1)
      }
    })

    node.notes.forEach(note => {
      rows.push({
        id: `note:${note.id}`,
        depth,
        kind: "note",
        note,
      })
    })
  }

  appendNode(root, 0)
  return rows
}

export function getSelectedFolderIds(notes: Note[], selectedNoteId: string) {
  const selectedNote = notes.find(note => note.id === selectedNoteId)
  if (!selectedNote) {
    return []
  }

  const folderIds: string[] = []
  let currentFolderId = ""
  getDirectorySegments(selectedNote).forEach(segment => {
    currentFolderId = getFolderId(currentFolderId, segment)
    folderIds.push(currentFolderId)
  })
  return folderIds
}

export function getNoteFolderId(note: Note) {
  const path = note.file?.path?.trim()
  if (!path) {
    return "Unfiled"
  }

  return path.split(/[\\/]/).filter(Boolean).join("/")
}

export function getFolderPathFromId(folderId: string) {
  return folderId === "Unfiled" ? "" : folderId
}

export function getNoteTitle(note: Note) {
  return note.file?.title ?? note.title
}

export function setsAreEqual<T>(left: Set<T>, right: Set<T>) {
  if (left.size !== right.size) {
    return false
  }
  for (const value of left) {
    if (!right.has(value)) {
      return false
    }
  }
  return true
}

function getDirectorySegments(note: Note) {
  const path = note.file?.path?.trim()
  if (!path) {
    return ["Unfiled"]
  }

  const segments = path.split(/[\\/]/).filter(Boolean)
  return segments.length > 0 ? segments : ["Unfiled"]
}

function ensureFolderPath(root: NoteTreeNode, segments: string[]) {
  let current = root

  segments.forEach(segment => {
    let folder = current.folders.find(item => item.name === segment)
    if (!folder) {
      folder = {
        id: getFolderId(current.id, segment),
        name: segment,
        folders: [],
        notes: [],
      }
      current.folders.push(folder)
    }
    current = folder
  })

  return current
}

function sortTree(node: NoteTreeNode) {
  node.folders.sort((a, b) => a.name.localeCompare(b.name))
  node.notes.sort((a, b) => getNoteTitle(a).localeCompare(getNoteTitle(b)))
  node.folders.forEach(sortTree)
}

function getFolderId(parentId: string, segment: string) {
  return parentId ? `${parentId}/${segment}` : segment
}

import type { Note } from "@memoneo/shared"
import { View } from "react-native"

import { MText } from "@/components/reusables/MText"
import { cn } from "@/lib/reusables/utils"

type NoteDetailsTableProps = {
  note: Note
  lastSync?: string
}

export function NoteDetailsTable({ note, lastSync }: NoteDetailsTableProps) {
  const rows = [
    ["Created", formatDateTime(note.created_at)],
    ["Modified", formatDateTime(note.updated_at)],
    ["Last sync", lastSync ? formatDateTime(lastSync) : "Not synced"],
  ]

  return (
    <View
      role="table"
      accessibilityLabel="Note details"
      className="my-2 overflow-hidden rounded-md border border-zinc-700"
    >
      {rows.map(([label, value], index) => (
        <View
          key={label}
          role="row"
          className={cn(
            "flex-row items-stretch",
            index > 0 && "border-t border-zinc-700"
          )}
        >
          <View role="rowheader" className="w-24 justify-center bg-zinc-800/50 px-3 py-2.5">
            <MText className="text-xs font-medium text-zinc-400">{label}</MText>
          </View>
          <View role="cell" className="min-w-0 flex-1 justify-center border-l border-zinc-700 px-3 py-2.5">
            <MText className="text-xs text-zinc-100">{value}</MText>
          </View>
        </View>
      ))}
    </View>
  )
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Unknown"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown"

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

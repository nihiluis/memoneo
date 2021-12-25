import { PlusIcon } from "@radix-ui/react-icons"
import dayjs, { Dayjs } from "dayjs"
import React, { Suspense, useContext, useEffect, useState } from "react"
import { usePreloadedQuery } from "react-relay"
import NoteListItem from "./NoteListItem"
import { DataLoaderContext } from "../../DataLoader"
import { defaultNoteQuery } from "../../DataLoader.gql"
import List from "../../list/List"
import OverviewSimpleWrapper from "../../overview/OverviewSimpleWrapper"
import Calendar, {
  BaseContextProps,
} from "../../ui/primitives/calendar/Calendar"
import { ContextMenuItem } from "../../ui/primitives/ContextMenu"
import {
  DataLoaderInnerNoteQuery,
  DataLoaderInnerNoteQueryResponse,
} from "../../__generated__/DataLoaderInnerNoteQuery.graphql"

import style from "./Overview.module.css"
import NoteEditor from "./NoteEditor"
import { DEFAULT_NOTE_CONNECTION } from "../../../constants/connections"
import {
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from "../../ui/primitives/Dialog"

interface Props {
  className?: string
}

type Item = DataLoaderInnerNoteQueryResponse["note_connection"]["edges"][0]["node"]

export default function NoteCalendarOverview(props: Props): JSX.Element {
  return (
    <Suspense fallback={null}>
      <NoteCalendarOverviewInner {...props} />
    </Suspense>
  )
}

function NoteCalendarOverviewInner(props: Props): JSX.Element {
  const [showArchived, setShowArchived] = useState(false)
  const [focusedDay, setFocusedDay] = useState<Dayjs>(dayjs())
  const [activeMonth, setActiveMonth] = useState<Dayjs>(dayjs())

  const { noteQueryRef } = useContext(DataLoaderContext)

  const data = usePreloadedQuery<DataLoaderInnerNoteQuery>(
    defaultNoteQuery,
    noteQueryRef
  )

  const [shownItems, setShownItems] = useState<Item[]>([])
  const [activeItems, setActiveItems] = useState<Item[]>([])
  const [activeItemsDate, setActiveItemsDate] = useState<Dayjs[]>([])

  useEffect(() => {
    const items: Item[] = data.note_connection.edges
      .map(edge => edge.node)
      .filter(node => dayjs(node.date as string).isSame(activeMonth, "month"))

    setActiveItems(items)
    setActiveItemsDate(items.map(item => dayjs(item.date as string)))
  }, [activeMonth, data])

  useEffect(() => {
    const items: Item[] = data.note_connection.edges
      .map(edge => edge.node)
      .filter(node => node.date === focusedDay.format("YYYY-MM-DD"))

    setShownItems(items)
  }, [data, focusedDay, showArchived])

  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false)
  function onCloseEditor() {
    setAddNoteDialogOpen(false)
  }

  return (
    <OverviewSimpleWrapper
      title="Notes"
      showArchived={showArchived}
      setShowArchived={setShowArchived}
      className="mb-10">
      <DialogRoot open={addNoteDialogOpen} onOpenChange={setAddNoteDialogOpen}>
        <Calendar
          focusedDay={focusedDay}
          focusDay={setFocusedDay}
          month={activeMonth}
          setMonth={month => setActiveMonth(activeMonth.month(month))}
          className={style.calendar}
          contextMenuItems={DropdownMenuItems}
          activeDays={activeItemsDate}
        />
        <div className="mt-4">
          <List<Item>
            items={shownItems}
            type="note"
            ItemComponent={NoteListItem}
            MutateComponent={NoteEditor}
            connection={DEFAULT_NOTE_CONNECTION}
            showArchived={showArchived}
          />
        </div>
        <DialogContent>
          <NoteEditor onComplete={onCloseEditor} onCancel={onCloseEditor} />
        </DialogContent>
      </DialogRoot>
    </OverviewSimpleWrapper>
  )
}

function DropdownMenuItems(props: BaseContextProps) {
  return (
    <React.Fragment>
      <ContextMenuItem interactive className="flex gap-2">
        <DialogTrigger
          onClick={event => event.stopPropagation()}
          className="flex gap-2 w-full items-center">
          <PlusIcon
            color="var(--icon-color)"
            width={20}
            height={20}
            className="icon-20"
          />
          <p>Add note</p>
        </DialogTrigger>
      </ContextMenuItem>
    </React.Fragment>
  )
}

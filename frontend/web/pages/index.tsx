import React, { useEffect, useState, useContext } from "react"

import GridLayout from "../src/components/ui/layout/GridLayout"
import Auth from "../src/components/Auth"
import { initEnvironment } from "../src/relay/relay"
import GoalOverview from "../src/components/goal/GoalOverview"
import RightSidebar from "../src/components/sidebar/RightSidebar"
import LeftSidebar from "../src/components/sidebar/left/LeftSidebar"
import DataLoader from "../src/components/DataLoader"
import TodoOverview from "../src/components/todo/TodoOverview"
import ActivityOverview from "../src/components/activity/ActivityOverview"

export default function Index() {
  return (
    <Auth require>
      <DataLoader>
        <IndexInner />
      </DataLoader>
    </Auth>
  )
}

function IndexInner() {
  const [showSidebarLeft, setShowSidebarLeft] = useState<boolean>(false)
  const [showSidebarRight, setShowSidebarRight] = useState<boolean>(false)

  return (
    <GridLayout
      showSidebarLeft={showSidebarLeft}
      setShowSidebarLeft={setShowSidebarLeft}
      showSidebarRight={showSidebarRight}
      setShowSidebarRight={setShowSidebarRight}
      sidebarLeftComponent={<LeftSidebar />}
      sidebarRightComponent={<RightSidebar />}>
      <div className="flex gap-10">
        <GoalOverview className="w-1/3" />
        <TodoOverview className="w-1/3" />
        <ActivityOverview className="w-1/3" />
      </div>
    </GridLayout>
  )
}

export async function getStaticProps() {
  initEnvironment()

  return { props: {} }
}

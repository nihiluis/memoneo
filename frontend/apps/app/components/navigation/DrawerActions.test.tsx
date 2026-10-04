import { describe, expect, it, vi } from "vitest"
import { testingLibrary } from "../../test/react-native-testing"
import { atom, createStore, Provider } from "jotai"

vi.doMock("lucide-react-native", () => ({ LogIn: () => null, Upload: () => null, RefreshCw: () => null, Download: () => null, Settings: () => null }))

const push = vi.fn()
const closeDrawer = vi.fn()
const runSyncAction = vi.fn()
vi.doMock("expo-router", () => ({ useRouter: () => ({ push }) }))
vi.doMock("./appDrawerContext", () => ({ useAppDrawer: () => ({ closeDrawer }) }))
vi.doMock("@/lib/auth/state", () => ({ authAtom: atom({ isAuthenticated: false }) }))
vi.doMock("@/lib/notes/state", () => ({ selectedFolderIdAtom: atom("") }))
vi.doMock("./actions/mutations", () => ({ useSyncDrawerMutation: () => ({ isSyncing: false, runSyncAction }) }))
vi.doMock("./actions/NewNoteDrawerAction", () => ({ NewNoteDrawerAction: () => null }))
vi.doMock("./actions/NewFolderDrawerAction", () => ({ NewFolderDrawerAction: () => null }))
const { authAtom } = await import("@/lib/auth/state")
const { DrawerActions } = await import("./DrawerActions")
const { fireEvent, render } = testingLibrary

describe("DrawerActions", () => {
  it("shows login instead of sync actions when signed out", () => {
    const result = render(<Provider store={createStore()}><DrawerActions /></Provider>)
    for (const label of ["Upload", "Download", "Sync"]) expect(result.queryByText(label)).toBeNull()
    expect(result.getByText("Settings")).toBeTruthy()
    fireEvent.press(result.getByText("Login to sync"))
    expect(closeDrawer).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith("/auth/login")
  })
  it("puts settings in the first row and download last, and runs sync actions", () => {
    const store = createStore()
    store.set(authAtom, { ...store.get(authAtom), isAuthenticated: true })
    const result = render(<Provider store={store}><DrawerActions /></Provider>)
    expect(result.queryByText("Login to sync")).toBeNull()
    const labels = result.UNSAFE_getAllByType("Text").map(node => node.props.children)
    expect(labels).toEqual(["Settings", "Upload", "Sync", "Download"])
    for (const label of ["Upload", "Sync", "Download"]) fireEvent.press(result.getByText(label))
    expect(runSyncAction.mock.calls).toEqual([["upload"], ["sync"], ["download"]])
  })
})

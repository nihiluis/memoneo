import { useEffect, useState } from "react"
import { Alert } from "react-native"
import { request, requestMultiple, Permission } from "react-native-permissions"

interface Props {
  children?: React.ReactNode
  permissions: Permission[]
  // Whether null should be returned if permissions are not granted.
  preventRender?: boolean
  alertMessage?: string
}

export function PermissionProvider({
  children,
  permissions,
  alertMessage,
  preventRender = false,
}: Props) {
  const [notGrantedPermissions, setNotGrantedPermissions] = useState<
    Permission[]
  >([])

  useEffect(() => {
    async function requestPermissions() {
      console.log("Requesting permissions", permissions)

      if (permissions.length === 0) {
        return
      }

      if (permissions.length === 1) {
        request(permissions[0]).then(status => {
          console.warn(`Permission ${permissions[0]} status`, status)
          if (status !== "granted") {
            if (alertMessage) {
              Alert.alert(alertMessage)
            }
            setNotGrantedPermissions([permissions[0]])
          }
        })
        return
      }

      requestMultiple(permissions).then(statusMap => {
        console.log("Permissions status", statusMap)
        const notGrantedPermissions = Object.entries(statusMap).filter(
          ([_, status]) => status !== "granted"
        )
        if (notGrantedPermissions.length > 0) {
          console.warn(
            `Permissions ${notGrantedPermissions.join(", ")} not granted`
          )

          if (alertMessage) {
            Alert.alert(alertMessage)
          }
        }
        setNotGrantedPermissions(
          Object.keys(notGrantedPermissions) as Permission[]
        )
      })
    }
    requestPermissions()
  }, [])

  if (preventRender && notGrantedPermissions.length > 0) {
    return null
  }

  return <>{children}</>
}

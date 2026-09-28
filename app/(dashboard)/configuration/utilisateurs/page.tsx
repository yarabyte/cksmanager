import { listUsersForConfig } from "@/app/actions/users"
import { getPermissionsConfig } from "@/app/actions/permissions"
import { UtilisateursConfigClient } from "./utilisateurs-config-client"

export const dynamic = "force-dynamic"

export default async function UtilisateursConfigPage() {
  const [initialUsers, permissionsConfig] = await Promise.all([
    listUsersForConfig(),
    getPermissionsConfig(),
  ])
  return (
    <UtilisateursConfigClient
      initialUsers={initialUsers}
      initialPermissionMatrix={permissionsConfig.matrix}
      initialCustomGroups={permissionsConfig.customGroups}
      canEditPermissions={permissionsConfig.canEdit}
    />
  )
}

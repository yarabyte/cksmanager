import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/session'
import { toSidebarUser } from '@/lib/auth/types'
import { loadPermissionsConfig } from '@/lib/permissions-server'
import { canViewPathname } from '@/lib/permissions-access'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { QueryProvider } from '@/components/providers/query-provider'

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  // JWT encore valide mais user absent (DB reset) → clear cookie via logout (évite boucle middleware)
  if (!user) redirect('/api/auth/logout')

  const { matrix, customGroups } = await loadPermissionsConfig()
  const customGroup = user.customGroup
    ? (customGroups.find((g) => g.id === user.customGroup!.id) ?? user.customGroup)
    : null
  const resolved = { ...user, customGroup }
  const pathname = (await headers()).get('x-pathname') ?? ''
  if (pathname && !canViewPathname(resolved, matrix, pathname)) {
    redirect('/dashboard')
  }

  return (
    <QueryProvider>
      <DashboardLayout user={toSidebarUser(resolved)} permissionMatrix={matrix}>
        {children}
      </DashboardLayout>
    </QueryProvider>
  )
}

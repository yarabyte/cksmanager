import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { toSidebarUser } from '@/lib/auth/types'
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

  return (
    <QueryProvider>
      <DashboardLayout user={toSidebarUser(user)}>{children}</DashboardLayout>
    </QueryProvider>
  )
}

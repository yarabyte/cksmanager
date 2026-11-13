import { getDashboardData } from "@/app/actions/dashboard"
import { requireUser } from "@/lib/auth/session"
import { DashboardClient } from "./dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await requireUser()
  const data = await getDashboardData(user.role, user.id)
  return <DashboardClient data={data} profile={user.role} />
}

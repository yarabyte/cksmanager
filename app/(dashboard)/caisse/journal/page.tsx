import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getJournalCaisseJour } from "@/app/actions/caisse"
import { getActiveCaisseSession } from "@/app/actions/caisse-sessions"
import { CaisseJournalClient } from "@/components/caisse/caisse-journal-client"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function CaisseJournalPage() {
  const session = await getActiveCaisseSession()
  if (!session) redirect("/caisse/ouverture")

  const journal = await getJournalCaisseJour(session.id, { periode: "today" })

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2 mb-2">
            <Link href="/caisse">
              <ArrowLeft className="h-4 w-4" />
              Retour à la caisse
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Journal de caisse</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mouvements du poste de caisse, filtrables par période
          </p>
        </div>
      </div>

      <CaisseJournalClient
        sessionId={session.id}
        initialJournal={journal}
        posteNom={session.posteNom}
      />
    </div>
  )
}

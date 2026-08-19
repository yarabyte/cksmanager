"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowRight,
  Banknote,
  Check,
  Clock,
  History,
  Info,
  Loader2,
  Lock,
  Settings,
  Store,
  UserCog,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatCurrency } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import { openCaisseSession } from "@/app/actions/caisse-sessions"

type PosteOption = { id: string; nom: string; description: string | null }

function PosteSelectCard({
  poste,
  selected,
  onSelect,
}: {
  poste: PosteOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:border-gray-200 hover:shadow-md",
        selected && "border-[#cd3b86]/40 bg-[#cd3b86]/[0.03] ring-2 ring-[#cd3b86]/20",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-[#cd3b86]/15 text-[#cd3b86]" : "bg-gray-50 text-gray-400",
        )}
      >
        <Store className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800">{poste.nom}</p>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
          {poste.description?.trim() || "Poste de caisse disponible"}
        </p>
      </div>
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-[#cd3b86] bg-[#cd3b86] text-white"
            : "border-gray-200 bg-white",
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </div>
    </button>
  )
}

function StatusEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
      <CardContent className="p-8 sm:p-12">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#cd3b86]/10 text-[#cd3b86]">
                <Icon className="h-6 w-6" />
              </div>
            </EmptyMedia>
            <EmptyTitle className="text-gray-900">{title}</EmptyTitle>
            <EmptyDescription className="text-gray-500">{description}</EmptyDescription>
          </EmptyHeader>
          {action}
        </Empty>
      </CardContent>
    </Card>
  )
}

export function OuvertureCaisseClient({
  postes,
  hasOpenSession,
  requiresAssignment = false,
  assignedPosteInactif = false,
  assignedPosteNom = null,
  posteOccupe = false,
}: {
  postes: PosteOption[]
  hasOpenSession: boolean
  requiresAssignment?: boolean
  assignedPosteInactif?: boolean
  assignedPosteNom?: string | null
  posteOccupe?: boolean
}) {
  const router = useRouter()
  const [posteId, setPosteId] = React.useState(postes[0]?.id ?? "")
  const [solde, setSolde] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const selectedPoste = postes.find((p) => p.id === posteId)
  const soldeNum = Number.parseFloat(solde.replace(/\s/g, "").replace(",", "."))
  const soldeValide = Number.isFinite(soldeNum) && soldeNum >= 0
  const canOpen = Boolean(posteId) && soldeValide && solde.trim() !== ""

  React.useEffect(() => {
    if (hasOpenSession) router.replace("/caisse")
  }, [hasOpenSession, router])

  React.useEffect(() => {
    if (postes.length > 0 && !postes.some((p) => p.id === posteId)) {
      setPosteId(postes[0].id)
    }
  }, [postes, posteId])

  async function handleOpen() {
    if (!posteId) {
      toast.error("Sélectionnez un poste de caisse.")
      return
    }
    if (!soldeValide) {
      toast.error("Solde d'ouverture invalide.")
      return
    }
    setPending(true)
    try {
      const res = await openCaisseSession({ posteId, soldeOuverture: soldeNum })
      if (res.ok) {
        toast.success("Caisse ouverte")
        router.push("/caisse")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(false)
    }
  }

  const singleAssignedPoste = postes.length === 1 && Boolean(assignedPosteNom)

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Ouverture de caisse
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-xl">
            {singleAssignedPoste
              ? `Ouvrez votre poste affecté (${assignedPosteNom}) et saisissez le montant en espèces présent dans le tiroir.`
              : "Choisissez un poste libre et saisissez le montant en espèces présent dans le tiroir au démarrage."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg">
          <Link href="/cloture/historique">
            <History className="h-4 w-4" />
            Historique
          </Link>
        </Button>
      </div>

      {requiresAssignment ? (
        <StatusEmpty
          icon={UserCog}
          title="Poste non affecté"
          description="Votre compte caissier n'a pas encore de poste assigné. Demandez à un administrateur de vous affecter un poste dans Configuration → Utilisateurs."
        />
      ) : assignedPosteInactif ? (
        <StatusEmpty
          icon={Wallet}
          title="Poste inactif"
          description={`Votre poste affecté${assignedPosteNom ? ` (${assignedPosteNom})` : ""} est désactivé. Contactez un administrateur.`}
        />
      ) : posteOccupe ? (
        <StatusEmpty
          icon={Clock}
          title="Poste occupé"
          description={`Votre poste${assignedPosteNom ? ` « ${assignedPosteNom} »` : ""} est déjà ouvert par un autre caissier. Réessayez plus tard ou contactez un responsable.`}
        />
      ) : postes.length === 0 ? (
        <StatusEmpty
          icon={Wallet}
          title="Aucun poste disponible"
          description="Tous les postes sont occupés ou aucun poste actif n'est configuré. Contactez un administrateur ou configurez de nouveaux postes."
          action={
            <Button
              asChild
              variant="outline"
              className="mt-4 gap-2 rounded-xl border-gray-200"
            >
              <Link href="/configuration/caisses">
                <Settings className="h-4 w-4" />
                Gérer les postes
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      Postes libres
                    </p>
                    <p className="text-xl font-extrabold mt-1 tabular-nums text-gray-900">
                      {postes.length}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/8 text-[#cd3b86]">
                    <Store className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      Poste sélectionné
                    </p>
                    <p className="text-base font-extrabold mt-1 text-gray-900 truncate">
                      {selectedPoste?.nom ?? "—"}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Lock className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      Solde d&apos;ouverture
                    </p>
                    <p className="text-xl font-extrabold mt-1 tabular-nums text-[#cd3b86]">
                      {soldeValide && solde.trim()
                        ? formatCurrency(soldeNum)
                        : "—"}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Banknote className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-2 border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#cd3b86]/10 text-[11px] font-bold text-[#cd3b86]">
                    1
                  </span>
                  Poste de caisse
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  {singleAssignedPoste
                    ? `Poste affecté : ${assignedPosteNom}`
                    : `${postes.length} poste${postes.length > 1 ? "s" : ""} libre${postes.length > 1 ? "s" : ""} actuellement`}
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {postes.map((p) => (
                  <PosteSelectCard
                    key={p.id}
                    poste={p}
                    selected={posteId === p.id}
                    onSelect={() => setPosteId(p.id)}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#cd3b86]/10 text-[11px] font-bold text-[#cd3b86]">
                    2
                  </span>
                  Solde d&apos;ouverture
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Montant compté en espèces dans le tiroir
                </p>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="solde" className="text-xs font-semibold text-gray-500">
                    Montant (FCFA)
                  </Label>
                  <div className="relative">
                    <Banknote className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="solde"
                      type="text"
                      inputMode="decimal"
                      value={solde}
                      onChange={(e) => setSolde(e.target.value)}
                      placeholder="0"
                      className="h-11 rounded-xl border-gray-200 pl-10 text-lg font-semibold tabular-nums"
                      onKeyDown={(e) => e.key === "Enter" && canOpen && void handleOpen()}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p className="text-xs leading-relaxed">
                    Ce montant sert de base au solde théorique de votre session. Les recharges
                    patient et versements espèces seront ajoutés ou déduits automatiquement.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Récapitulatif
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-600">
                      Poste :{" "}
                      <strong className="text-gray-900">{selectedPoste?.nom ?? "—"}</strong>
                    </span>
                    <span className="text-gray-600">
                      Solde :{" "}
                      <strong className="text-[#cd3b86] tabular-nums">
                        {soldeValide && solde.trim()
                          ? formatCurrency(soldeNum)
                          : "non renseigné"}
                      </strong>
                    </span>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={!canOpen || pending}
                      className="w-full h-11 gap-2 rounded-xl bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
                    >
                      {pending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Ouvrir la caisse
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer l&apos;ouverture ?</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            Le poste{" "}
                            <strong className="text-foreground">
                              {selectedPoste?.nom ?? "—"}
                            </strong>{" "}
                            sera ouvert avec un solde de{" "}
                            <strong className="text-foreground tabular-nums">
                              {soldeValide ? formatCurrency(soldeNum) : "—"}
                            </strong>
                            .
                          </p>
                          <p>Vous pourrez ensuite encaisser et effectuer des versements.</p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-lg">Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void handleOpen()}
                        className="rounded-lg bg-[#cd3b86] hover:bg-[#b8307a]"
                      >
                        Confirmer l&apos;ouverture
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

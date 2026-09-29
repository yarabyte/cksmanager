"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  User,
  Stethoscope,
  Calendar,
  Clock,
  BedDouble,
  Lock,
  Printer,
  Receipt,
  FileMinus2,
  FileDown,
  Ban,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatBirthAge } from "@/lib/formatting"
import { CategorieIcon, formatCategorieLabel } from "@/components/shared/categorie-icon"
import { confirmFeuille, deleteFeuille } from "@/app/actions/feuilles-circulation"
import {
  annulerAvoirFeuille,
  createAvoirFeuille,
  downloadAvoirFeuillePdf,
} from "@/app/actions/avoirs-feuilles"
import type { FeuilleDetail } from "@/lib/types/feuille-circulation"

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "CONFIRMEE") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1">
        <Lock className="h-3 w-3" /> Confirmée
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Brouillon</Badge>
  )
}

function PaiementBadge({
  statut,
  viaAvoir,
}: {
  statut: string
  viaAvoir?: boolean
}) {
  if (statut === "PAYEE") {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        {viaAvoir ? "Réglée par avoir" : "Payée"}
      </Badge>
    )
  }
  return (
    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Impayée</Badge>
  )
}

export function FeuilleDetailClient({
  feuille,
  canManageAvoir = false,
}: {
  feuille: FeuilleDetail
  canManageAvoir?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState<
    "confirm" | "delete" | "avoir" | "annuler" | "pdf" | null
  >(null)
  const [avoirOpen, setAvoirOpen] = React.useState(false)
  const [annulerAvoirOpen, setAnnulerAvoirOpen] = React.useState(false)
  const [motif, setMotif] = React.useState("")
  const isBrouillon = feuille.statut === "BROUILLON"
  const hasAvoirActif = feuille.avoir?.statut === "ACTIF"
  const canCreateAvoir =
    canManageAvoir &&
    feuille.statut === "CONFIRMEE" &&
    feuille.statutPaiement === "IMPAYEE" &&
    feuille.totaux.totalPatient > 0 &&
    !hasAvoirActif

  async function handleConfirm() {
    setPending("confirm")
    const res = await confirmFeuille(feuille.id)
    setPending(null)
    if (res.ok) {
      toast.success("Feuille de circulation confirmée.")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function handleDelete() {
    setPending("delete")
    const res = await deleteFeuille(feuille.id)
    if (res.ok) {
      toast.success("Feuille de circulation supprimée.")
      router.push("/feuilles-circulation")
      router.refresh()
    } else {
      setPending(null)
      toast.error(res.error)
    }
  }

  async function handleCreateAvoir() {
    const trimmed = motif.trim()
    if (trimmed.length < 3) {
      toast.error("Le motif est obligatoire (3 caractères minimum).")
      return
    }
    setPending("avoir")
    const res = await createAvoirFeuille({ feuilleId: feuille.id, motif: trimmed })
    setPending(null)
    if (res.ok) {
      setAvoirOpen(false)
      setMotif("")
      toast.success("Avoir créé — feuille réglée.")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function handleAnnulerAvoir() {
    if (!feuille.avoir) return
    setPending("annuler")
    const res = await annulerAvoirFeuille({ id: feuille.avoir.id })
    setPending(null)
    if (res.ok) {
      setAnnulerAvoirOpen(false)
      toast.success("Avoir annulé — feuille de nouveau impayée.")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function handleDownloadPdf() {
    if (!feuille.avoir) return
    setPending("pdf")
    try {
      const res = await downloadAvoirFeuillePdf(feuille.avoir.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const binary = atob(res.base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setPending(null)
    }
  }

  const dateVisite = new Date(feuille.visite.dateVisite)
  const dateCreation = feuille.createdAt ? new Date(feuille.createdAt) : null

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push("/feuilles-circulation")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/feuilles-circulation/${feuille.id}/imprimer`}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Link>
          </Button>
          {canCreateAvoir && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setAvoirOpen(true)}
            >
              <FileMinus2 className="h-4 w-4" />
              Créer un avoir
            </Button>
          )}
          {hasAvoirActif && feuille.avoir && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={pending === "pdf" || pending === "annuler"}
                  >
                    {pending === "pdf" || pending === "annuler" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileMinus2 className="h-4 w-4" />
                    )}
                    Avoir
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link href={`/feuilles-circulation/${feuille.id}/avoir/imprimer`}>
                      <Printer className="h-4 w-4" />
                      Imprimer l&apos;avoir
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={pending === "pdf"}
                    onSelect={() => void handleDownloadPdf()}
                  >
                    <FileDown className="h-4 w-4" />
                    PDF avoir
                  </DropdownMenuItem>
                  {canManageAvoir && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-amber-700 focus:text-amber-800"
                        disabled={pending === "annuler"}
                        onSelect={() => setAnnulerAvoirOpen(true)}
                      >
                        <Ban className="h-4 w-4" />
                        Annuler l&apos;avoir
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialog open={annulerAvoirOpen} onOpenChange={setAnnulerAvoirOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler l&apos;avoir {feuille.avoir.numero} ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      La feuille redeviendra impayée et réapparaîtra dans la file d&apos;attente
                      caisse. Cette action est réservée aux administrateurs et managers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Retour</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleAnnulerAvoir}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Confirmer l&apos;annulation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {isBrouillon && (
            <>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/feuilles-circulation/${feuille.id}/modifier`}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer la feuille de circulation ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. La feuille de circulation {feuille.numero} et ses
                      lignes seront supprimées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={pending === "confirm"}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {pending === "confirm" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Confirmer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la feuille de circulation ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Une fois confirmée, la feuille de circulation {feuille.numero} sera verrouillée et ne
                      pourra plus être modifiée ni supprimée. Vérifiez les lignes avant de valider.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirm}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Feuille de circulation
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 font-sans">{feuille.numero}</h1>
              <StatutBadge statut={feuille.statut} />
              {feuille.statut === "CONFIRMEE" && (
                <PaiementBadge statut={feuille.statutPaiement} viaAvoir={hasAvoirActif} />
              )}
            </div>
            {feuille.statut === "CONFIRMEE" &&
              feuille.statutPaiement === "IMPAYEE" &&
              !hasAvoirActif && (
                <Button asChild size="sm" variant="outline" className="mt-2 gap-1.5">
                  <Link href="/caisse">
                    <Receipt className="h-4 w-4" />
                    Encaisser à la caisse
                  </Link>
                </Button>
              )}
            {hasAvoirActif && feuille.avoir && (
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
                <p className="font-medium">
                  Avoir {feuille.avoir.numero} — {formatCurrency(feuille.avoir.montant)}
                </p>
                <p className="mt-1 text-xs text-blue-800/80">{feuille.avoir.motif}</p>
                {feuille.avoir.userName && (
                  <p className="mt-1 text-[11px] text-blue-700/70">
                    Créé par {feuille.avoir.userName}
                    {feuille.avoir.createdAt
                      ? ` · ${format(new Date(feuille.avoir.createdAt), "d MMM yyyy HH:mm", { locale: fr })}`
                      : ""}
                  </p>
                )}
              </div>
            )}
            {feuille.libelle && (
              <p className="mt-1 text-sm text-muted-foreground">{feuille.libelle}</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="flex flex-col leading-tight">
              {feuille.visite.patientDob && (
                <span className="text-[11px] text-gray-400">
                  {formatBirthAge(feuille.visite.patientDob)}
                </span>
              )}
              <span className="font-medium text-gray-700">
                {feuille.visite.patientLabel ?? `Patient #${feuille.visite.patientId}`}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Stethoscope className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{feuille.visite.medecinNom ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] text-gray-400">Date et heure de la visite</span>
              <span className="font-medium text-gray-700">
                {format(dateVisite, "d MMMM yyyy", { locale: fr })} à{" "}
                {format(dateVisite, "HH:mm")}
              </span>
            </span>
          </div>
          {feuille.hospitalisation?.statut === "EN_COURS" && (
            <div className="flex items-center gap-2 text-sm">
              <BedDouble className="h-4 w-4 shrink-0 text-sky-500" />
              <span className="flex flex-col leading-tight">
                <span className="text-[11px] text-sky-600">Hospitalisation — entrée</span>
                <Link
                  href={`/hospitalisation/${feuille.hospitalisation.id}`}
                  className="font-medium text-sky-800 hover:underline"
                >
                  {format(
                    new Date(feuille.hospitalisation.dateEntree),
                    "d MMMM yyyy",
                    { locale: fr },
                  )}
                </Link>
              </span>
            </div>
          )}
          {dateCreation && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="flex flex-col leading-tight">
                <span className="text-[11px] text-gray-400">Date de création</span>
                <span className="font-medium text-gray-700">
                  {format(dateCreation, "d MMMM yyyy", { locale: fr })} à{" "}
                  {format(dateCreation, "HH:mm")}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Détail des lignes ({feuille.lignes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">PU / Valeur</TableHead>
                  <TableHead className="text-center">Taux</TableHead>
                  <TableHead className="text-right">HNC</TableHead>
                  <TableHead className="text-right">Assurance</TableHead>
                  <TableHead className="text-right">Patient</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feuille.lignes.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategorieIcon
                          nom={l.categorieNom}
                          className="h-4 w-4 shrink-0 text-[#cd3b86]"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {l.typeLigne === "PHARMA"
                              ? `${l.produitNom ?? "Produit"}${l.produitDosage ? " " + l.produitDosage : ""}`
                              : l.acteNom ?? "Acte"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCategorieLabel(l.categorieNom)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{l.quantite}</TableCell>
                    <TableCell className="text-right">{formatCurrency(l.valeur)}</TableCell>
                    <TableCell className="text-center">{l.taux}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(l.hnc * l.quantite)}</TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(l.montantAssurance)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(l.montantPatient)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(l.montantTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Part assurance</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(feuille.totaux.totalAssurance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Part patient</p>
            <p className="text-lg font-bold text-[#cd3b86]">
              {formatCurrency(feuille.totaux.totalPatient)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(feuille.totaux.total)}</p>
          </div>
        </div>
      </div>

      <Dialog open={avoirOpen} onOpenChange={setAvoirOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un avoir</DialogTitle>
            <DialogDescription>
              Annulation de la dette patient pour la feuille {feuille.numero}. Aucun mouvement
              portefeuille ni journal de caisse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-400">Montant avoir</p>
              <p className="text-xl font-bold tabular-nums text-[#cd3b86]">
                {formatCurrency(feuille.totaux.totalPatient)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Part patient totale (lecture seule)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avoir-motif">Motif (obligatoire)</Label>
              <Textarea
                id="avoir-motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Indiquez la raison de la création de l’avoir…"
                rows={4}
                maxLength={2000}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvoirOpen(false)} disabled={pending === "avoir"}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleCreateAvoir()}
              disabled={pending === "avoir"}
              className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              {pending === "avoir" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileMinus2 className="h-4 w-4" />
              )}
              Confirmer l&apos;avoir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

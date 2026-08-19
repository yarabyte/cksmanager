"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Loader2,
  Layers,
  Percent,
  Save,
  Building2,
  CalendarDays,
  FileText,
} from "lucide-react"
import { formatDate } from "@/lib/formatting"
import { useAssurancesList } from "@/hooks/use-assurances"
import { useCategoriesList } from "@/hooks/use-actes"
import { useAssurancePatientMutations } from "@/hooks/use-assurance-patient"
import { getAuthUserId } from "@/app/actions/auth"
import {
  canAssignAssurance,
  canEditTauxPromoteur,
  isAssurancePromoteur,
} from "@/lib/assurance/promoteur"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ApRow = {
  id: string
  assuranceId: string
  dateDebut?: string | null
  dateFin?: string | null
  numeroAttestation?: string | null
  tauxCouverture: number
  assurance: { nom: string; promoteurUserId?: string | null }
  couvertures?: CovRow[]
}

type CovRow = {
  id: string
  categorieId: string
  tauxCouverture: number
  categorie: { nom: string }
}

function toInputDate(d: string | null | undefined): string {
  if (!d) return ""
  return d.slice(0, 10)
}

export function PatientAssurancesSection({
  patientId,
  assurancePatients,
}: {
  patientId: string
  assurancePatients: unknown
}) {
  const rows = (Array.isArray(assurancePatients)
    ? assurancePatients
    : []) as ApRow[]

  const { data: currentUserId } = useQuery({
    queryKey: ["auth", "userId"],
    queryFn: getAuthUserId,
  })

  const { data: assurancesRaw } = useAssurancesList()
  const assurances = React.useMemo(() => {
    const list = (assurancesRaw ?? []) as unknown as {
      id: string
      nom: string
      promoteurUserId?: string | null
    }[]
    return list
  }, [assurancesRaw])

  const { data: categoriesRaw } = useCategoriesList()
  const categories = categoriesRaw ?? []

  const {
    createAp,
    updateAp,
    deleteAp,
    createCov,
    updateCov,
    deleteCov,
  } = useAssurancePatientMutations(patientId)

  const [apDialog, setApDialog] = React.useState<null | { mode: "create" } | { mode: "edit"; row: ApRow }>(null)
  const [covDialog, setCovDialog] = React.useState<
    null | { mode: "create"; assurancePatientId: string } | { mode: "edit"; row: CovRow; assurancePatientId: string }
  >(null)
  const [deleteApId, setDeleteApId] = React.useState<string | null>(null)
  const [deleteCovId, setDeleteCovId] = React.useState<string | null>(null)

  const [apForm, setApForm] = React.useState({
    assuranceId: "",
    dateDebut: "",
    dateFin: "",
    numeroAttestation: "",
    tauxCouverture: "80",
  })

  const [covForm, setCovForm] = React.useState({
    categorieId: "",
    tauxCouverture: "100",
  })

  const selectedAssurance = React.useMemo(
    () => assurances.find((a) => String(a.id) === apForm.assuranceId),
    [assurances, apForm.assuranceId],
  )
  const cannotAssignSelected =
    !!currentUserId &&
    isAssurancePromoteur(selectedAssurance) &&
    !canAssignAssurance(currentUserId, selectedAssurance)
  const tauxReadOnly =
    !!currentUserId &&
    isAssurancePromoteur(selectedAssurance) &&
    !canEditTauxPromoteur(currentUserId, selectedAssurance)

  function canEditTauxForAp(ap: ApRow): boolean {
    if (!currentUserId) return false
    return canEditTauxPromoteur(currentUserId, ap.assurance)
  }

  React.useEffect(() => {
    if (!apDialog) return
    if (apDialog.mode === "create") {
      setApForm({
        assuranceId: assurances[0] ? String((assurances[0] as { id: unknown }).id) : "",
        dateDebut: "",
        dateFin: "",
        numeroAttestation: "",
        tauxCouverture: "80",
      })
    } else {
      const r = apDialog.row
      setApForm({
        assuranceId: r.assuranceId,
        dateDebut: toInputDate(r.dateDebut),
        dateFin: toInputDate(r.dateFin),
        numeroAttestation: r.numeroAttestation ?? "",
        tauxCouverture: String(r.tauxCouverture),
      })
    }
  }, [apDialog, assurances])

  React.useEffect(() => {
    if (!covDialog) return
    if (covDialog.mode === "create") {
      setCovForm({
        categorieId: categories[0] ? String((categories[0] as { id: unknown }).id) : "",
        tauxCouverture: "100",
      })
    } else {
      const r = covDialog.row
      setCovForm({
        categorieId: r.categorieId,
        tauxCouverture: String(r.tauxCouverture),
      })
    }
  }, [covDialog, categories])

  async function submitAp() {
    const taux = Number.parseInt(apForm.tauxCouverture, 10)
    if (Number.isNaN(taux) || taux < 0 || taux > 100) {
      toast.error("Taux de couverture invalide (0–100).")
      return
    }
    const payload = {
      patientId,
      assuranceId: apForm.assuranceId,
      dateDebut: apForm.dateDebut ? new Date(apForm.dateDebut) : null,
      dateFin: apForm.dateFin ? new Date(apForm.dateFin) : null,
      numeroAttestation: apForm.numeroAttestation.trim() || null,
      tauxCouverture: taux,
    }
    try {
      if (apDialog?.mode === "create") {
        await createAp.mutateAsync(payload)
        toast.success(
          rows.length > 0
            ? "Assurance patient mise à jour."
            : "Assurance patient ajoutée.",
        )
      } else if (apDialog?.mode === "edit") {
        await updateAp.mutateAsync({
          id: apDialog.row.id,
          ...payload,
        })
        toast.success("Assurance patient mise à jour.")
      }
      setApDialog(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function submitCov() {
    const taux = Number.parseFloat(covForm.tauxCouverture)
    if (Number.isNaN(taux)) {
      toast.error("Taux invalide.")
      return
    }
    if (taux < 0 || taux > 100) {
      toast.error("Le taux doit être compris entre 0 et 100 %.")
      return
    }
    if (!covDialog) return
    try {
      if (covDialog.mode === "create") {
        await createCov.mutateAsync({
          assurancePatientId: covDialog.assurancePatientId,
          categorieId: covForm.categorieId,
          tauxCouverture: taux,
        })
        toast.success("Couverture ajoutée.")
      } else {
        await updateCov.mutateAsync({
          id: covDialog.row.id,
          assurancePatientId: covDialog.assurancePatientId,
          categorieId: covForm.categorieId,
          tauxCouverture: taux,
        })
        toast.success("Couverture mise à jour.")
      }
      setCovDialog(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDeleteAp() {
    if (!deleteApId) return
    try {
      await deleteAp.mutateAsync(deleteApId)
      toast.success("Lien assurance supprimé.")
      setDeleteApId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDeleteCov() {
    if (!deleteCovId) return
    try {
      await deleteCov.mutateAsync(deleteCovId)
      toast.success("Couverture supprimée.")
      setDeleteCovId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  const busy =
    createAp.isPending ||
    updateAp.isPending ||
    deleteAp.isPending ||
    createCov.isPending ||
    updateCov.isPending ||
    deleteCov.isPending

  /** Un seul lien assurance–patient autorisé (règle métier). */
  const hasAssurance = rows.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Assurances du patient</h3>
        </div>
        {!hasAssurance ? (
          <Button
            size="sm"
            className="gap-1"
            onClick={() => setApDialog({ mode: "create" })}
            disabled={assurances.length === 0}
          >
            <Plus className="h-4 w-4" />
            Ajouter une assurance
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune assurance liée. Utilisez « Ajouter une assurance » ci-dessus.
        </p>
      ) : (
        rows.map((ap) => (
          <Card key={ap.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">{ap.assurance.nom}</CardTitle>
                  {isAssurancePromoteur(ap.assurance) ? (
                    <p className="text-xs font-medium text-amber-700 mt-0.5">
                      Assurance promoteur
                      {!canEditTauxForAp(ap)
                        ? " — taux en lecture seule (réservée au propriétaire)"
                        : null}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    Taux global : {ap.tauxCouverture}% —{" "}
                    {ap.dateDebut || ap.dateFin ? (
                      <>
                        {ap.dateDebut ? `du ${formatDate(String(ap.dateDebut))}` : ""}{" "}
                        {ap.dateFin ? `au ${formatDate(String(ap.dateFin))}` : ""}
                      </>
                    ) : (
                      "Période non renseignée"
                    )}
                  </p>
                  {ap.numeroAttestation ? (
                    <p className="text-xs text-muted-foreground">
                      N° attestation : {ap.numeroAttestation}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setApDialog({ mode: "edit", row: ap })}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteApId(ap.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Couvertures par catégorie d’actes</p>
                {canEditTauxForAp(ap) ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setCovDialog({ mode: "create", assurancePatientId: ap.id })
                    }
                    disabled={categories.length === 0}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Couverture
                  </Button>
                ) : null}
              </div>
              {(ap.couvertures?.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune ligne de couverture.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Taux (%)</TableHead>
                      {canEditTauxForAp(ap) ? <TableHead className="w-[100px]" /> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(ap.couvertures ?? []).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.categorie.nom}</TableCell>
                        <TableCell className="text-right">{c.tauxCouverture}</TableCell>
                        {canEditTauxForAp(ap) ? (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setCovDialog({
                                  mode: "edit",
                                  row: c,
                                  assurancePatientId: ap.id,
                                })
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteCovId(c.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!apDialog} onOpenChange={(o) => !o && setApDialog(null)}>
        <DialogContent
          showCloseButton
          className={cn(
            "gap-0 overflow-hidden rounded-xl border-border/80 p-0 shadow-[0_2px_12px_rgba(0,0,0,0.07)]",
            "sm:max-w-lg",
          )}
        >
          <div className="border-b border-border/60 bg-gradient-to-br from-[#cd3b86]/10 via-background to-background px-6 pb-4 pt-6">
            <div className="flex gap-4 pr-8">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/12 shadow-sm"
                aria-hidden
              >
                <Shield className="h-6 w-6 text-[#cd3b86]" />
              </div>
              <DialogHeader className="flex-1 space-y-2 text-left">
                <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                  {apDialog?.mode === "edit"
                    ? "Modifier l’assurance patient"
                    : "Ajouter une assurance"}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  {apDialog?.mode === "edit"
                    ? "Mettez à jour l’organisme, les dates de validité et le taux de couverture globale."
                    : "Liez un assureur au dossier : période de validité, numéro d’attestation et taux appliqué par défaut."}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f5] dark:bg-muted">
                  <Building2 className="h-4 w-4 text-[#cd3b86]" aria-hidden />
                </span>
                <Label htmlFor="ap-assureur" className="text-sm font-medium">
                  Assureur
                </Label>
              </div>
              <Select
                value={apForm.assuranceId}
                onValueChange={(v) => setApForm((f) => ({ ...f, assuranceId: v }))}
              >
                <SelectTrigger
                  id="ap-assureur"
                  className="h-10 w-full rounded-lg border-border/80 transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-[#cd3b86]/20"
                >
                  <SelectValue placeholder="Choisir un assureur" />
                </SelectTrigger>
                <SelectContent>
                  {assurances.map((a) => {
                    const id = String(a.id)
                    const nom = String(a.nom)
                    return (
                      <SelectItem key={id} value={id}>
                        {nom}
                        {isAssurancePromoteur(a) ? " (promoteur)" : ""}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {cannotAssignSelected ? (
                <p className="text-xs text-amber-700 pl-[2.75rem]">
                  Seul le promoteur propriétaire peut affecter cette assurance. Choisissez une
                  assurance classique ou demandez au propriétaire.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f5] dark:bg-muted">
                    <CalendarDays className="h-4 w-4 text-[#cd3b86]" aria-hidden />
                  </span>
                  <Label htmlFor="ap-date-debut" className="text-sm font-medium">
                    Date début
                  </Label>
                </div>
                <DatePickerFr
                  id="ap-date-debut"
                  dateValue={apForm.dateDebut}
                  onDateChange={(d) => setApForm((f) => ({ ...f, dateDebut: d }))}
                  placeholder="Date de début"
                  clearable
                  className="h-10 rounded-lg transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-[#cd3b86]/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f5] dark:bg-muted">
                    <CalendarDays className="h-4 w-4 text-[#cd3b86]" aria-hidden />
                  </span>
                  <Label htmlFor="ap-date-fin" className="text-sm font-medium">
                    Date fin
                  </Label>
                </div>
                <DatePickerFr
                  id="ap-date-fin"
                  dateValue={apForm.dateFin}
                  onDateChange={(d) => setApForm((f) => ({ ...f, dateFin: d }))}
                  placeholder="Date de fin"
                  clearable
                  min={apForm.dateDebut || undefined}
                  className="h-10 rounded-lg transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-[#cd3b86]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f5] dark:bg-muted">
                  <FileText className="h-4 w-4 text-[#cd3b86]" aria-hidden />
                </span>
                <Label htmlFor="ap-attestation" className="text-sm font-medium">
                  N° attestation
                </Label>
              </div>
              <Input
                id="ap-attestation"
                placeholder="Numéro de carte ou d’attestation"
                className="h-10 rounded-lg transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-[#cd3b86]/20"
                value={apForm.numeroAttestation}
                onChange={(e) =>
                  setApForm((f) => ({ ...f, numeroAttestation: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f5] dark:bg-muted">
                  <Percent className="h-4 w-4 text-[#cd3b86]" aria-hidden />
                </span>
                <Label htmlFor="ap-taux" className="text-sm font-medium">
                  Taux de couverture globale
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="ap-taux"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="80"
                  disabled={tauxReadOnly}
                  className="h-10 rounded-lg pr-10 tabular-nums transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-[#cd3b86]/20"
                  value={apForm.tauxCouverture}
                  onChange={(e) =>
                    setApForm((f) => ({ ...f, tauxCouverture: e.target.value }))
                  }
                />
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
                  aria-hidden
                >
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground pl-[2.75rem]">
                {tauxReadOnly
                  ? "Seul le promoteur propriétaire peut modifier le taux de cette assurance. Vous pouvez la remplacer par une assurance classique ou la retirer."
                  : "Taux par défaut pour cette assurance (0 à 100). Les couvertures par catégorie peuvent l'affiner."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border/60 bg-muted/15 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg transition-all duration-200 ease-in-out"
              onClick={() => setApDialog(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="gap-2 rounded-lg bg-[#cd3b86] hover:bg-[#b8307a] transition-all duration-200 ease-in-out"
              onClick={() => void submitAp()}
              disabled={busy || !apForm.assuranceId || cannotAssignSelected}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!covDialog} onOpenChange={(o) => !o && setCovDialog(null)}>
        <DialogContent
          showCloseButton
          className={cn(
            "gap-0 overflow-hidden rounded-xl border-border/80 p-0 shadow-[0_2px_12px_rgba(0,0,0,0.07)]",
            "sm:max-w-md",
          )}
        >
          <div className="border-b border-border/60 bg-gradient-to-br from-[#cd3b86]/10 via-background to-background px-6 pb-4 pt-6">
            <div className="flex gap-4 pr-8">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/12 shadow-sm"
                aria-hidden
              >
                <Layers className="h-6 w-6 text-[#cd3b86]" />
              </div>
              <DialogHeader className="flex-1 space-y-2 text-left">
                <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                  {covDialog?.mode === "edit"
                    ? "Modifier la couverture"
                    : "Nouvelle couverture personnalisée"}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  {covDialog?.mode === "edit"
                    ? "Ajustez la catégorie d’actes ou le taux de prise en charge pour ce patient."
                    : "Définissez un taux spécifique par catégorie d’actes (au-delà du taux global de l’assurance)."}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f5] dark:bg-muted">
                  <Layers className="h-4 w-4 text-[#cd3b86]" aria-hidden />
                </span>
                <Label htmlFor="cov-categorie" className="text-sm font-medium">
                  Catégorie d’actes
                </Label>
              </div>
              <Select
                value={covForm.categorieId}
                onValueChange={(v) => setCovForm((f) => ({ ...f, categorieId: v }))}
              >
                <SelectTrigger
                  id="cov-categorie"
                  className="h-10 w-full rounded-lg border-border/80 transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-[#cd3b86]/20"
                >
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => {
                    const id = String((c as { id: unknown }).id)
                    const nom = String((c as { nom: string }).nom)
                    return (
                      <SelectItem key={id} value={id}>
                        {nom}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f3f5] dark:bg-muted">
                  <Percent className="h-4 w-4 text-[#cd3b86]" aria-hidden />
                </span>
                <Label htmlFor="cov-taux" className="text-sm font-medium">
                  Taux de prise en charge
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="cov-taux"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  placeholder="Ex. 100"
                  className="h-10 rounded-lg pr-10 tabular-nums transition-all duration-200 focus-visible:border-[#cd3b86]/50 focus-visible:ring-[#cd3b86]/20"
                  value={covForm.tauxCouverture}
                  onChange={(e) =>
                    setCovForm((f) => ({ ...f, tauxCouverture: e.target.value }))
                  }
                />
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
                  aria-hidden
                >
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground pl-[2.75rem]">
                Pourcentage appliqué aux actes de cette catégorie (0 à 100).
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border/60 bg-muted/15 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg transition-all duration-200 ease-in-out"
              onClick={() => setCovDialog(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="gap-2 rounded-lg bg-[#cd3b86] hover:bg-[#b8307a] transition-all duration-200 ease-in-out"
              onClick={() => void submitCov()}
              disabled={busy || !covForm.categorieId}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteApId} onOpenChange={() => setDeleteApId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette assurance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les couvertures par catégorie seront également supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteAp()}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCovId} onOpenChange={() => setDeleteCovId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette couverture ?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeleteCov()}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

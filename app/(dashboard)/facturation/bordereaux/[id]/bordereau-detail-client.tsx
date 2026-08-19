"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Send,
  Trash2,
  Undo2,
  Wallet,
} from "lucide-react"
import {
  annulerDepot,
  deleteBordereau,
  deposerBordereau,
  listFacturesEligibles,
  payerBordereau,
  updateBordereauFactures,
} from "@/app/actions/bordereaux"
import { BordereauStatusBadge } from "@/components/shared/bordereau-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate, formatFactureNumero } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { BordereauDetail, FactureEligibleBordereau } from "@/lib/types/bordereau"
import type { BordereauDocxParametres } from "@/lib/bordereau/build-bordereau-docx"

export function BordereauDetailClient({
  bordereau,
  parametres,
}: {
  bordereau: BordereauDetail
  parametres?: BordereauDocxParametres
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState<string | null>(null)

  const [depotOpen, setDepotOpen] = React.useState(false)
  const [dateDepot, setDateDepot] = React.useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [noteDepot, setNoteDepot] = React.useState("")

  const [payOpen, setPayOpen] = React.useState(false)
  const [datePaiement, setDatePaiement] = React.useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [refVirement, setRefVirement] = React.useState("")

  const [editOpen, setEditOpen] = React.useState(false)
  const [eligibles, setEligibles] = React.useState<FactureEligibleBordereau[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [loadingEligibles, setLoadingEligibles] = React.useState(false)

  async function openEdit() {
    setEditOpen(true)
    setLoadingEligibles(true)
    try {
      const rows = await listFacturesEligibles(bordereau.assuranceId, {
        includeBordereauId: bordereau.id,
      })
      setEligibles(rows)
      setSelected(new Set(bordereau.factures.map((f) => f.factureId)))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de chargement")
    } finally {
      setLoadingEligibles(false)
    }
  }

  async function handleSaveFactures() {
    if (selected.size === 0) {
      toast.error("Sélectionnez au moins une facture.")
      return
    }
    setPending("edit")
    try {
      const res = await updateBordereauFactures({
        id: bordereau.id,
        factureIds: [...selected],
      })
      if (res.ok) {
        toast.success("Factures mises à jour")
        setEditOpen(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(null)
    }
  }

  async function handleDepot() {
    if (!dateDepot) {
      toast.error("Date de dépôt obligatoire.")
      return
    }
    setPending("depot")
    try {
      const res = await deposerBordereau({
        id: bordereau.id,
        dateDepot,
        noteDepot: noteDepot.trim() || null,
      })
      if (res.ok) {
        toast.success("Bordereau déposé")
        setDepotOpen(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(null)
    }
  }

  async function handleAnnulerDepot() {
    setPending("annuler")
    try {
      const res = await annulerDepot(bordereau.id)
      if (res.ok) {
        toast.success("Dépôt annulé")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(null)
    }
  }

  async function handlePayer() {
    if (!datePaiement || !refVirement.trim()) {
      toast.error("Date et référence virement obligatoires.")
      return
    }
    setPending("payer")
    try {
      const res = await payerBordereau({
        id: bordereau.id,
        datePaiement,
        refVirement: refVirement.trim(),
      })
      if (res.ok) {
        toast.success("Paiement assureur enregistré")
        setPayOpen(false)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(null)
    }
  }

  async function handleDelete() {
    setPending("delete")
    try {
      const res = await deleteBordereau(bordereau.id)
      if (res.ok) {
        toast.success("Bordereau supprimé")
        router.push("/facturation/bordereaux")
      } else {
        toast.error(res.error)
        setPending(null)
      }
    } catch {
      setPending(null)
    }
  }

  async function handleDownloadWord() {
    setPending("word")
    try {
      const { downloadBordereauDocx } = await import(
        "@/lib/bordereau/build-bordereau-docx"
      )
      await downloadBordereauDocx(bordereau, parametres ?? null)
      toast.success("Word téléchargé")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Échec du téléchargement Word",
      )
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/facturation/bordereaux"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux bordereaux
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg">
            <Link href={`/facturation/bordereaux/${bordereau.id}/imprimer`}>
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg"
            onClick={() => void handleDownloadWord()}
            disabled={pending !== null}
          >
            {pending === "word" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {pending === "word" ? "Génération…" : "Télécharger Word"}
          </Button>

          {bordereau.statut === "BROUILLON" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => void openEdit()}
              >
                Modifier factures
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-lg text-red-600 hover:text-red-700"
                    disabled={pending !== null}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Le bordereau {bordereau.numero} sera supprimé. Les factures pourront être
                      regroupées dans un nouveau bordereau.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleDelete()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="sm"
                className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white"
                onClick={() => setDepotOpen(true)}
                disabled={pending !== null || bordereau.factures.length === 0}
              >
                <Send className="h-4 w-4" />
                Déposer
              </Button>
            </>
          )}

          {bordereau.statut === "DEPOSE" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-lg"
                    disabled={pending !== null}
                  >
                    <Undo2 className="h-4 w-4" />
                    Annuler le dépôt
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler le dépôt ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Le bordereau repassera en brouillon et pourra être modifié.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Non</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void handleAnnulerDepot()}>
                      Oui, annuler
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="sm"
                className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white"
                onClick={() => setPayOpen(true)}
                disabled={pending !== null}
              >
                <Wallet className="h-4 w-4" />
                Marquer payé
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Bordereau assureur
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {bordereau.numero}
            </h1>
            <BordereauStatusBadge status={bordereau.statut} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-[11px] text-gray-400">Assureur</p>
              <p className="font-semibold text-gray-800">{bordereau.assuranceNom}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Montant total</p>
              <p className="font-semibold text-emerald-700 tabular-nums">
                {formatCurrency(bordereau.montantTotal)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Dépôt</p>
              <p className="font-semibold text-gray-800">
                {bordereau.dateDepot ? formatDate(bordereau.dateDepot) : "—"}
              </p>
              {bordereau.noteDepot && (
                <p className="text-xs text-gray-500 mt-0.5">{bordereau.noteDepot}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Paiement</p>
              <p className="font-semibold text-gray-800">
                {bordereau.datePaiement ? formatDate(bordereau.datePaiement) : "—"}
              </p>
              {bordereau.refVirement && (
                <p className="text-xs text-gray-500 mt-0.5">Réf. {bordereau.refVirement}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Factures ({bordereau.factures.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="pl-4">N° facture</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Visite</TableHead>
                  <TableHead className="text-right pr-4">Part assurance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bordereau.factures.map((f, i) => (
                  <TableRow
                    key={f.factureId}
                    className={cn(i % 2 !== 0 && "bg-gray-50/30")}
                  >
                    <TableCell className="pl-4">
                      <Link
                        href={`/facturation/${f.factureId}`}
                        className="font-medium text-[#cd3b86] hover:underline"
                      >
                        {formatFactureNumero(f.factureNumero)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {f.patientLabel ?? `Patient #${f.patientId}`}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {f.dateVisite ? formatDate(f.dateVisite) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums pr-4">
                      {formatCurrency(f.montantAssurance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Total à recouvrer</p>
        <p className="text-lg font-bold text-emerald-600">
          {formatCurrency(bordereau.montantTotal)}
        </p>
      </div>

      {/* Dialog dépôt */}
      <Dialog open={depotOpen} onOpenChange={setDepotOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Déposer le bordereau</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Date de dépôt</Label>
              <DatePickerFr dateValue={dateDepot} onDateChange={setDateDepot} />
            </div>
            <div className="space-y-2">
              <Label>Note (optionnel)</Label>
              <Textarea
                value={noteDepot}
                onChange={(e) => setNoteDepot(e.target.value)}
                rows={3}
                placeholder="Commentaire sur le dépôt…"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepotOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleDepot()}
              disabled={pending === "depot"}
              className="bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              {pending === "depot" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirmer le dépôt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog paiement */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer le paiement assureur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">
              Montant :{" "}
              <strong className="text-emerald-700">
                {formatCurrency(bordereau.montantTotal)}
              </strong>{" "}
              (virement intégral)
            </p>
            <div className="space-y-2">
              <Label>Date du virement</Label>
              <DatePickerFr dateValue={datePaiement} onDateChange={setDatePaiement} />
            </div>
            <div className="space-y-2">
              <Label>Référence virement</Label>
              <Input
                value={refVirement}
                onChange={(e) => setRefVirement(e.target.value)}
                placeholder="Ex. VIR-2026-0042"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void handlePayer()}
              disabled={pending === "payer"}
              className="bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              {pending === "payer" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog modifier factures */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les factures</DialogTitle>
          </DialogHeader>
          {loadingEligibles ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Facture</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eligibles.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(f.id)}
                          onCheckedChange={() => {
                            setSelected((prev) => {
                              const next = new Set(prev)
                              if (next.has(f.id)) next.delete(f.id)
                              else next.add(f.id)
                              return next
                            })
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {formatFactureNumero(f.numero)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {f.patientLabel ?? `#${f.patientId}`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatCurrency(f.montantAssurance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleSaveFactures()}
              disabled={pending === "edit" || loadingEligibles}
              className="bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              {pending === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  BedDouble,
  Calendar,
  Loader2,
  LogOut,
  Receipt,
  ScrollText,
  Stethoscope,
  User,
} from "lucide-react"
import { sortirHospitalisation } from "@/app/actions/hospitalisation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Label } from "@/components/ui/label"
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
import type { HospitalisationDetail } from "@/lib/types/hospitalisation"

export function HospitalisationDetailClient({
  hospitalisation: h,
}: {
  hospitalisation: HospitalisationDetail
}) {
  const router = useRouter()
  const enCours = h.statut === "EN_COURS"
  const eligibles = React.useMemo(
    () => h.feuilles.filter((f) => f.eligibleFacture),
    [h.feuilles],
  )
  const totaux = React.useMemo(() => {
    let patient = 0
    let assurance = 0
    let patientPaye = 0
    let patientRestant = 0
    for (const f of h.feuilles) {
      patient += f.montantPatient
      assurance += f.montantAssurance
      if (f.statutPaiement === "PAYEE") patientPaye += f.montantPatient
      else patientRestant += f.montantPatient
    }
    return { patient, assurance, patientPaye, patientRestant }
  }, [h.feuilles])

  const [sortieOpen, setSortieOpen] = React.useState(false)
  const [dateSortie, setDateSortie] = React.useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (!sortieOpen) return
    setSelected(new Set(eligibles.map((f) => f.id)))
    setDateSortie(new Date().toISOString().slice(0, 10))
  }, [sortieOpen, eligibles])

  const montantSelection = eligibles
    .filter((f) => selected.has(f.id))
    .reduce(
      (acc, f) => ({
        patient: acc.patient + (f.statutPaiement === "PAYEE" ? 0 : f.montantPatient),
        assurance: acc.assurance + f.montantAssurance,
      }),
      { patient: 0, assurance: 0 },
    )

  function toggleFeuille(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(eligibles.map((f) => f.id)) : new Set())
  }

  async function handleSortie() {
    if (!dateSortie) {
      toast.error("Date de sortie obligatoire.")
      return
    }
    setPending(true)
    try {
      const res = await sortirHospitalisation({
        id: h.id,
        dateSortie,
        feuilleIds: [...selected],
      })
      if (!res.ok) {
        toast.error(res.error)
        setPending(false)
        return
      }
      toast.success(
        res.factureId
          ? "Sortie enregistrée — facture créée"
          : "Sortie enregistrée",
      )
      setSortieOpen(false)
      if (res.factureId) {
        router.push(`/facturation/${res.factureId}`)
      } else {
        router.refresh()
      }
    } catch {
      toast.error("Erreur à la sortie")
      setPending(false)
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/hospitalisation"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux hospitalisations
        </Link>
        {enCours ? (
          <Button
            onClick={() => setSortieOpen(true)}
            className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white"
          >
            <LogOut className="h-4 w-4" />
            Enregistrer la sortie
          </Button>
        ) : null}
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Hospitalisation
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {h.patientLabel ?? `Patient #${h.patientId}`}
            </h1>
            {enCours ? (
              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">En cours</Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Sorti</Badge>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400">Patient</p>
                <Link
                  href={`/patients/${h.patientId}`}
                  className="font-semibold text-gray-800 hover:text-[#cd3b86] hover:underline"
                >
                  {h.patientLabel ?? `#${h.patientId}`}
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Stethoscope className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400">Visite</p>
                <Link
                  href={`/visites/${h.visiteId}`}
                  className="font-semibold text-gray-800 hover:text-[#cd3b86] hover:underline"
                >
                  {h.dateVisite ? formatDate(h.dateVisite) : "—"}
                </Link>
                {h.medecinNom ? (
                  <p className="text-[11px] text-gray-400 mt-0.5">{h.medecinNom}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400">Entrée</p>
                <p className="font-semibold text-gray-800">{formatDate(h.dateEntree)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <BedDouble className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-400">Sortie</p>
                <p className="font-semibold text-gray-800">
                  {h.dateSortie ? formatDate(h.dateSortie) : "—"}
                </p>
              </div>
            </div>
          </div>
          {h.commentaires ? (
            <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
              {h.commentaires}
            </p>
          ) : null}
          {enCours ? (
            <p className="mt-3 text-xs text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
              Pendant le séjour, le paiement d&apos;une feuille en caisse émet le reçu sans créer
              de facture. À la sortie, regroupez les feuilles en une facture unique.
            </p>
          ) : null}
          {h.factureId && h.factureNumero ? (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Receipt className="h-4 w-4 text-[#cd3b86]" />
              <span className="text-gray-500">Facture de sortie :</span>
              <Link
                href={`/facturation/${h.factureId}`}
                className="font-semibold text-[#cd3b86] hover:underline"
              >
                {formatFactureNumero(h.factureNumero)}
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-[#cd3b86]" />
            Feuilles de circulation ({h.feuilles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="pl-4">N°</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Part patient</TableHead>
                  <TableHead className="text-right">Montant patient</TableHead>
                  <TableHead className="text-right pr-4">Part assurance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {h.feuilles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-gray-400">
                      Aucune feuille sur cette visite.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {h.feuilles.map((f, i) => {
                      const patientPayee = f.statutPaiement === "PAYEE"
                      return (
                        <TableRow
                          key={f.id}
                          className={cn(i % 2 !== 0 && "bg-gray-50/30")}
                        >
                          <TableCell className="pl-4">
                            <Link
                              href={`/feuilles-circulation/${f.id}`}
                              className="font-medium text-[#cd3b86] hover:underline text-sm"
                            >
                              {f.numero}
                            </Link>
                            {f.dejaFacturee ? (
                              <span className="ml-2 text-[10px] text-emerald-700">facturée</span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {f.libelle ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{f.statut}</TableCell>
                          <TableCell className="text-sm">
                            {patientPayee ? (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-medium">
                                Part patient payée
                              </Badge>
                            ) : f.montantPatient > 0 ? (
                              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-medium">
                                Part patient due
                              </Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            <span
                              className={cn(
                                "font-medium",
                                patientPayee ? "text-emerald-700" : "text-gray-800",
                              )}
                            >
                              {formatCurrency(f.montantPatient)}
                            </span>
                            {f.montantPatient > 0 ? (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {patientPayee ? "déjà encaissée" : "à encaisser"}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm pr-4">
                            {formatCurrency(f.montantAssurance)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow className="bg-gray-50/90 border-t-2 border-gray-200 hover:bg-gray-50/90">
                      <TableCell colSpan={4} className="pl-4 py-3">
                        <p className="text-sm font-semibold text-gray-800">Totaux part patient</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Payé{" "}
                          <span className="font-semibold text-emerald-700">
                            {formatCurrency(totaux.patientPaye)}
                          </span>
                          {" · "}
                          Reste à payer{" "}
                          <span className="font-semibold text-orange-700">
                            {formatCurrency(totaux.patientRestant)}
                          </span>
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums py-3">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(totaux.patient)}
                        </p>
                        <p className="text-[10px] text-gray-400">total part patient</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-bold text-gray-800 pr-4 py-3">
                        <p>{formatCurrency(totaux.assurance)}</p>
                        <p className="text-[10px] font-normal text-gray-400">part assurance</p>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={sortieOpen} onOpenChange={setSortieOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enregistrer la sortie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Date de sortie</Label>
              <DatePickerFr dateValue={dateSortie} onDateChange={setDateSortie} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Feuilles à regrouper en facture</Label>
                {eligibles.length > 0 ? (
                  <button
                    type="button"
                    className="text-xs text-[#cd3b86] hover:underline"
                    onClick={() =>
                      toggleAll(selected.size !== eligibles.length)
                    }
                  >
                    {selected.size === eligibles.length
                      ? "Tout désélectionner"
                      : "Tout sélectionner"}
                  </button>
                ) : null}
              </div>
              {eligibles.length === 0 ? (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                  Aucune feuille confirmée non facturée. La sortie peut être enregistrée
                  sans facture.
                </p>
              ) : (
                <div className="rounded-xl border border-gray-100 divide-y max-h-56 overflow-y-auto">
                  {eligibles.map((f) => (
                    <label
                      key={f.id}
                      className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selected.has(f.id)}
                        onCheckedChange={(v) => toggleFeuille(f.id, v === true)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800">{f.numero}</p>
                        <p className="text-[11px] text-gray-500">
                          {f.statutPaiement === "PAYEE" ? "Patient déjà payé · " : ""}
                          Patient {formatCurrency(f.montantPatient)} · Assurance{" "}
                          {formatCurrency(f.montantAssurance)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selected.size > 0 ? (
                <p className="text-xs text-gray-600">
                  Facture : patient{" "}
                  <strong className="text-emerald-700">
                    {formatCurrency(montantSelection.patient)}
                  </strong>
                  {" · "}
                  assurance{" "}
                  <strong className="text-emerald-700">
                    {formatCurrency(montantSelection.assurance)}
                  </strong>
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSortieOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleSortie()}
              disabled={pending}
              className="bg-[#cd3b86] hover:bg-[#b8307a] text-white gap-1.5"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Confirmer la sortie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Receipt,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Trash2,
  User,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FacturePartPaiementBadge,
  FacturePaiementGlobalBadge,
} from "@/components/shared/facture-db-status-badge"
import { SuiviAssureurBadge } from "@/components/shared/bordereau-status-badge"
import { CategorieIcon, formatCategorieLabel } from "@/components/shared/categorie-icon"
import {
  formatCurrency,
  formatDate,
  formatBirthAge,
  formatDateTime,
  formatFactureNumero,
} from "@/lib/formatting"
import { resolveFacturePaiementStatus } from "@/lib/facture/paiement-status"
import { cn } from "@/lib/utils"
import { confirmFacture, deleteFactureBrouillon } from "@/app/actions/factures"
import { FacturePaiementHistoriqueCard } from "@/components/facturation/facture-paiement-historique-card"
import type { FactureDetail, FactureFeuilleResume } from "@/lib/types/facture"

function ligneLabel(l: FactureFeuilleResume["lignes"][number]) {
  return l.typeLigne === "PHARMA"
    ? `${l.produitNom ?? "Produit"}${l.produitDosage ? " " + l.produitDosage : ""}`
    : l.acteNom ?? "Acte"
}

type LigneAvecFeuille = FactureFeuilleResume["lignes"][number] & {
  feuilleId: string
  feuilleNumero: string
}

export function FactureDetailClient({ facture }: { facture: FactureDetail }) {
  const router = useRouter()
  const [pending, setPending] = React.useState<"confirm" | "delete" | null>(null)
  const totalGeneral = facture.montantPatient + facture.montantAssurance
  const paiement = resolveFacturePaiementStatus({
    statut: facture.statut,
    montantPatient: facture.montantPatient,
    montantAssurance: facture.montantAssurance,
    suiviAssureur: facture.suiviAssureur,
  })
  const toutesLignes: LigneAvecFeuille[] = facture.feuilles.flatMap((f) =>
    f.lignes.map((l) => ({
      ...l,
      feuilleId: f.feuilleId,
      feuilleNumero: f.numero,
    })),
  )

  async function handleConfirm() {
    setPending("confirm")
    try {
      const res = await confirmFacture({ id: facture.id })
      if (res.ok) {
        toast.success("Facture confirmée — encaissement à la caisse")
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
      const res = await deleteFactureBrouillon(facture.id)
      if (res.ok) {
        toast.success("Facture supprimée")
        router.push("/facturation")
      } else {
        toast.error(res.error)
        setPending(null)
      }
    } catch {
      setPending(null)
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/facturation"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la facturation
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg">
            <Link href={`/facturation/${facture.id}/imprimer`}>
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Link>
          </Button>
          {facture.statut === "BROUILLON" && (
            <>
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
                      La facture {formatFactureNumero(facture.numero)} sera définitivement
                      supprimée. Les feuilles de circulation pourront être regroupées dans une
                      nouvelle facture.
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={pending !== null}
                    className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
                  >
                    {pending === "confirm" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Confirmer la facture
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la facture ?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          La facture{" "}
                          <strong className="text-foreground">
                            {formatFactureNumero(facture.numero)}
                          </strong>{" "}
                          sera validée et verrouillée. Elle pourra ensuite être encaissée à la
                          caisse.
                        </p>
                        <p>
                          {facture.feuilles.length} feuille
                          {facture.feuilles.length > 1 ? "s" : ""} de circulation · Part patient{" "}
                          <strong className="text-[#cd3b86]">
                            {formatCurrency(facture.montantPatient)}
                          </strong>
                        </p>
                        <p className="text-amber-700">
                          Vérifiez le détail des lignes avant de valider.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleConfirm()}
                      className="bg-[#cd3b86] hover:bg-[#b8307a]"
                    >
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {facture.statut === "CONFIRMEE" && (
            <Button
              asChild
              size="sm"
              className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
            >
              <Link href="/caisse">
                <Receipt className="h-4 w-4" />
                Encaisser à la caisse
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Facture</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {formatFactureNumero(facture.numero)}
            </h1>
            <FacturePaiementGlobalBadge status={paiement.global} />
            {paiement.hasPartAssureur &&
              facture.suiviAssureur &&
              facture.suiviAssureur.statut !== "PAYE" && (
                <SuiviAssureurBadge status={facture.suiviAssureur.statut} />
              )}
            {facture.suiviAssureur?.bordereauId && facture.suiviAssureur.bordereauNumero && (
              <Link
                href={`/facturation/bordereaux/${facture.suiviAssureur.bordereauId}`}
                className="text-sm font-medium text-[#cd3b86] hover:underline"
              >
                {facture.suiviAssureur.bordereauNumero}
              </Link>
            )}
            {facture.suiviAssureur?.assuranceNom && (
              <span className="text-sm text-gray-500">{facture.suiviAssureur.assuranceNom}</span>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-2.5 text-sm">
              <User className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400">Patient</p>
                <Link
                  href={`/patients/${facture.patientId}`}
                  className="font-semibold text-gray-800 hover:text-[#cd3b86] hover:underline truncate block"
                >
                  {facture.patientLabel ?? `Patient #${facture.patientId}`}
                </Link>
                {facture.patientDob && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formatBirthAge(facture.patientDob)}
                  </p>
                )}
              </div>
            </div>

            {facture.dateVisite && (
              <div className="flex items-start gap-2.5 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-400">Visite</p>
                  <Link
                    href={`/visites/${facture.visiteId}`}
                    className="font-semibold text-gray-800 hover:text-[#cd3b86] hover:underline"
                  >
                    {formatDate(facture.dateVisite)}
                  </Link>
                </div>
              </div>
            )}

            {facture.medecinNom && (
              <div className="flex items-start gap-2.5 text-sm">
                <Stethoscope className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-400">Médecin</p>
                  <p className="font-semibold text-gray-800">{facture.medecinNom}</p>
                </div>
              </div>
            )}

            {facture.createdAt && (
              <div className="flex items-start gap-2.5 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[11px] text-gray-400">Créée le</p>
                  <p className="font-semibold text-gray-800">{formatDateTime(facture.createdAt)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Part patient",
            value: formatCurrency(facture.montantPatient),
            icon: Wallet,
            accent: "text-[#cd3b86]",
            bg: "bg-[#cd3b86]/8",
            badge: (
              <FacturePartPaiementBadge part="patient" status={paiement.patient} />
            ),
          },
          {
            label: "Part assurance",
            value: formatCurrency(facture.montantAssurance),
            icon: ShieldCheck,
            accent: "text-emerald-600",
            bg: "bg-emerald-50",
            badge: paiement.hasPartAssureur ? (
              paiement.assureur === "PAYE" ? (
                <FacturePartPaiementBadge part="assureur" status="PAYE" />
              ) : facture.suiviAssureur ? (
                <SuiviAssureurBadge status={facture.suiviAssureur.statut} />
              ) : (
                <FacturePartPaiementBadge part="assureur" status="IMPAYE" />
              )
            ) : (
              <FacturePartPaiementBadge part="assureur" status="SANS_PART" />
            ),
          },
          {
            label: "Total",
            value: formatCurrency(totalGeneral),
            icon: Receipt,
            accent: "text-gray-900",
            bg: "bg-gray-100",
            badge:
              paiement.global === "TOTALEMENT_PAYE" ? (
                <FacturePaiementGlobalBadge status="TOTALEMENT_PAYE" />
              ) : null,
          },
          {
            label: "Feuilles de circulation liées",
            value: String(facture.feuilles.length),
            icon: ScrollText,
            accent: "text-gray-900",
            bg: "bg-[#cd3b86]/8",
            badge: null,
          },
        ].map(({ label, value, icon: Icon, accent, bg, badge }) => (
          <Card key={label} className="border border-gray-100 shadow-sm rounded-2xl bg-white">
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className={cn("text-xl font-extrabold mt-1 tabular-nums", accent)}>{value}</p>
                  {badge ? <div className="mt-1.5">{badge}</div> : null}
                </div>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    bg,
                    accent,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FacturePaiementHistoriqueCard
        historique={facture.historiquePaiements}
        totalEncaisse={facture.totalEncaisse}
      />

      {facture.feuilles.length > 1 && (
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
              Feuilles de circulation
            </p>
            <div className="flex flex-wrap gap-2">
              {facture.feuilles.map((f) => (
                <Link
                  key={f.feuilleId}
                  href={`/feuilles-circulation/${f.feuilleId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-1.5 text-sm font-medium text-[#cd3b86] hover:bg-[#cd3b86]/5 hover:underline"
                >
                  <ScrollText className="h-3.5 w-3.5 shrink-0" />
                  {f.numero}
                  {f.libelle ? (
                    <span className="text-gray-500 font-normal">— {f.libelle}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">
              Détail des lignes ({toutesLignes.length})
            </CardTitle>
            {facture.feuilles.length === 1 && (
              <Link
                href={`/feuilles-circulation/${facture.feuilles[0].feuilleId}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#cd3b86] hover:underline"
              >
                <ScrollText className="h-3.5 w-3.5" />
                {facture.feuilles[0].numero}
                {facture.feuilles[0].libelle ? (
                  <span className="text-gray-500 font-normal">
                    — {facture.feuilles[0].libelle}
                  </span>
                ) : null}
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                  <TableHead className="py-3 pl-4">Désignation</TableHead>
                  <TableHead className="text-center py-3">Qté</TableHead>
                  <TableHead className="text-right py-3">PU / Valeur</TableHead>
                  <TableHead className="text-center py-3">Taux</TableHead>
                  <TableHead className="text-right py-3">HNC</TableHead>
                  <TableHead className="text-right py-3">Assurance</TableHead>
                  <TableHead className="text-right py-3">Patient</TableHead>
                  <TableHead className="text-right py-3 pr-4">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toutesLignes.map((l, i) => (
                  <TableRow
                    key={l.id}
                    className={cn(
                      "border-b border-gray-50 hover:bg-[#cd3b86]/3",
                      i % 2 !== 0 && "bg-gray-50/30",
                    )}
                  >
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <CategorieIcon
                          nom={l.categorieNom}
                          className="h-4 w-4 shrink-0 text-[#cd3b86]"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 leading-tight">
                            {ligneLabel(l)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCategorieLabel(l.categorieNom)}
                            {facture.feuilles.length > 1 ? (
                              <span className="text-gray-400"> · {l.feuilleNumero}</span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-3 tabular-nums">{l.quantite}</TableCell>
                    <TableCell className="text-right py-3 tabular-nums">
                      {formatCurrency(l.valeur)}
                    </TableCell>
                    <TableCell className="text-center py-3 tabular-nums">{l.taux}%</TableCell>
                    <TableCell className="text-right py-3 tabular-nums">
                      {formatCurrency(l.hnc * l.quantite)}
                    </TableCell>
                    <TableCell className="text-right py-3 text-emerald-600 tabular-nums">
                      {formatCurrency(l.montantAssurance)}
                    </TableCell>
                    <TableCell className="text-right py-3 font-medium tabular-nums">
                      {formatCurrency(l.montantPatient)}
                    </TableCell>
                    <TableCell className="text-right py-3 tabular-nums pr-4">
                      {formatCurrency(l.montantTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Part assurance</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(facture.montantAssurance)}
            </p>
            <div className="mt-1">
              <FacturePartPaiementBadge part="assureur" status={paiement.assureur} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Part patient</p>
            <p className="text-lg font-bold text-[#cd3b86]">
              {formatCurrency(facture.montantPatient)}
            </p>
            <div className="mt-1">
              <FacturePartPaiementBadge part="patient" status={paiement.patient} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalGeneral)}</p>
            {paiement.global === "TOTALEMENT_PAYE" && (
              <div className="mt-1">
                <FacturePaiementGlobalBadge status="TOTALEMENT_PAYE" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

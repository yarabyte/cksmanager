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
  Lock,
  Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { formatCurrency, formatBirthAge } from "@/lib/formatting"
import { CategorieIcon, formatCategorieLabel } from "@/components/shared/categorie-icon"
import { confirmPrescription, deletePrescription } from "@/app/actions/prescriptions"
import type { PrescriptionDetail } from "@/lib/types/prescription"

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

function PaiementBadge({ statut }: { statut: string }) {
  if (statut === "PAYEE") {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Payée</Badge>
    )
  }
  return (
    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Impayée</Badge>
  )
}

export function PrescriptionDetailClient({
  prescription,
  canConfirm = false,
}: {
  prescription: PrescriptionDetail
  canConfirm?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState<"confirm" | "delete" | null>(null)
  const isBrouillon = prescription.statut === "BROUILLON"

  async function handleConfirm() {
    setPending("confirm")
    const res = await confirmPrescription(prescription.id)
    setPending(null)
    if (res.ok) {
      toast.success("Prescription confirmée.")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function handleDelete() {
    setPending("delete")
    const res = await deletePrescription(prescription.id)
    if (res.ok) {
      toast.success("Prescription supprimée.")
      router.push("/prescriptions")
      router.refresh()
    } else {
      setPending(null)
      toast.error(res.error)
    }
  }

  const dateVisite = new Date(prescription.visite.dateVisite)
  const dateCreation = prescription.createdAt ? new Date(prescription.createdAt) : null

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push("/prescriptions")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="flex items-center gap-2">
          {isBrouillon && (
            <>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/prescriptions/${prescription.id}/modifier`}>
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
                    <AlertDialogTitle>Supprimer la prescription ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. La prescription {prescription.numero} et ses
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
              {canConfirm && (
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
                      <AlertDialogTitle>Confirmer la prescription ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Une fois confirmée, la prescription {prescription.numero} sera verrouillée et
                        envoyée à la caisse. Vérifiez les lignes avant de valider.
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
              )}
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Prescription
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 font-sans">{prescription.numero}</h1>
              <StatutBadge statut={prescription.statut} />
              {prescription.statut === "CONFIRMEE" && (
                <PaiementBadge statut={prescription.statutPaiement} />
              )}
            </div>
            {prescription.statut === "CONFIRMEE" && prescription.statutPaiement === "IMPAYEE" && (
              <Button asChild size="sm" variant="outline" className="mt-2 gap-1.5">
                <Link href="/caisse">
                  <Receipt className="h-4 w-4" />
                  Encaisser à la caisse
                </Link>
              </Button>
            )}
            {prescription.libelle && (
              <p className="mt-1 text-sm text-muted-foreground">{prescription.libelle}</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="flex flex-col leading-tight">
              {prescription.visite.patientDob && (
                <span className="text-[11px] text-gray-400">
                  {formatBirthAge(prescription.visite.patientDob)}
                </span>
              )}
              <span className="font-medium text-gray-700">
                {prescription.visite.patientLabel ?? `Patient #${prescription.visite.patientId}`}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Stethoscope className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{prescription.visite.medecinNom ?? "-"}</span>
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
            Détail des lignes ({prescription.lignes.length})
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
                {prescription.lignes.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategorieIcon
                          nom={l.categorieNom}
                          className="h-4 w-4 shrink-0 text-[#cd3b86]"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {`${l.produitNom ?? "Produit"}${l.produitDosage ? " " + l.produitDosage : ""}`}
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
              {formatCurrency(prescription.totaux.totalAssurance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Part patient</p>
            <p className="text-lg font-bold text-[#cd3b86]">
              {formatCurrency(prescription.totaux.totalPatient)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(prescription.totaux.total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

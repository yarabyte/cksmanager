"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Calendar,
  Download,
  Loader2,
  Package,
  Pencil,
  Truck,
  User,
  Warehouse,
} from "lucide-react"
import { validerApprovisionnement } from "@/app/actions/pharmacie-ops"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"

type ApproDetail = {
  id: string
  numero: string
  statut: string
  magasinNom: string
  fournisseurNom: string | null
  userNom: string
  dateReception: string
  note: string | null
  validatedAt: string | null
  validatedByNom: string | null
  lignes: {
    id: string
    produitNom: string
    produitDosage: string
    produitForme: string
    produitConditionnement: string
    quantite: number
    numeroLot: string
    datePeremption: string
    prixAchatUnitaire: number
  }[]
}

export function ApprovisionnementDetailClient({ appro }: { appro: ApproDetail }) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const isBrouillon = appro.statut === "BROUILLON"
  const totalQte = appro.lignes.reduce((s, l) => s + l.quantite, 0)
  const totalAchat = appro.lignes.reduce(
    (s, l) => s + l.quantite * l.prixAchatUnitaire,
    0,
  )

  async function handleValider() {
    setPending(true)
    try {
      const res = await validerApprovisionnement(appro.id)
      if (res.ok) {
        toast.success("Réception validée — stock mis à jour")
        router.refresh()
      } else toast.error(res.error)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/pharmacie/approvisionnements"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux approvisionnements
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {appro.numero}
            </h1>
            {isBrouillon ? (
              <Badge
                variant="secondary"
                className="font-medium bg-amber-100 text-amber-800"
              >
                Brouillon
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="font-medium bg-emerald-100 text-emerald-800"
              >
                Validé
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {appro.userNom}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Réception le {formatDate(appro.dateReception)}
            </span>
            {appro.validatedAt && (
              <span className="inline-flex items-center gap-1.5">
                Validé le {formatDateTime(appro.validatedAt)}
                {appro.validatedByNom ? ` par ${appro.validatedByNom}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isBrouillon ? (
            <>
              <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg">
                <Link href={`/pharmacie/approvisionnements/${appro.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Continuer
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() => void handleValider()}
                disabled={pending}
                className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Valider la réception
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg">
              <Link href={`/pharmacie/approvisionnements/${appro.id}/imprimer`}>
                <Download className="h-4 w-4" />
                Imprimer
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Magasin
                </p>
                <p className="text-base font-extrabold text-gray-900 mt-1 truncate">
                  {appro.magasinNom}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/8 text-[#cd3b86]">
                <Warehouse className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Fournisseur
                </p>
                <p className="text-base font-extrabold text-gray-900 mt-1 truncate">
                  {appro.fournisseurNom ?? "—"}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Truck className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Quantité totale
                </p>
                <p className="text-xl font-extrabold tabular-nums text-gray-900 mt-1">
                  {totalQte}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Valeur achat
                </p>
                <p className="text-xl font-extrabold tabular-nums text-[#cd3b86] mt-1">
                  {formatCurrency(totalAchat)}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/8 text-[#cd3b86]">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {appro.note && (
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-5 py-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Note : </span>
            {appro.note}
          </CardContent>
        </Card>
      )}

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="pb-3 border-b border-gray-50">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-[#cd3b86]" />
            {isBrouillon ? "Lignes du brouillon" : "Lignes reçues"}
            <Badge
              variant="secondary"
              className="ml-auto font-medium bg-[#cd3b86]/10 text-[#cd3b86]"
            >
              {appro.lignes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="pl-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Produit
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Forme
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Conditionnement
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    N° lot
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Péremption
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Qté
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    PU achat
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide pr-4">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appro.lignes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-gray-400">
                      Aucune ligne
                    </TableCell>
                  </TableRow>
                ) : (
                  appro.lignes.map((l, i) => (
                    <TableRow
                      key={l.id}
                      className={cn(
                        "border-b border-gray-50",
                        i % 2 !== 0 && "bg-gray-50/30",
                      )}
                    >
                      <TableCell className="pl-4">
                        <p className="font-semibold text-sm text-gray-800">
                          {l.produitNom || (
                            <span className="text-gray-400 font-normal">Produit non renseigné</span>
                          )}
                        </p>
                        {l.produitDosage && (
                          <p className="text-xs text-gray-400">{l.produitDosage}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {l.produitForme || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {l.produitConditionnement || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-700">
                        {l.numeroLot || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {l.datePeremption ? formatDate(l.datePeremption) : "—"}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-sm font-semibold">
                        {l.quantite}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-gray-600">
                        {formatCurrency(l.prixAchatUnitaire)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-semibold pr-4">
                        {formatCurrency(l.quantite * l.prixAchatUnitaire)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-4 border-t border-gray-100 bg-gray-50/50 px-4 py-3 text-sm">
            <span className="text-gray-500">
              Unités : <strong className="text-gray-900 tabular-nums">{totalQte}</strong>
            </span>
            <span className="font-bold text-gray-900">
              Total achat : {formatCurrency(totalAchat)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

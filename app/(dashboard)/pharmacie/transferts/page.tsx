import Link from "next/link"
import { ArrowRightLeft, Download, Eye, Package, Plus } from "lucide-react"
import { requirePharmaciePageGestion } from "@/lib/pharmacie/access"
import { listTransferts } from "@/app/actions/pharmacie-ops"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function TransfertsPage() {
  await requirePharmaciePageGestion()
  const rows = (await listTransferts()) as {
    id: string
    numero: string
    magasinSourceNom: string
    magasinDestNom: string
    userNom: string
    statut: string
    nbLignes: number
    createdAt: string | null
  }[]

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Transferts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mouvements inter-magasins avec lots</p>
        </div>
        <Button
          asChild
          className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
        >
          <Link href="/pharmacie/transferts/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau transfert
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Total transferts
                </p>
                <p className="text-xl font-extrabold mt-1 tabular-nums text-gray-900">
                  {rows.length}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Lignes transférées
                </p>
                <p className="text-xl font-extrabold mt-1 tabular-nums text-[#cd3b86]">
                  {rows.reduce((s, r) => s + r.nbLignes, 0)}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/8 text-[#cd3b86]">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                <TableHead className="pl-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  N°
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Source
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Destination
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Lignes
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Par
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Date
                </TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-gray-500">
                    Aucun transfert enregistré.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, i) => (
                  <TableRow
                    key={r.id}
                    className={cn(
                      "hover:bg-[#cd3b86]/3 transition-colors border-b border-gray-50",
                      i % 2 !== 0 && "bg-gray-50/30",
                    )}
                  >
                    <TableCell className="pl-4">
                      <Link
                        href={`/pharmacie/transferts/${r.id}`}
                        className="font-semibold text-sm text-[#cd3b86] hover:underline"
                      >
                        {r.numero}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-gray-800">{r.magasinSourceNom}</TableCell>
                    <TableCell className="text-sm text-gray-800">{r.magasinDestNom}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="font-medium bg-[#cd3b86]/10 text-[#cd3b86] tabular-nums"
                      >
                        {r.nbLignes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{r.userNom}</TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {r.createdAt ? formatDateTime(r.createdAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end pr-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-gray-400 hover:text-gray-600 px-2"
                        >
                          <Link href={`/pharmacie/transferts/${r.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            Voir
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-gray-400 hover:text-gray-600 px-2"
                        >
                          <Link href={`/pharmacie/transferts/${r.id}/imprimer`}>
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

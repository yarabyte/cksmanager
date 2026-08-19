"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatting"
import type { FeuilleListRow } from "@/lib/types/feuille-circulation"
import { Eye, Loader2, Plus, ScrollText } from "lucide-react"

function StatutBadge({ statut }: { statut: string }) {
  if (statut === "CONFIRMEE") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        Confirmée
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Brouillon</Badge>
  )
}

export function PatientFeuillesSection({
  feuilles,
  isPending,
  patientId,
  createHref,
}: {
  feuilles: FeuilleListRow[] | undefined
  isPending: boolean
  patientId: string
  createHref?: string | null
}) {
  const router = useRouter()
  const rows = feuilles ?? []

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 mb-2 animate-spin" />
        <p>Chargement des feuilles de circulation…</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <ScrollText className="h-8 w-8 mb-2" />
        <p>Aucune feuille de circulation enregistrée</p>
        <p className="text-xs mt-1 text-center max-w-sm">
          La feuille de circulation suit le parcours du patient entre consultation, examens et
          facturation.
        </p>
        {createHref ? (
          <Button asChild size="sm" className="mt-4 gap-2">
            <Link href={createHref}>
              <Plus className="h-4 w-4" />
              Créer une feuille de circulation
            </Link>
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° / Libellé</TableHead>
          <TableHead>Date visite</TableHead>
          <TableHead className="hidden sm:table-cell">Créée le</TableHead>
          <TableHead className="text-center hidden sm:table-cell">Lignes</TableHead>
          <TableHead className="text-right hidden lg:table-cell">Assurance</TableHead>
          <TableHead className="text-right">Patient</TableHead>
          <TableHead className="text-right hidden lg:table-cell">Total</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="w-[44px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((f) => (
          <TableRow
            key={f.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/feuilles-circulation/${f.id}`)}
          >
            <TableCell className="font-medium">
              <span className="font-sans text-sm text-[#cd3b86]">{f.numero}</span>
              {f.libelle ? (
                <div className="text-xs text-muted-foreground">{f.libelle}</div>
              ) : null}
            </TableCell>
            <TableCell>{f.dateVisite ? formatDate(f.dateVisite) : "—"}</TableCell>
            <TableCell className="hidden sm:table-cell">
              {f.createdAt ? formatDateTime(f.createdAt) : "—"}
            </TableCell>
            <TableCell className="text-center hidden sm:table-cell">{f.nbLignes}</TableCell>
            <TableCell className="text-right hidden lg:table-cell text-emerald-600">
              {formatCurrency(f.totalAssurance)}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(f.totalPatient)}
            </TableCell>
            <TableCell className="text-right hidden lg:table-cell">
              {formatCurrency(f.total)}
            </TableCell>
            <TableCell>
              <StatutBadge statut={f.statut} />
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/feuilles-circulation/${f.id}`)
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

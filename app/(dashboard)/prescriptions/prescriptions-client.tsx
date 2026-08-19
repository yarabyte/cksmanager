"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Columns3,
  FileCheck2,
  FilePen,
  Pill,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Stethoscope,
  Eye,
} from "lucide-react"
import { KPICard } from "@/components/shared/kpi-card"
import { formatBirthAge, formatCurrency, formatDateTime } from "@/lib/formatting"
import type { PrescriptionFilters, PrescriptionListRow, PrescriptionStats } from "@/lib/types/prescription"
import { listPrescriptions } from "@/app/actions/prescriptions"

const COLUMN_DEFS = [
  { id: "medecin", label: "Médecin" },
  { id: "lignes", label: "Lignes" },
  { id: "partAssurance", label: "Part assurance" },
  { id: "partPatient", label: "Part patient" },
  { id: "statut", label: "Statut" },
  { id: "paiement", label: "Paiement" },
] as const

type ColumnId = (typeof COLUMN_DEFS)[number]["id"]
type ColumnVisibility = Record<ColumnId, boolean>

const DEFAULT_COLUMNS: ColumnVisibility = {
  medecin: true,
  lignes: true,
  partAssurance: true,
  partPatient: true,
  statut: true,
  paiement: true,
}

const STORAGE_KEY = "prescriptions-columns"

function loadColumns(): ColumnVisibility {
  if (typeof window === "undefined") return DEFAULT_COLUMNS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COLUMNS
    const parsed = JSON.parse(raw) as Partial<ColumnVisibility>
    return { ...DEFAULT_COLUMNS, ...parsed }
  } catch {
    return DEFAULT_COLUMNS
  }
}

function StatutBadge({ statut }: { statut: string }) {
  return statut === "CONFIRMEE" ? (
    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
      Confirmee
    </Badge>
  ) : (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
      Brouillon
    </Badge>
  )
}

function PaiementBadge({ statut }: { statut: string }) {
  return statut === "PAYEE" ? (
    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Payee</Badge>
  ) : (
    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Impayee</Badge>
  )
}

export function PrescriptionsClient({
  initialPrescriptions,
  stats,
}: {
  initialPrescriptions: PrescriptionListRow[]
  stats: PrescriptionStats
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statut, setStatut] = React.useState<"all" | "BROUILLON" | "CONFIRMEE">("all")
  const [loading, setLoading] = React.useState(false)
  const [prescriptions, setPrescriptions] = React.useState(initialPrescriptions)
  const [columns, setColumns] = React.useState<ColumnVisibility>(DEFAULT_COLUMNS)

  React.useEffect(() => {
    setColumns(loadColumns())
  }, [])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
  }, [columns])

  const colCount = Object.values(columns).filter(Boolean).length
  const visibleColumnCount = 3 + colCount

  function toggleColumn(id: ColumnId) {
    setColumns((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function showAllColumns() {
    setColumns(DEFAULT_COLUMNS)
  }

  const fetchPrescriptions = React.useCallback(async (filters: PrescriptionFilters) => {
    setLoading(true)
    try {
      setPrescriptions(await listPrescriptions(filters))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void fetchPrescriptions({
      statut: statut !== "all" ? statut : undefined,
    })
  }, [fetchPrescriptions, statut])

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return prescriptions
    return prescriptions.filter((p) =>
      [p.numero, p.patientLabel, p.libelle, p.medecinNom]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [prescriptions, searchQuery])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Prescriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prescriptions produits, validation medecin, paiement caisse et sortie pharmacie.
          </p>
        </div>
        <Button asChild className="gap-2 bg-[#cd3b86] text-white hover:bg-[#b8307a]">
          <Link href="/prescriptions/nouvelle">
            <Plus className="h-4 w-4" />
            Nouvelle prescription
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard title="Total prescriptions" value={stats.total} icon={<Pill className="h-6 w-6" />} />
        <KPICard title="Brouillons" value={stats.brouillon} icon={<FilePen className="h-6 w-6" />} />
        <KPICard title="Confirmees" value={stats.confirmees} icon={<FileCheck2 className="h-6 w-6" />} />
        <KPICard title="Impayees" value={stats.impayees} icon={<Receipt className="h-6 w-6" />} />
        <KPICard
          title="Part patient en attente"
          value={formatCurrency(stats.totalPatientEnCours)}
          icon={<ShieldCheck className="h-6 w-6" />}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par numero, patient, medecin ou libelle..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={statut === "all" ? "default" : "outline"}
                onClick={() => setStatut("all")}
              >
                Tous
              </Button>
              <Button
                type="button"
                variant={statut === "BROUILLON" ? "default" : "outline"}
                onClick={() => setStatut("BROUILLON")}
              >
                Brouillons
              </Button>
              <Button
                type="button"
                variant={statut === "CONFIRMEE" ? "default" : "outline"}
                onClick={() => setStatut("CONFIRMEE")}
              >
                Confirmees
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-xs"
                  >
                    <Columns3 className="h-3.5 w-3.5" />
                    Colonnes
                    <Badge
                      variant="secondary"
                      className="ml-0.5 h-5 min-w-5 justify-center px-1.5 text-[10px] font-semibold"
                    >
                      {colCount}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs">
                    Afficher les colonnes
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COLUMN_DEFS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={columns[col.id]}
                      onCheckedChange={() => toggleColumn(col.id)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <button
                    type="button"
                    onClick={showAllColumns}
                    className="w-full rounded-sm px-2 py-1.5 text-left text-xs text-[#cd3b86] hover:bg-gray-50"
                  >
                    Tout afficher
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Patient</TableHead>
                {columns.medecin && <TableHead>Medecin</TableHead>}
                {columns.lignes && <TableHead>Lignes</TableHead>}
                {columns.partAssurance && <TableHead>Part assurance</TableHead>}
                {columns.partPatient && <TableHead>Part patient</TableHead>}
                {columns.statut && <TableHead>Statut</TableHead>}
                {columns.paiement && <TableHead>Paiement</TableHead>}
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="py-8 text-center text-sm text-gray-500">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="py-8 text-center text-sm text-gray-500">
                    Aucune prescription.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-gray-900">{p.numero}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-gray-800">
                          {p.patientLabel ?? `Patient #${p.patientId}`}
                        </div>
                        {p.patientDob && (
                          <div className="text-xs text-gray-500">
                            {formatBirthAge(p.patientDob)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {columns.medecin && (
                      <TableCell>
                        <div className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <Stethoscope className="h-4 w-4 text-gray-400" />
                          {p.medecinNom ?? "-"}
                        </div>
                      </TableCell>
                    )}
                    {columns.lignes && <TableCell>{p.nbLignes}</TableCell>}
                    {columns.partAssurance && (
                      <TableCell>{formatCurrency(p.totalAssurance)}</TableCell>
                    )}
                    {columns.partPatient && (
                      <TableCell className="font-medium text-[#cd3b86]">
                        {formatCurrency(p.totalPatient)}
                      </TableCell>
                    )}
                    {columns.statut && (
                      <TableCell>
                        <StatutBadge statut={p.statut} />
                      </TableCell>
                    )}
                    {columns.paiement && (
                      <TableCell>
                        <PaiementBadge statut={p.statutPaiement} />
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link href={`/prescriptions/${p.id}`}>
                          <Eye className="h-4 w-4" />
                          Voir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-xs text-gray-500">
        Derniere actualisation basee sur les creations et validations de prescription.{" "}
        {initialPrescriptions[0]?.createdAt
          ? `Exemple recent: ${formatDateTime(initialPrescriptions[0].createdAt)}`
          : ""}
      </div>
    </div>
  )
}

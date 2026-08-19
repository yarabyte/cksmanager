"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Clock,
  Loader2,
  ChevronRight,
  RefreshCw,
  Stethoscope,
  UserRound,
  Activity,
  LayoutGrid,
  LayoutList,
} from "lucide-react"
import { useSalleAttente } from "@/hooks/use-parametres-patient"
import type { SalleAttenteRow } from "@/app/actions/parametres-patient"
import { ParametresPatientViewSheet } from "@/components/medical/parametres-patient-view-sheet"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"

const VIEW_STORAGE_KEY = "cks.salle-attente.view"

type ViewMode = "cards" | "table"

function medecinLabel(titre: string | null, nom: string) {
  const p = titre === "Docteur" ? "Dr." : titre === "Professeur" ? "Pr." : ""
  return p ? `${p} ${nom}` : nom
}

function usePersistedViewMode() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("cards")

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY)
      if (stored === "cards" || stored === "table") setViewMode(stored)
    } catch {
      /* ignore */
    }
  }, [])

  function setAndPersist(mode: ViewMode) {
    setViewMode(mode)
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
  }

  return { viewMode, setViewMode: setAndPersist }
}

function PatientIdentity({
  row,
  onOpen,
}: {
  row: SalleAttenteRow
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      className="flex items-start gap-2.5 text-left group min-w-0"
      onClick={onOpen}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cd3b86]/10 text-[#cd3b86]">
        <UserRound className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <span className="font-semibold text-gray-900 group-hover:text-[#cd3b86] transition-colors">
          {row.patientLabel ?? `Patient #${row.patientId}`}
        </span>
        {row.patientAge != null && (
          <p className="text-xs text-gray-500 mt-0.5">
            {row.patientAge} an{row.patientAge > 1 ? "s" : ""}
            {row.isPediatrique ? " · Pédiatrique" : ""}
          </p>
        )}
      </div>
    </button>
  )
}

function RowActions({
  row,
  onOpenParams,
}: {
  row: SalleAttenteRow
  onOpenParams: () => void
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-8 rounded-lg gap-1.5 text-xs"
        onClick={onOpenParams}
      >
        <Activity className="h-3.5 w-3.5" />
        Paramètres
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg"
        asChild
      >
        <Link href={`/visites/${row.id}`} aria-label="Ouvrir la visite">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

function TableView({
  items,
  onOpenParams,
}: {
  items: SalleAttenteRow[]
  onOpenParams: (id: string) => void
}) {
  return (
    <div className={cn(cardSurface, "overflow-hidden")}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead className="hidden md:table-cell">Motif</TableHead>
            <TableHead className="hidden lg:table-cell">Médecin</TableHead>
            <TableHead className="hidden sm:table-cell">Arrivée</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r, i) => (
            <TableRow key={r.id} className={cn(i % 2 === 1 && "bg-gray-50/40")}>
              <TableCell className="text-center">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 tabular-nums">
                  {i + 1}
                </span>
              </TableCell>
              <TableCell>
                <PatientIdentity row={r} onOpen={() => onOpenParams(r.id)} />
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {r.motifLibelle}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                {medecinLabel(r.medecinTitre, r.medecinNom)}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-gray-600 tabular-nums">
                {r.parametresAt
                  ? format(new Date(r.parametresAt), "HH:mm", { locale: fr })
                  : "—"}
                {r.parametresAt && (
                  <span className="block text-[11px] text-gray-400">
                    {format(new Date(r.parametresAt), "dd MMM", { locale: fr })}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <RowActions row={r} onOpenParams={() => onOpenParams(r.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CardsView({
  items,
  onOpenParams,
}: {
  items: SalleAttenteRow[]
  onOpenParams: (id: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((r, i) => (
        <article
          key={r.id}
          className={cn(
            cardSurface,
            "flex flex-col p-4 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 tabular-nums">
                {i + 1}
              </span>
              <PatientIdentity row={r} onOpen={() => onOpenParams(r.id)} />
            </div>
            {r.parametresAt && (
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-gray-900">
                  {format(new Date(r.parametresAt), "HH:mm", { locale: fr })}
                </p>
                <p className="text-[11px] text-gray-400">
                  {format(new Date(r.parametresAt), "dd MMM", { locale: fr })}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p className="inline-flex items-center gap-1.5 min-w-0">
              <Stethoscope className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{r.motifLibelle}</span>
            </p>
            <p className="truncate pl-5">
              {medecinLabel(r.medecinTitre, r.medecinNom)}
            </p>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-gray-50">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg gap-1.5 text-xs flex-1"
              onClick={() => onOpenParams(r.id)}
            >
              <Activity className="h-3.5 w-3.5" />
              Paramètres
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg gap-1 text-xs"
              asChild
            >
              <Link href={`/visites/${r.id}`}>
                Visite
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}

export default function SalleAttentePage() {
  const { data, isLoading, error, isFetching, refetch } = useSalleAttente()
  const items = data ?? []
  const [selectedVisiteId, setSelectedVisiteId] = React.useState<string | null>(
    null,
  )
  const { viewMode, setViewMode } = usePersistedViewMode()

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#cd3b86] uppercase tracking-widest">
            Médical
          </p>
          <h1 className="text-2xl font-bold text-gray-900 font-['DM_Sans',sans-serif] flex items-center gap-2">
            <Clock className="h-7 w-7 text-gray-700" />
            Salle d&apos;attente
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Patients dont les paramètres sont saisis — prêts pour la consultation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-full border-0 bg-blue-50 text-blue-700 px-3 py-1.5 tabular-nums"
          >
            {items.length} en file
          </Badge>

          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-md transition-all",
                    viewMode === "cards"
                      ? "bg-white shadow-sm text-[#cd3b86]"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                  aria-label="Vue cartes"
                  aria-pressed={viewMode === "cards"}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Vue cartes</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-md transition-all",
                    viewMode === "table"
                      ? "bg-white shadow-sm text-[#cd3b86]"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                  aria-label="Vue tableau"
                  aria-pressed={viewMode === "table"}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Vue tableau</TooltipContent>
            </Tooltip>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl h-9 w-9"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Actualiser"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error && (
        <div className={cn(cardSurface, "px-4 py-3 text-sm text-red-700 bg-red-50/80")}>
          {error instanceof Error ? error.message : "Erreur de chargement"}
        </div>
      )}

      {isLoading ? (
        <div
          className={cn(
            cardSurface,
            "flex items-center justify-center py-20 text-gray-500 gap-2",
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement…
        </div>
      ) : items.length === 0 ? (
        <div className={cardSurface}>
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyTitle>Aucun patient en attente</EmptyTitle>
              <EmptyDescription>
                Les patients apparaîtront ici après la saisie de leurs paramètres.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : viewMode === "cards" ? (
        <CardsView items={items} onOpenParams={setSelectedVisiteId} />
      ) : (
        <TableView items={items} onOpenParams={setSelectedVisiteId} />
      )}

      <ParametresPatientViewSheet
        visiteId={selectedVisiteId}
        open={!!selectedVisiteId}
        onOpenChange={(open) => {
          if (!open) setSelectedVisiteId(null)
        }}
      />
    </div>
  )
}

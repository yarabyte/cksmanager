"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search, Plus, MoreHorizontal, Eye, Pencil, Stethoscope, ScrollText, Receipt,
  Filter, X, Loader2, ChevronLeft, ChevronRight, Users,
  ChevronFirst, ChevronLast, Phone, ShieldCheck,
} from "lucide-react"
import {
  formatDate, calculateAge, getInitials, formatPatientIdentityLine,
} from "@/lib/formatting"
import {
  usePatientsList, usePatientSelect2Suggestions,
} from "@/hooks/use-patients"
import { useAssurancesList } from "@/hooks/use-assurances"
import { useCategoriesList } from "@/hooks/use-actes"
import { NouveauPatientWizard } from "@/components/patients/nouveau-patient-wizard"
import { cn } from "@/lib/utils"
import { NouvelleVisiteDialog } from "@/components/visites/nouvelle-visite-dialog"
import { useVisiteFormOptions, usePatientsVisiteCounts } from "@/hooks/use-visites"
import type { PatientOption } from "@/app/actions/visites"

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <TableRow className="animate-pulse">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell"><div className="h-3 w-16 rounded bg-gray-200" /></TableCell>
      <TableCell className="hidden md:table-cell"><div className="h-3 w-24 rounded bg-gray-200" /></TableCell>
      <TableCell className="hidden sm:table-cell"><div className="h-3 w-28 rounded bg-gray-200" /></TableCell>
      <TableCell className="hidden lg:table-cell"><div className="h-5 w-20 rounded-full bg-gray-100" /></TableCell>
      <TableCell><div className="h-7 w-7 rounded bg-gray-100" /></TableCell>
    </TableRow>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-52 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
            <Users className="h-7 w-7 text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">
              {hasFilters ? "Aucun patient ne correspond" : "Aucun patient enregistré"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {hasFilters ? "Essayez d'autres termes ou filtres." : "Créez votre premier patient."}
            </p>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={onClear} className="gap-1.5 text-xs">
              <X className="h-3.5 w-3.5" /> Effacer les filtres
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQ, setDebouncedQ] = React.useState("")
  const [selectedAssureur, setSelectedAssureur] = React.useState("all")
  const [selectedGender, setSelectedGender] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState<number>(20)
  const [isNewPatientOpen, setIsNewPatientOpen] = React.useState(false)
  const [visiteDialogOpen, setVisiteDialogOpen] = React.useState(false)
  const [visitePatient, setVisitePatient] = React.useState<PatientOption | null>(null)

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  React.useEffect(() => { setPage(1) }, [debouncedQ, selectedAssureur, selectedGender])

  const sexeFilter = selectedGender === "M" ? 1 : selectedGender === "F" ? 2 : undefined
  const assuranceFilter = selectedAssureur === "all" ? undefined : selectedAssureur
  const skip = (page - 1) * pageSize

  const { data, isLoading, error, refetch } = usePatientsList(debouncedQ, skip, pageSize, sexeFilter, assuranceFilter)
  const { data: assurancesRaw } = useAssurancesList()
  const assurances = assurancesRaw ?? []
  const { data: categoriesRaw } = useCategoriesList()
  const categories = React.useMemo(
    () =>
      (categoriesRaw ?? []).map((c) => ({
        id: String((c as { id: unknown }).id),
        nom: String((c as { nom: unknown }).nom),
      })),
    [categoriesRaw],
  )
  const assuranceOptions = React.useMemo(
    () =>
      assurances.map((a) => ({
        id: String((a as { id: unknown }).id),
        nom: String((a as { nom: unknown }).nom),
        promoteurUserId:
          (a as { promoteurUserId?: string | null }).promoteurUserId ?? null,
      })),
    [assurances],
  )
  const { data: select2Data, isPending: select2Loading } = usePatientSelect2Suggestions()
  const { data: visiteFormOptions } = useVisiteFormOptions(visiteDialogOpen)

  const items = data?.items ?? []
  const patientIds = React.useMemo(
    () => items.map((p) => String((p as Record<string, unknown>).id)),
    [items],
  )
  const { data: visiteCounts } = usePatientsVisiteCounts(patientIds)
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  React.useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])

  const rangeFrom = total === 0 ? 0 : skip + 1
  const rangeTo = Math.min(skip + pageSize, total)

  const hasActiveFilters = searchQuery !== "" || selectedAssureur !== "all" || selectedGender !== "all"
  const activeCount = [searchQuery !== "", selectedAssureur !== "all", selectedGender !== "all"].filter(Boolean).length

  const clearFilters = () => { setSearchQuery(""); setSelectedAssureur("all"); setSelectedGender("all") }

  function closeVisiteDialog() {
    setVisiteDialogOpen(false)
    setVisitePatient(null)
  }

  function openVisiteDialog(patient: PatientOption) {
    setVisitePatient(patient)
    setVisiteDialogOpen(true)
  }

  return (
    <div className="space-y-5">
      {visitePatient && (
        <NouvelleVisiteDialog
          open={visiteDialogOpen}
          onClose={closeVisiteDialog}
          medecins={visiteFormOptions?.medecins ?? []}
          motifs={visiteFormOptions?.motifs ?? []}
          initialPatient={visitePatient}
          onCreated={() => {
            closeVisiteDialog()
          }}
        />
      )}

      <NouveauPatientWizard
        open={isNewPatientOpen}
        onOpenChange={setIsNewPatientOpen}
        onCreated={() => void refetch()}
        select2Suggestions={select2Data}
        select2Loading={select2Loading}
        assurances={assuranceOptions}
        categories={categories}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total > 0 && !isLoading
              ? `${total} patient${total > 1 ? "s" : ""} enregistré${total > 1 ? "s" : ""}`
              : "Gérez vos dossiers patients"}
          </p>
        </div>

        <Button
          type="button"
          className="gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm transition-all"
          onClick={() => setIsNewPatientOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nouveau patient
        </Button>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
        <CardContent className="px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Nom, prénom, téléphone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50 border-gray-200 h-9 text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Assureur */}
              <Select value={selectedAssureur} onValueChange={setSelectedAssureur}>
                <SelectTrigger className="h-9 w-[180px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <SelectValue placeholder="Tous les assureurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les assureurs</SelectItem>
                  <SelectItem value="none">Sans assurance</SelectItem>
                  {assurances.map((a) => (
                    <SelectItem key={String(a.id)} value={String(a.id)}>{a.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Genre */}
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="h-9 w-[120px] text-xs bg-gray-50 border-gray-200 rounded-lg">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="M">Homme</SelectItem>
                  <SelectItem value="F">Femme</SelectItem>
                </SelectContent>
              </Select>

              {/* Active filter badge + reset */}
              {hasActiveFilters && (
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#cd3b86] bg-[#cd3b86]/8 border border-[#cd3b86]/20 px-2 py-1 rounded-full">
                    <Filter className="h-3 w-3" />
                    {activeCount} filtre{activeCount > 1 ? "s" : ""}
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearFilters}
                    className="h-7 text-xs text-gray-400 hover:text-gray-600 px-2 gap-1">
                    <X className="h-3 w-3" /> Effacer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Metadata row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400 font-medium">
          {isLoading ? "Chargement…" : total === 0 ? "Aucun résultat" : `${rangeFrom}–${rangeTo} sur ${total} patient${total > 1 ? "s" : ""}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">Lignes :</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
            <SelectTrigger className="h-7 w-16 text-xs bg-white border-gray-200 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Erreur de chargement :</span>
          Vérifiez DATABASE_URL et que la base est migrée.
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3 pl-4">Patient</TableHead>
                <TableHead className="hidden md:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">N° dossier</TableHead>
                <TableHead className="hidden md:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Naissance</TableHead>
                <TableHead className="hidden sm:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Téléphone</TableHead>
                <TableHead className="hidden lg:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">Assurance</TableHead>
                <TableHead className="w-[44px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
              ) : (
                items.map((patient: Record<string, unknown>, i: number) => {
                  const id = String(patient.id)
                  const patName = String(patient.patName)
                  const patSurname = String(patient.patSurname)
                  const patDob = String(patient.patDob)
                  const patNum1 = String(patient.patNum1)
                  const sexe = Number(patient.sexe)
                  const nomJf = patient.nomJeuneFille != null && String(patient.nomJeuneFille).trim() !== ""
                    ? String(patient.nomJeuneFille) : null
                  const aps = patient.assurancePatients as { assurance: { nom: string } }[] | undefined
                  const primaryAssurance = aps?.[0]?.assurance?.nom

                  const isFemme = sexe === 2
                  const avatarBg = isFemme
                    ? "bg-[#cd3b86]/10 text-[#cd3b86]"
                    : "bg-blue-500/10 text-blue-600"

                  return (
                    <TableRow key={id}
                      className={cn(
                        "hover:bg-[#cd3b86]/3 transition-colors cursor-pointer border-b border-gray-50",
                        i % 2 !== 0 && "bg-gray-50/30"
                      )}>
                      <TableCell className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className={cn("text-xs font-bold", avatarBg)}>
                              {getInitials(patName, patSurname)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm text-gray-800 leading-tight">
                              {formatPatientIdentityLine(patName, patSurname, sexe, nomJf)}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {calculateAge(patDob)} ans • {isFemme ? "Femme" : "Homme"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3 font-sans text-xs text-gray-500">
                        #{id}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-3 text-sm text-gray-600">
                        {formatDate(patDob)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-3">
                        <span className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {patNum1}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3">
                        {primaryAssurance ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <ShieldCheck className="h-3 w-3" />
                            {primaryAssurance}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                              <Link href={`/patients/${id}`} className="gap-2 text-xs">
                                <Eye className="h-3.5 w-3.5" /> Voir la fiche
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/patients/${id}/edit`} className="gap-2 text-xs">
                                <Pencil className="h-3.5 w-3.5" /> Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/patients/${id}?tab=visites`}
                                className="gap-2 text-xs flex w-full items-center justify-between"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <Stethoscope className="h-3.5 w-3.5" />
                                  Visites
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="h-5 min-w-5 px-1.5 text-xs tabular-nums"
                                >
                                  {visiteCounts?.[id] ?? 0}
                                </Badge>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/patients/${id}?tab=circulation`}
                                className="gap-2 text-xs"
                              >
                                <ScrollText className="h-3.5 w-3.5" />
                                Feuille de circulation
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/patients/${id}?tab=facturation`}
                                className="gap-2 text-xs"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                Facturation
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-xs"
                              onSelect={() =>
                                openVisiteDialog({
                                  id,
                                  nom: patName,
                                  prenom: patSurname,
                                  telephone: patNum1,
                                  label: formatPatientIdentityLine(patName, patSurname, sexe, nomJf),
                                })
                              }
                            >
                              <Stethoscope className="h-3.5 w-3.5" /> Nouvelle visite
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {total > 0 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-400 order-2 sm:order-1">
            Page <span className="font-semibold text-gray-600">{page}</span> sur {totalPages}
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
              disabled={isLoading || page <= 1} onClick={() => setPage(1)} aria-label="Première page">
              <ChevronFirst className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1 rounded-lg px-3 text-xs"
              disabled={isLoading || page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-3.5 w-3.5" /> Précédent
            </Button>

            {/* Page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                const p = start + i
                return p <= totalPages ? (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="icon"
                    className={cn("h-8 w-8 rounded-lg text-xs", p === page && "bg-[#cd3b86] hover:bg-[#b8307a] text-white border-0")}
                    onClick={() => setPage(p)}>
                    {p}
                  </Button>
                ) : null
              })}
            </div>

            <Button variant="outline" size="sm" className="h-8 gap-1 rounded-lg px-3 text-xs"
              disabled={isLoading || page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Suivant <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
              disabled={isLoading || page >= totalPages} onClick={() => setPage(totalPages)} aria-label="Dernière page">
              <ChevronLast className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

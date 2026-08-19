"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  PackageCheck,
  Plus,
  ScrollText,
  Search,
  User,
} from "lucide-react"
import { listDocumentsSortieGrouped } from "@/app/actions/pharmacie-sortie"
import { SortieDetailPanel } from "@/components/pharmacie/sortie-detail-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type {
  DocumentSortieGroup,
  PharmacieAccessible,
  SortiesGroupedResult,
} from "@/lib/types/pharmacie-sortie"

type StatutFilter = "all" | DocumentSortieGroup["statutService"]

function statutServiceLabel(statut: DocumentSortieGroup["statutService"]) {
  if (statut === "A_SERVIR") return "À servir"
  if (statut === "PARTIELLE") return "Partielle"
  return "Complète"
}

function statutServiceClass(statut: DocumentSortieGroup["statutService"]) {
  if (statut === "A_SERVIR") return "bg-amber-50 text-amber-700 border-amber-100"
  if (statut === "PARTIELLE") return "bg-sky-50 text-sky-700 border-sky-100"
  return "bg-emerald-50 text-emerald-700 border-emerald-100"
}

function DocumentGroupCard({ group }: { group: DocumentSortieGroup }) {
  const [open, setOpen] = React.useState(group.statutService !== "COMPLETE")
  const [expandedSortieId, setExpandedSortieId] = React.useState<string | null>(null)

  const TypeIcon = group.type === "FACTURE" ? FileText : ScrollText

  function toggleSortieDetail(sortieId: string) {
    setExpandedSortieId((current) => (current === sortieId ? null : sortieId))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-white transition-colors hover:border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-3.5 sm:px-6 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              group.type === "FACTURE"
                ? "bg-[#cd3b86]/[0.08] text-[#cd3b86]"
                : "bg-emerald-50 text-emerald-600",
            )}
          >
            <TypeIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {group.documentNumero}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md border px-1.5 py-0 text-[11px] font-medium",
                  group.type === "FACTURE"
                    ? "border-[#cd3b86]/15 bg-[#cd3b86]/[0.06] text-[#cd3b86]"
                    : "border-emerald-100 bg-emerald-50/80 text-emerald-700",
                )}
              >
                {group.type === "FACTURE" ? "Facture" : "Feuille"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md border px-1.5 py-0 text-[11px] font-medium",
                  statutServiceClass(group.statutService),
                )}
              >
                {statutServiceLabel(group.statutService)}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 opacity-60" />
                {group.patientLabel ?? `Patient #${group.patientId}`}
              </span>
              {group.encaissementNumero && <span>Reçu {group.encaissementNumero}</span>}
              {group.type === "FACTURE" && group.feuilleNumero && (
                <span>
                  Feuille{group.feuilleNumero.includes(",") ? "s" : ""} {group.feuilleNumero}
                </span>
              )}
              {group.type === "FEUILLE" && group.feuilleNumero && (
                <span>Feuille {group.feuilleNumero}</span>
              )}
              {group.statutService !== "COMPLETE" && (
                <span className="text-amber-700/90">
                  {group.nbProduitsRestants} produit
                  {group.nbProduitsRestants > 1 ? "s" : ""} restant
                  {group.nbProduitsRestants > 1 ? "s" : ""}
                </span>
              )}
              {group.sorties.length > 0 && (
                <span>
                  {group.sorties.length} sortie{group.sorties.length > 1 ? "s" : ""}
                </span>
              )}
              {group.derniereActivite && (
                <span className="inline-flex items-center gap-1 text-muted-foreground/80">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(group.derniereActivite)}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {group.statutService !== "COMPLETE" && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-[#cd3b86]/25 text-[#cd3b86] hover:bg-[#cd3b86]/[0.06] hover:text-[#b8307a]"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={`/pharmacie/sorties/nouvelle?ref=${encodeURIComponent(group.referenceSortie)}`}
                >
                  Servir
                </Link>
              </Button>
            )}
            <span className="text-muted-foreground/70">
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </div>
        </div>
      </button>

      {open && group.sorties.length > 0 && (
        <div className="border-t border-border/50 bg-muted/20">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="h-9 pl-5 text-xs font-medium text-muted-foreground">
                  N° sortie
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Pharmacie
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Statut
                </TableHead>
                <TableHead className="h-9 text-center text-xs font-medium text-muted-foreground">
                  Lignes
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Par
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody striped={false}>
              {group.sorties.map((s) => (
                <React.Fragment key={s.id}>
                  <TableRow
                    className={cn(
                      "cursor-pointer border-border/40 hover:bg-muted/40",
                      expandedSortieId === s.id && "bg-[#cd3b86]/[0.03]",
                    )}
                    onClick={() => toggleSortieDetail(s.id)}
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground/60">
                          {expandedSortieId === s.id ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <Link
                          href={`/pharmacie/sorties/${s.id}`}
                          className="text-sm font-medium text-[#cd3b86] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {s.numero}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.pharmacieNom}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-md border px-1.5 py-0 text-[11px] font-medium",
                          s.statut === "COMPLETE"
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border-amber-100 bg-amber-50 text-amber-700",
                        )}
                      >
                        {s.statut === "COMPLETE" ? "Complète" : "Partielle"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                      {s.nbLignes}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.userNom}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.createdAt ? formatDateTime(s.createdAt) : "—"}
                    </TableCell>
                  </TableRow>
                  {expandedSortieId === s.id && (
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableCell colSpan={6} className="bg-muted/30 p-0">
                        <SortieDetailPanel sortieId={s.id} compact />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {open && group.sorties.length === 0 && group.statutService !== "COMPLETE" && (
        <div className="border-t border-border/50 px-6 py-8 text-center">
          <PackageCheck className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
          <p className="text-sm text-foreground">Aucune sortie enregistrée</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dispensez les produits via le bouton « Servir ».
          </p>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="mt-4 rounded-lg border-[#cd3b86]/25 text-[#cd3b86] hover:bg-[#cd3b86]/[0.06]"
          >
            <Link
              href={`/pharmacie/sorties/nouvelle?ref=${encodeURIComponent(group.referenceSortie)}`}
            >
              Servir maintenant
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

const STATUT_FILTERS: { value: StatutFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "A_SERVIR", label: "À servir" },
  { value: "PARTIELLE", label: "Partielle" },
  { value: "COMPLETE", label: "Complète" },
]

export function SortiesClient({
  initial,
}: {
  initial: SortiesGroupedResult
}) {
  const [pharmacies] = React.useState<PharmacieAccessible[]>(initial.pharmacies)
  const [pharmacieId, setPharmacieId] = React.useState(
    initial.defaultPharmacieId ?? "all",
  )
  const [groups, setGroups] = React.useState<DocumentSortieGroup[]>(initial.groups)
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [statutFilter, setStatutFilter] = React.useState<StatutFilter>("A_SERVIR")

  const showPharmacieFilter = pharmacies.length > 1

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    void listDocumentsSortieGrouped(pharmacieId === "all" ? undefined : pharmacieId)
      .then((res) => {
        if (!cancelled) setGroups(res.groups)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pharmacieId])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return groups.filter((g) => {
      if (statutFilter !== "all" && g.statutService !== statutFilter) return false
      if (!q) return true
      return (
        g.documentNumero.toLowerCase().includes(q) ||
        (g.patientLabel?.toLowerCase().includes(q) ?? false) ||
        (g.encaissementNumero?.toLowerCase().includes(q) ?? false) ||
        (g.factureNumero?.toLowerCase().includes(q) ?? false) ||
        (g.feuilleNumero?.toLowerCase().includes(q) ?? false) ||
        g.sorties.some((s) => s.numero.toLowerCase().includes(q))
      )
    })
  }, [groups, search, statutFilter])

  const stats = React.useMemo(() => {
    const aServir = groups.filter((g) => g.statutService === "A_SERVIR").length
    const partielle = groups.filter((g) => g.statutService === "PARTIELLE").length
    const complete = groups.filter((g) => g.statutService === "COMPLETE").length
    const totalSorties = groups.reduce((s, g) => s + g.sorties.length, 0)
    return { aServir, partielle, complete, totalSorties }
  }, [groups])

  const kpis = [
    { label: "Documents", value: filtered.length.toString(), icon: PackageCheck },
    { label: "À servir", value: stats.aServir.toString(), icon: Clock },
    { label: "En cours", value: stats.partielle.toString(), icon: ScrollText },
    { label: "Sorties", value: stats.totalSorties.toString(), icon: CheckCircle2 },
  ]

  function selectPharmacie(id: string) {
    setPharmacieId(id)
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sorties produits
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Feuilles de circulation et factures — dispensation pharmacie
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="gap-1.5 rounded-lg">
            <Link href="/pharmacie/sorties/medicaments-sortis">
              <PackageCheck className="h-4 w-4" />
              Médicaments sortis
            </Link>
          </Button>
          <Button
            asChild
            className="gap-1.5 rounded-lg bg-[#cd3b86] hover:bg-[#b8307a] text-white"
          >
            <Link href="/pharmacie/sorties/nouvelle">
              <Plus className="h-4 w-4" />
              Valider une sortie
            </Link>
          </Button>
        </div>
      </div>

      {pharmacies.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {kpis.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                    {value}
                  </p>
                </div>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Pharmacie</p>
                {showPharmacieFilter ? (
                  <Select value={pharmacieId} onValueChange={setPharmacieId}>
                    <SelectTrigger className="h-9 w-full rounded-lg border-border/80 sm:w-[280px]">
                      <SelectValue placeholder="Choisir une pharmacie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les pharmacies</SelectItem>
                      {pharmacies.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom} · {p.magasinNom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-foreground">
                    {pharmacies[0]!.nom}
                    <span className="text-muted-foreground">
                      {" "}
                      · {pharmacies[0]!.magasinNom}
                    </span>
                  </p>
                )}
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Patient, feuille, facture, reçu, n° sortie…"
                  className="h-9 rounded-lg border-border/80 pl-9"
                />
              </div>
            </div>

            {showPharmacieFilter && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => selectPharmacie("all")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-sm transition-colors",
                    pharmacieId === "all"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  Toutes
                </button>
                {pharmacies.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPharmacie(p.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-sm transition-colors",
                      pharmacieId === p.id
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {p.nom}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-3">
              {STATUT_FILTERS.map(({ value, label }) => {
                const count =
                  value === "all"
                    ? groups.length
                    : groups.filter((g) => g.statutService === value).length
                const active = statutFilter === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatutFilter(value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors",
                      active
                        ? "bg-[#cd3b86]/[0.08] text-[#cd3b86]"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        "tabular-nums text-xs",
                        active ? "text-[#cd3b86]/80" : "text-muted-foreground/70",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {pharmacies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
          <PackageCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Aucune pharmacie accessible</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Affectez une pharmacie à votre compte ou contactez un administrateur.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#cd3b86]" />
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 py-16 text-center">
          <PackageCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Aucun document trouvé</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || statutFilter !== "all"
              ? "Aucun résultat pour ces filtres."
              : "Aucune feuille ou facture avec produits pharmacie en attente."}
          </p>
          {(search || statutFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg"
              onClick={() => {
                setSearch("")
                setStatutFilter("all")
              }}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="px-0.5 text-sm text-muted-foreground">
            {filtered.length} document{filtered.length > 1 ? "s" : ""}
            {stats.aServir > 0 && statutFilter === "all" && (
              <>
                {" "}
                · <span className="text-amber-700">{stats.aServir} à servir</span>
              </>
            )}
          </p>
          {filtered.map((group) => (
            <DocumentGroupCard key={group.groupKey} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}

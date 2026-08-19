"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  FileText,
  Loader2,
  FolderTree,
  Layers,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Sparkles,
  Eye,
  Filter,
  RefreshCw,
  Shield,
} from "lucide-react"
import {
  useActesList,
  useCategoriesList,
  useActeMutations,
  useCategorieMutations,
} from "@/hooks/use-actes"
import { useAssurancesList } from "@/hooks/use-assurances"
import { formatCurrency } from "@/lib/formatting"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ActeEditDialog } from "@/components/actes/acte-edit-dialog"
import { CategorieIcon } from "@/components/shared/categorie-icon"

type ActeRow = {
  id: string
  nom: string
  codeBase?: string | null
  coefficient: number
  valeurFixe?: number | null
  prixHnc?: string | null
  imputeAssurance?: number | null
  typeActe?: string | null
  categorie: { id: string; nom: string }
  assureur?: { id: string; nom: string } | null
}

type CatRow = { id: string; nom: string }

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

const PAGE_SIZES = [10, 20, 50] as const

function KpiStat({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  color: string
  sub?: string
}) {
  return (
    <div
      className={`${cardSurface} px-5 py-4 flex items-center justify-between gap-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]`}
    >
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-[26px] font-extrabold leading-none tracking-tight text-gray-800 tabular-nums">
          {value}
        </p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
      </div>
      <div
        className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
    </div>
  )
}

export default function ActesConfigPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQ, setDebouncedQ] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("all")
  const [selectedAssureur, setSelectedAssureur] = React.useState("all")
  const [typeActeFilter, setTypeActeFilter] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState<number>(20)

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedQ, selectedCategory, selectedAssureur, typeActeFilter])

  const skip = (page - 1) * pageSize

  const filters = React.useMemo(
    () => ({
      q: debouncedQ,
      categorieId: selectedCategory,
      assureurId: selectedAssureur,
      typeActe: typeActeFilter.trim() || undefined,
      skip,
      take: pageSize,
    }),
    [debouncedQ, selectedCategory, selectedAssureur, typeActeFilter, skip, pageSize],
  )

  const { data: listData, isLoading, error } = useActesList(filters)
  const items = (listData?.items ?? []) as unknown as ActeRow[]
  const total = listData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const rangeFrom = total === 0 ? 0 : skip + 1
  const rangeTo = Math.min(skip + pageSize, total)

  const { data: catRaw } = useCategoriesList()
  const categories = (catRaw ?? []) as unknown as CatRow[]

  const { data: assurancesRaw } = useAssurancesList()
  const assurances = assurancesRaw ?? []

  const { create, update, remove } = useActeMutations()
  const {
    create: createCat,
    update: updateCat,
    remove: removeCat,
  } = useCategorieMutations()

  const [acteDialog, setActeDialog] = React.useState<
    null | { mode: "create" } | { mode: "edit"; row: ActeRow }
  >(null)

  const [catDialog, setCatDialog] = React.useState<
    null | { mode: "create" } | { mode: "edit"; row: CatRow }
  >(null)
  const [catNom, setCatNom] = React.useState("")

  const [deleteActeId, setDeleteActeId] = React.useState<string | null>(null)
  const [deleteCatId, setDeleteCatId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!catDialog) return
    if (catDialog.mode === "create") {
      setCatNom("")
    } else {
      setCatNom(catDialog.row.nom)
    }
  }, [catDialog])

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    selectedAssureur !== "all" ||
    typeActeFilter !== ""

  const activeFilterCount = [
    searchQuery !== "",
    selectedCategory !== "all",
    selectedAssureur !== "all",
    typeActeFilter !== "",
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedAssureur("all")
    setTypeActeFilter("")
  }

  function openCreateActe() {
    if (categories.length === 0) {
      toast.error("Créez d'abord une catégorie d'actes.")
      return
    }
    setActeDialog({ mode: "create" })
  }

  async function confirmDeleteActe() {
    if (!deleteActeId) return
    try {
      await remove.mutateAsync(deleteActeId)
      toast.success("Acte supprimé.")
      setDeleteActeId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function submitCat() {
    if (!catNom.trim()) {
      toast.error("Nom requis.")
      return
    }
    try {
      if (catDialog?.mode === "create") {
        await createCat.mutateAsync({ nom: catNom.trim() })
        toast.success("Catégorie créée.")
      } else if (catDialog?.mode === "edit") {
        await updateCat.mutateAsync({ id: catDialog.row.id, nom: catNom.trim() })
        toast.success("Catégorie mise à jour.")
      }
      setCatDialog(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDeleteCat() {
    if (!deleteCatId) return
    try {
      await removeCat.mutateAsync(deleteCatId)
      toast.success("Catégorie supprimée.")
      setDeleteCatId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible (actes liés ?)")
    }
  }

  const busy =
    create.isPending ||
    update.isPending ||
    remove.isPending ||
    createCat.isPending ||
    updateCat.isPending ||
    removeCat.isPending

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Configuration
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#525252]">
              Actes médicaux
            </h1>
            <p className="max-w-2xl text-sm text-gray-500 leading-relaxed">
              Référentiel facturable : catégories, conventions assureur et catalogue
              filtrable en temps réel.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-xl border-gray-200 bg-white text-gray-700 hover:border-[#cd3b86]/40 hover:bg-pink-50/50 hover:text-[#cd3b86] transition-all duration-200"
              type="button"
              onClick={() => setCatDialog({ mode: "create" })}
            >
              <FolderTree className="h-4 w-4" />
              Nouvelle catégorie
            </Button>
            <Button
              className="h-10 gap-2 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white shadow-sm transition-all duration-200"
              type="button"
              onClick={openCreateActe}
            >
              <Plus className="h-4 w-4" />
              Nouvel acte
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiStat
            icon={Layers}
            label="Résultats catalogue"
            value={isLoading ? "—" : total}
            color="#cd3b86"
            sub="Selon filtres actuels"
          />
          <KpiStat
            icon={FolderTree}
            label="Catégories"
            value={categories.length}
            color="#10b981"
            sub="Pour classer les actes"
          />
          <KpiStat
            icon={SlidersHorizontal}
            label="Filtres actifs"
            value={activeFilterCount}
            color="#f59e0b"
            sub={activeFilterCount === 0 ? "Catalogue complet" : undefined}
          />
        </div>

        <Card className={cn(cardSurface)}>
          <CardHeader className="pb-2 border-b border-gray-50">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#525252] uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#cd3b86]" />
                  Catégories
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-1">
                  Regroupement des actes et des filtres — actions au survol.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {categories.length === 0 ? (
              <Empty className="min-h-[140px] rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderTree className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>Aucune catégorie</EmptyTitle>
                  <EmptyDescription>
                    Créez une catégorie (ex. Consultations, Laboratoire) avant
                    d&apos;ajouter des actes.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setCatDialog({ mode: "create" })}
                  >
                    <Plus className="h-4 w-4" />
                    Créer une catégorie
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <ScrollArea className="w-full pb-1">
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="group flex items-center gap-0.5 rounded-full border border-gray-100 bg-white pl-3 pr-1 py-1 shadow-sm transition-all duration-200 hover:border-[#cd3b86]/25 hover:shadow-md"
                    >
                      <span className="flex items-center gap-1.5 max-w-[200px] truncate text-[13px] font-semibold text-gray-700">
                        <CategorieIcon nom={c.nom} className="h-3.5 w-3.5 shrink-0 text-[#cd3b86]" />
                        {c.nom}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 rounded-full text-gray-400 hover:text-[#cd3b86] hover:bg-pink-50"
                            type="button"
                            onClick={() => setCatDialog({ mode: "edit", row: c })}
                            aria-label={`Modifier ${c.nom}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Renommer</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                            type="button"
                            onClick={() => setDeleteCatId(c.id)}
                            aria-label={`Supprimer ${c.nom}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Supprimer</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <span className="font-semibold shrink-0">Erreur</span>
            <span>
              Impossible de charger les actes. Vérifiez la connexion à la base de données.
            </span>
          </div>
        )}

        <Card className={cn(cardSurface)}>
          <CardHeader className="pb-2 border-b border-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold text-[#525252] uppercase tracking-wide flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#cd3b86]" />
                Filtres
              </CardTitle>
              {activeFilterCount > 0 && (
                <span className="text-[11px] font-semibold text-[#cd3b86] bg-pink-50 border border-pink-100 rounded-full px-2.5 py-0.5">
                  {activeFilterCount} actif{activeFilterCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-3 sm:p-4 space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher par libellé d'acte…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 pr-10 rounded-lg border-gray-200 bg-white focus-visible:ring-[#cd3b86]/20"
                  aria-label="Rechercher un acte par libellé"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Catégorie
                  </Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-10 w-full rounded-lg border-gray-200 bg-white">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            <CategorieIcon nom={c.nom} className="h-3.5 w-3.5 text-gray-500" />
                            {c.nom}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Assureur
                  </Label>
                  <Select value={selectedAssureur} onValueChange={setSelectedAssureur}>
                    <SelectTrigger className="h-10 w-full rounded-lg border-gray-200 bg-white">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les assureurs</SelectItem>
                      <SelectItem value="none">Sans rattachement assureur</SelectItem>
                      {assurances.map((a) => (
                        <SelectItem key={String(a.id)} value={String(a.id)}>
                          {a.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Type d&apos;acte
                  </Label>
                  <Input
                    placeholder="Ex. consultation, analyse…"
                    value={typeActeFilter}
                    onChange={(e) => setTypeActeFilter(e.target.value)}
                    className="h-10 rounded-lg border-gray-200 bg-white"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 gap-1.5 text-xs text-gray-500 hover:text-[#cd3b86] hover:bg-pink-50 rounded-lg"
                    type="button"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Réinitialiser
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-[0_1px_8px_rgba(0,0,0,0.05)]">
          <p className="text-sm text-gray-600">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#cd3b86]" />
                Chargement du catalogue…
              </span>
            ) : total === 0 ? (
              <span className="text-gray-500">Aucun résultat pour ces critères</span>
            ) : (
              <>
                <span className="font-bold text-gray-800 tabular-nums">{total}</span>
                <span className="text-gray-500">
                  {" "}
                  acte{total > 1 ? "s" : ""} — affichage{" "}
                  <span className="font-semibold text-gray-700">
                    {rangeFrom}–{rangeTo}
                  </span>
                </span>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Par page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 w-[88px] rounded-lg border-gray-200 bg-gray-50/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className={cn(cardSurface, "overflow-hidden")}>
          <CardHeader className="border-b border-gray-50 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm font-bold text-[#525252] uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#cd3b86]" />
                Catalogue des actes
              </CardTitle>
              {!isLoading && total > 0 && (
                <p className="text-[11px] font-semibold text-gray-400">
                  Page {page} / {totalPages}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 hover:bg-transparent bg-gray-50/90">
                  <TableHead className="w-[min(280px,40%)] text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                    Libellé
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                    Catégorie
                  </TableHead>
                  <TableHead className="hidden xl:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                    Code base
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                    Coef.
                  </TableHead>
                  <TableHead className="text-right hidden sm:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                    Valeur fixe
                  </TableHead>
                  <TableHead className="text-right hidden sm:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                    Prix HNC
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                    Type
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-[11px] font-bold text-gray-500 uppercase tracking-wide py-3">
                    Assureur
                  </TableHead>
                  <TableHead className="w-[52px] text-right py-3">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#cd3b86]" />
                      <p className="mt-2 text-sm text-gray-500">
                        Chargement des actes…
                      </p>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <Empty className="min-h-[220px] border-0">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <FileText className="text-muted-foreground" />
                          </EmptyMedia>
                          <EmptyTitle>Aucun acte à afficher</EmptyTitle>
                          <EmptyDescription>
                            {hasActiveFilters
                              ? "Ajustez les filtres ou réinitialisez-les pour voir plus de résultats."
                              : "Ajoutez votre premier acte au catalogue ou créez des catégories."}
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent className="flex-row flex-wrap justify-center gap-2">
                          {hasActiveFilters ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearFilters}
                            >
                              Réinitialiser les filtres
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            className="bg-[#cd3b86] hover:bg-[#b8307a]"
                            onClick={openCreateActe}
                            disabled={categories.length === 0}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Nouvel acte
                          </Button>
                        </EmptyContent>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((acte, rowIdx) => (
                    <TableRow
                      key={acte.id}
                      className={cn(
                        "border-b border-gray-50 transition-colors duration-200 hover:bg-[#cd3b86]/[0.04]",
                        rowIdx % 2 === 1 && "bg-gray-50/40",
                      )}
                    >
                      <TableCell className="align-top max-w-[min(100%,22rem)] whitespace-normal py-3">
                        <div className="space-y-1">
                          <Link
                            href={`/configuration/actes/${acte.id}`}
                            className="font-semibold leading-snug text-gray-800 hover:text-[#cd3b86] transition-colors duration-200 whitespace-pre-wrap break-words"
                          >
                            {acte.nom}
                          </Link>
                          <div className="md:hidden flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[10px] font-medium border-gray-200 gap-1">
                              <CategorieIcon nom={acte.categorie.nom} className="h-3 w-3" />
                              {acte.categorie.nom}
                            </Badge>
                            {acte.assureur && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] font-medium gap-0.5 max-w-[12rem] truncate"
                              >
                                <Shield className="h-3 w-3 shrink-0" />
                                {acte.assureur.nom}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell align-top py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                          <CategorieIcon nom={acte.categorie.nom} className="h-3.5 w-3.5 text-gray-500" />
                          {acte.categorie.nom}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell align-top font-sans text-xs text-gray-600 py-3">
                        {acte.codeBase ?? (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top tabular-nums text-sm font-medium text-gray-700 py-3">
                        {acte.coefficient}
                      </TableCell>
                      <TableCell className="text-right align-top tabular-nums text-sm hidden sm:table-cell py-3">
                        {acte.valeurFixe != null ? (
                          formatCurrency(Number(acte.valeurFixe))
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top tabular-nums text-sm hidden sm:table-cell py-3">
                        {acte.prixHnc ? (
                          formatCurrency(Number(acte.prixHnc))
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell align-top text-sm text-gray-600 py-3">
                        {acte.typeActe ?? (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell align-top py-3 max-w-[10rem]">
                        {acte.assureur ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full max-w-full truncate"
                            title={acte.assureur.nom}
                          >
                            <Shield className="h-3 w-3 shrink-0" />
                            <span className="truncate">{acte.assureur.nom}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-700 opacity-70 hover:opacity-100"
                              aria-label={`Actions pour ${acte.nom.replace(/\n/g, " ")}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem asChild>
                              <Link href={`/configuration/actes/${acte.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir le détail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setActeDialog({ mode: "edit", row: acte })
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteActeId(acte.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {total > 0 && (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-[0_1px_8px_rgba(0,0,0,0.05)]">
            <p className="text-sm text-gray-500 order-2 sm:order-1">
              Page{" "}
              <span className="font-semibold text-gray-800 tabular-nums">{page}</span> sur{" "}
              <span className="tabular-nums">{totalPages}</span>
            </p>
            <div className="order-1 flex flex-wrap items-center justify-center gap-1 sm:order-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-gray-200"
                disabled={isLoading || page <= 1}
                onClick={() => setPage(1)}
                aria-label="Première page"
              >
                <ChevronFirst className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-gray-200"
                disabled={isLoading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                const p = start + i
                return p <= totalPages ? (
                  <Button
                    key={p}
                    type="button"
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 min-w-8 px-2 rounded-lg text-xs font-semibold",
                      p === page && "bg-[#cd3b86] hover:bg-[#b8307a] border-0",
                    )}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ) : null
              })}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-gray-200"
                disabled={isLoading || page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-gray-200"
                disabled={isLoading || page >= totalPages}
                onClick={() => setPage(totalPages)}
                aria-label="Dernière page"
              >
                <ChevronLast className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        <ActeEditDialog
          open={!!acteDialog}
          onOpenChange={(open) => !open && setActeDialog(null)}
          mode={acteDialog?.mode ?? "create"}
          initialActe={acteDialog?.mode === "edit" ? acteDialog.row : null}
          categories={categories}
          assurances={assurances}
          isPending={create.isPending || update.isPending}
          onSave={async (payload) => {
            try {
              if (acteDialog?.mode === "create") {
                await create.mutateAsync(payload)
                toast.success("Acte créé.")
              } else if (acteDialog?.mode === "edit") {
                await update.mutateAsync({
                  id: acteDialog.row.id,
                  ...payload,
                })
                toast.success("Acte mis à jour.")
              }
              setActeDialog(null)
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Erreur")
            }
          }}
        />

        <Dialog open={!!catDialog} onOpenChange={(o) => !o && setCatDialog(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl border-gray-100">
            <div className="h-0.5 w-full -mt-2 mb-2 rounded-full bg-gradient-to-r from-[#cd3b86] to-[#e06bb0]" />
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#525252]">
                {catDialog?.mode === "edit"
                  ? "Renommer la catégorie"
                  : "Nouvelle catégorie"}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Nom affiché dans les filtres et le catalogue des actes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="cat-nom" className="text-xs font-semibold text-gray-500">
                Nom
              </Label>
              <Input
                id="cat-nom"
                value={catNom}
                onChange={(e) => setCatNom(e.target.value)}
                placeholder="Ex. Consultations"
                className="rounded-xl border-gray-200"
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                type="button"
                className="rounded-xl border-gray-200"
                onClick={() => setCatDialog(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                onClick={() => void submitCat()}
                disabled={busy}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteActeId} onOpenChange={() => setDeleteActeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cet acte ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est définitive. Les factures ou visites qui référencent
                déjà cet acte peuvent être impactées selon votre logique métier.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => void confirmDeleteActe()}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteCatId} onOpenChange={() => setDeleteCatId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
              <AlertDialogDescription>
                Impossible si des actes sont encore classés dans cette catégorie.
                Supprimez ou reclasser les actes concernés avant.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => void confirmDeleteCat()}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}

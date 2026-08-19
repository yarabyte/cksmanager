"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/dialog"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import {
  ProduitFormFields,
  type ProduitFormState,
} from "@/components/configuration/produit-form-fields"
import { ProduitFormDialogShell } from "@/components/configuration/produit-form-dialog-shell"
import {
  ArrowLeft,
  Package,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Filter,
  X,
  CheckCircle2,
  CircleOff,
} from "lucide-react"
import {
  useProduitsList,
  useProduitMutations,
  useConditionnementsList,
  useFormesGaleniquesList,
} from "@/hooks/use-pharmacie"
import { useAssurancesList } from "@/hooks/use-assurances"
import { formatCurrency } from "@/lib/formatting"
import {
  produitSitePharmaLabels,
  produitSitePharmaBadgeClass,
  type ProduitSitePharma,
} from "@/lib/validations/pharmacie"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

const PAGE_SIZES = [10, 20, 50] as const

type ProduitRow = {
  id: string
  nom: string
  principeActif?: string | null
  codeCip?: string | null
  dosage: string
  qteParConditionnement: number
  prixAchatRef: string
  prixVenteRef: string
  hnc?: string | null
  qteAlerte: number
  actif: boolean
  sitePharma?: ProduitSitePharma
  formeGalenique: { id: string; libelle: string }
  conditionnement: { id: string; libelle: string }
  assureur?: { id: string; nom: string } | null
}

type RefRow = { id: string; libelle: string }

function money(s: string | undefined | null): string {
  if (s == null || s === "") return "—"
  const n = Number(s)
  if (Number.isNaN(n)) return s
  return formatCurrency(n)
}

export default function ProduitsPharmaciePage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQ, setDebouncedQ] = React.useState("")
  const [formeId, setFormeId] = React.useState("all")
  const [condId, setCondId] = React.useState("all")
  const [assureurId, setAssureurId] = React.useState("all")
  const [actifFilter, setActifFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState<number>(20)

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedQ, formeId, condId, assureurId, actifFilter])

  const skip = (page - 1) * pageSize

  const filters = React.useMemo(
    () => ({
      q: debouncedQ,
      formeId,
      condId,
      assureurId,
      actif: actifFilter === "all" ? undefined : actifFilter,
      skip,
      take: pageSize,
    }),
    [debouncedQ, formeId, condId, assureurId, actifFilter, skip, pageSize],
  )

  const { data: listData, isLoading, error } = useProduitsList(filters)
  const items = (listData?.items ?? []) as unknown as ProduitRow[]
  const total = listData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const rangeFrom = total === 0 ? 0 : skip + 1
  const rangeTo = Math.min(skip + pageSize, total)

  const { data: condRaw } = useConditionnementsList()
  const { data: formeRaw } = useFormesGaleniquesList()
  const { data: assurancesRaw } = useAssurancesList()

  const conditionnements = (condRaw ?? []) as unknown as RefRow[]
  const formes = (formeRaw ?? []) as unknown as RefRow[]
  const assurances = (assurancesRaw ?? []) as unknown as { id: string; nom: string }[]

  const { create, update, remove } = useProduitMutations()

  const [dialog, setDialog] = React.useState<
    null | { mode: "create" } | { mode: "edit"; row: ProduitRow }
  >(null)
  const [form, setForm] = React.useState<ProduitFormState>({
    nom: "",
    principeActif: "",
    codeCip: "",
    formeGaleniqueId: "",
    dosage: "",
    conditionnementId: "",
    qteParConditionnement: 1,
    prixAchatRef: "0",
    prixVenteRef: "0",
    hnc: "",
    qteAlerte: 0,
    assureurId: "",
    sitePharma: "CKS" as ProduitSitePharma,
    actif: true,
  })
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!dialog) return
    if (dialog.mode === "create") {
      setForm({
        nom: "",
        principeActif: "",
        codeCip: "",
        formeGaleniqueId: formes[0]?.id ?? "",
        dosage: "",
        conditionnementId: conditionnements[0]?.id ?? "",
        qteParConditionnement: 1,
        prixAchatRef: "0",
        prixVenteRef: "0",
        hnc: "",
        qteAlerte: 0,
        assureurId: "",
        sitePharma: "CKS",
        actif: true,
      })
    } else {
      const r = dialog.row
      setForm({
        nom: r.nom,
        principeActif: r.principeActif ?? "",
        codeCip: r.codeCip ?? "",
        formeGaleniqueId: r.formeGalenique.id,
        dosage: r.dosage,
        conditionnementId: r.conditionnement.id,
        qteParConditionnement: r.qteParConditionnement,
        prixAchatRef: String(r.prixAchatRef),
        prixVenteRef: String(r.prixVenteRef),
        hnc: r.hnc ? String(r.hnc) : "",
        qteAlerte: r.qteAlerte,
        assureurId: r.assureur?.id ?? "",
        sitePharma: r.sitePharma ?? "CKS",
        actif: r.actif,
      })
    }
  }, [dialog, formes, conditionnements])

  async function submit() {
    if (!form.nom.trim() || !form.dosage.trim()) {
      toast.error("Nom et dosage requis.")
      return
    }
    if (!form.formeGaleniqueId || !form.conditionnementId) {
      toast.error("Forme et conditionnement requis.")
      return
    }
    try {
      const payload = {
        nom: form.nom.trim(),
        principeActif: form.principeActif.trim() || null,
        codeCip: form.codeCip.trim() || null,
        formeGaleniqueId: form.formeGaleniqueId,
        dosage: form.dosage.trim(),
        conditionnementId: form.conditionnementId,
        qteParConditionnement: form.qteParConditionnement,
        prixAchatRef: form.prixAchatRef.trim() || "0",
        prixVenteRef: form.prixVenteRef.trim() || "0",
        hnc: form.hnc.trim() || null,
        qteAlerte: form.qteAlerte,
        assureurId: form.assureurId.trim() || undefined,
        sitePharma: form.sitePharma,
        actif: form.actif,
      }
      if (dialog?.mode === "create") {
        await create.mutateAsync(payload)
        toast.success("Produit créé.")
      } else if (dialog?.mode === "edit") {
        await update.mutateAsync({ id: dialog.row.id, ...payload })
        toast.success("Produit mis à jour.")
      }
      setDialog(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await remove.mutateAsync(deleteId)
      toast.success("Produit supprimé.")
      setDeleteId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  const busy = create.isPending || update.isPending || remove.isPending

  const hasFilters =
    searchQuery !== "" ||
    formeId !== "all" ||
    condId !== "all" ||
    assureurId !== "all" ||
    actifFilter !== "all"

  const clearFilters = () => {
    setSearchQuery("")
    setFormeId("all")
    setCondId("all")
    setAssureurId("all")
    setActifFilter("all")
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl shrink-0" asChild>
            <Link href="/configuration/pharmacie" aria-label="Retour">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <p className="text-[11px] font-bold text-[#cd3b86] uppercase tracking-widest">
              Configuration · Pharmacie
            </p>
            <h1 className="text-2xl font-bold text-gray-900 font-['DM_Sans',sans-serif] flex items-center gap-2">
              <Package className="h-7 w-7 text-gray-700" />
              Produits
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Catalogue — prix de référence et seuils d’alerte stock.
            </p>
          </div>
        </div>
        <Button
          className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white shrink-0"
          onClick={() => {
            if (!formes.length || !conditionnements.length) {
              toast.error("Chargez d’abord formes et conditionnements.")
              return
            }
            setDialog({ mode: "create" })
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau produit
        </Button>
      </div>

      <div className={cn(cardSurface, "p-4 space-y-4")}>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 rounded-xl bg-gray-50 border-gray-200"
              placeholder="Nom, principe actif, code CIP…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Recherche produits"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Filter className="h-3.5 w-3.5" />
              Filtres
            </div>
            <Select value={formeId} onValueChange={setFormeId}>
              <SelectTrigger className="w-[160px] rounded-xl h-9 text-sm">
                <SelectValue placeholder="Forme" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Toutes formes</SelectItem>
                {formes.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={condId} onValueChange={setCondId}>
              <SelectTrigger className="w-[170px] rounded-xl h-9 text-sm">
                <SelectValue placeholder="Conditionnement" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-64">
                <SelectItem value="all">Tous</SelectItem>
                {conditionnements.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assureurId} onValueChange={setAssureurId}>
              <SelectTrigger className="w-[160px] rounded-xl h-9 text-sm">
                <SelectValue placeholder="Assureur" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-64">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="none">Sans convention</SelectItem>
                {assurances.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actifFilter} onValueChange={setActifFilter}>
              <SelectTrigger className="w-[130px] rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Actif / inactif</SelectItem>
                <SelectItem value="true">Actifs</SelectItem>
                <SelectItem value="false">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl h-9 text-gray-600"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className={cn(cardSurface, "px-4 py-3 text-sm text-red-700 bg-red-50/80")}>
          {error instanceof Error ? error.message : "Erreur"}
        </div>
      )}

      <div className={cn(cardSurface, "overflow-hidden")}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement…
          </div>
        ) : items.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyTitle>Aucun produit</EmptyTitle>
              <EmptyDescription>
                Ajustez les filtres ou créez un produit.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead>Produit</TableHead>
                <TableHead className="hidden xl:table-cell">Forme</TableHead>
                <TableHead className="hidden lg:table-cell">Cond.</TableHead>
                <TableHead className="w-[140px]">Répartition</TableHead>
                <TableHead className="text-right">Prix vente</TableHead>
                <TableHead className="hidden md:table-cell w-24">Alerte</TableHead>
                <TableHead className="w-12 text-center">
                  <span className="sr-only">Statut</span>
                </TableHead>
                <TableHead className="w-14 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r, i) => (
                <TableRow
                  key={r.id}
                  className={cn(i % 2 === 1 && "bg-gray-50/40")}
                >
                  <TableCell>
                    <Link
                      href={`/configuration/pharmacie/produits/${r.id}`}
                      className="font-semibold text-gray-900 hover:text-[#cd3b86] transition-colors"
                    >
                      {r.nom}
                    </Link>
                    {r.principeActif && (
                      <p className="text-xs text-gray-500 mt-0.5">{r.principeActif}</p>
                    )}
                    {r.codeCip && (
                      <p className="text-[11px] font-sans text-gray-400 mt-0.5">
                        CIP {r.codeCip}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-gray-600">
                    {r.formeGalenique.libelle}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                    {r.conditionnement.libelle}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full text-xs font-medium border-0",
                        produitSitePharmaBadgeClass[r.sitePharma ?? "CKS"],
                      )}
                    >
                      {produitSitePharmaLabels[r.sitePharma ?? "CKS"]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-800 font-medium">
                    {money(r.prixVenteRef)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm tabular-nums text-gray-600">
                    {r.qteAlerte}
                  </TableCell>
                  <TableCell className="text-center">
                    {r.actif ? (
                      <CheckCircle2
                        className="h-5 w-5 text-[#58a639] mx-auto"
                        aria-label="Actif"
                      />
                    ) : (
                      <CircleOff
                        className="h-5 w-5 text-gray-300 mx-auto"
                        aria-label="Désactivé"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/configuration/pharmacie/produits/${r.id}`}
                            className="gap-2 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            Fiche
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => setDialog({ mode: "edit", row: r })}
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-red-600 focus:text-red-600"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > 0 && (
        <div
          className={cn(
            cardSurface,
            "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3",
          )}
        >
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{rangeFrom}</span>
            {" – "}
            <span className="font-medium text-gray-700">{rangeTo}</span>
            <span className="mx-1">sur</span>
            <span className="font-medium text-gray-700">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[100px] rounded-xl h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                aria-label="Première page"
              >
                <ChevronFirst className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 px-2 tabular-nums min-w-[4rem] text-center">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                aria-label="Dernière page"
              >
                <ChevronLast className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <ProduitFormDialogShell
          title={dialog?.mode === "edit" ? "Modifier le produit" : "Nouveau produit"}
          description="Tarifs de référence — à adapter selon votre politique interne."
          icon={Package}
          footer={
            <>
              <Button variant="outline" className="rounded-xl" onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button
                className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                disabled={busy}
                onClick={() => void submit()}
              >
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </>
          }
        >
          <ProduitFormFields
            form={form}
            setForm={setForm}
            formes={formes}
            conditionnements={conditionnements}
            assurances={assurances}
            idPrefix="plist"
          />
        </ProduitFormDialogShell>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>Action définitive.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700"
              onClick={() => void confirmDelete()}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

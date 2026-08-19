"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  MoreHorizontal,
  Pill,
  Stethoscope,
} from "lucide-react"
import {
  useKitActe,
  useKitActeMutations,
  useKitActeLigneMutations,
  useActesKitSelect,
  useProduitsKitSelect,
  type KitActeDetailSerializable,
  type KitActeLigneSerializable,
} from "@/hooks/use-kits"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { capitalizeFirstLetter } from "@/lib/formatting"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

type LigneRow = KitActeLigneSerializable

function routeKitId(params: ReturnType<typeof useParams>): string {
  const raw = params?.id
  if (typeof raw === "string") return raw.trim()
  if (Array.isArray(raw)) return (raw[0] ?? "").toString().trim()
  return ""
}

export default function KitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const idParam = routeKitId(params)
  const idForQuery = /^\d+$/.test(idParam) ? idParam : undefined

  const { data: kit, isPending, error, isError, isSuccess } = useKitActe(idForQuery)

  const { update, remove } = useKitActeMutations()
  const { create: createLigne, update: updateLigne, remove: removeLigne } =
    useKitActeLigneMutations()

  const { data: actes = [] } = useActesKitSelect()

  const [prodSearch, setProdSearch] = React.useState("")
  const [debouncedProd, setDebouncedProd] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedProd(prodSearch.trim()), 300)
    return () => clearTimeout(t)
  }, [prodSearch])

  const { data: produits = [] } = useProduitsKitSelect(debouncedProd || undefined)

  const [editKitOpen, setEditKitOpen] = React.useState(false)
  const [kitForm, setKitForm] = React.useState({ nom: "", description: "", actif: true })
  const [deleteKitOpen, setDeleteKitOpen] = React.useState(false)

  const [ligneDialog, setLigneDialog] = React.useState<
    null | { mode: "create" } | { mode: "edit"; row: LigneRow }
  >(null)
  const [ligneForm, setLigneForm] = React.useState({
    typeLigne: "PHARMA" as "ACTE" | "PHARMA",
    acteId: "",
    produitId: "",
    quantite: 1,
    remiseUnitaire: "0",
    position: 0,
  })
  const [deleteLigneId, setDeleteLigneId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!kit || !editKitOpen) return
    setKitForm({
      nom: kit.nom,
      description: kit.description ?? "",
      actif: kit.actif,
    })
  }, [kit, editKitOpen])

  React.useEffect(() => {
    if (!ligneDialog || !kit) return
    if (ligneDialog.mode === "create") {
      const nextPos =
        kit.lignes.length > 0
          ? Math.max(...kit.lignes.map((l) => l.position)) + 1
          : 0
      setLigneForm({
        typeLigne: "PHARMA",
        acteId: "",
        produitId: "",
        quantite: 1,
        remiseUnitaire: "0",
        position: nextPos,
      })
      setProdSearch("")
    } else {
      const r = ligneDialog.row
      setLigneForm({
        typeLigne: r.typeLigne === "ACTE" ? "ACTE" : "PHARMA",
        acteId: r.acte?.id ?? "",
        produitId: r.produit?.id ?? "",
        quantite: r.quantite,
        remiseUnitaire: String(r.remiseUnitaire),
        position: r.position,
      })
    }
  }, [ligneDialog, kit])

  async function saveKitMeta() {
    if (!kit) return
    if (!kitForm.nom.trim()) {
      toast.error("Nom requis.")
      return
    }
    try {
      await update.mutateAsync({
        id: kit.id,
        nom: kitForm.nom.trim(),
        description: kitForm.description.trim() || null,
        userId: kit.user.id,
        actif: kitForm.actif,
      })
      toast.success("Kit mis à jour.")
      setEditKitOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDeleteKit() {
    if (!kit) return
    try {
      await remove.mutateAsync(kit.id)
      toast.success("Kit supprimé.")
      router.push("/configuration/kits")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function saveLigne() {
    if (!kit) return
    try {
      if (ligneDialog?.mode === "create") {
        await createLigne.mutateAsync({
          kitActeId: kit.id,
          typeLigne: ligneForm.typeLigne,
          acteId: ligneForm.acteId || null,
          produitId: ligneForm.produitId || null,
          quantite: ligneForm.quantite,
          remiseUnitaire: ligneForm.remiseUnitaire,
          position: ligneForm.position,
        })
        toast.success("Ligne ajoutée.")
      } else if (ligneDialog?.mode === "edit") {
        await updateLigne.mutateAsync({
          id: ligneDialog.row.id,
          kitActeId: kit.id,
          typeLigne: ligneForm.typeLigne,
          acteId: ligneForm.acteId || null,
          produitId: ligneForm.produitId || null,
          quantite: ligneForm.quantite,
          remiseUnitaire: ligneForm.remiseUnitaire,
          position: ligneForm.position,
        })
        toast.success("Ligne mise à jour.")
      }
      setLigneDialog(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDeleteLigne() {
    if (!deleteLigneId) return
    try {
      await removeLigne.mutateAsync(deleteLigneId)
      toast.success("Ligne supprimée.")
      setDeleteLigneId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  const busyKit = update.isPending || remove.isPending
  const busyLigne = createLigne.isPending || updateLigne.isPending || removeLigne.isPending

  if (!idForQuery) {
    return (
      <div className="space-y-6 pb-10">
        <Button variant="ghost" className="rounded-xl -ml-2" asChild>
          <Link href="/configuration/kits">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Liste des kits
          </Link>
        </Button>
        <div className={cn(cardSurface, "px-6 py-10 text-center max-w-md mx-auto")}>
          <p className="text-lg font-bold text-gray-800">Identifiant de kit invalide</p>
          <p className="mt-2 text-sm text-gray-600">
            L’URL doit se terminer par un numéro (ex. <code className="rounded bg-gray-100 px-1">/configuration/kits/23</code>).
          </p>
          <Button asChild className="mt-6 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]">
            <Link href="/configuration/kits">Retour</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-28">
        <Loader2 className="h-10 w-10 animate-spin text-[#cd3b86]" />
        <p className="text-sm text-gray-500">Chargement du kit…</p>
      </div>
    )
  }

  if (isError && error) {
    return (
      <div className="space-y-6 pb-10">
        <Button variant="ghost" className="rounded-xl -ml-2" asChild>
          <Link href="/configuration/kits">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Liste des kits
          </Link>
        </Button>
        <div className={cn(cardSurface, "px-6 py-10 text-center max-w-lg mx-auto")}>
          <LayoutGrid className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-800">Impossible de charger le kit</p>
          <p className="mt-2 text-sm text-gray-600">
            Souvent : schéma Prisma plus récent que la base — exécutez{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">pnpm exec prisma migrate deploy</code>{" "}
            puis rechargez la page.
          </p>
          <p className="mt-3 text-xs text-red-600/90 font-sans break-all">{error.message}</p>
          <Button asChild className="mt-6 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]">
            <Link href="/configuration/kits">Retour</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isSuccess && kit === null) {
    return (
      <div className="space-y-6 pb-10">
        <Button variant="ghost" className="rounded-xl -ml-2" asChild>
          <Link href="/configuration/kits">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Liste des kits
          </Link>
        </Button>
        <div className={cn(cardSurface, "px-6 py-10 text-center")}>
          <LayoutGrid className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-800">Kit introuvable</p>
          <Button asChild className="mt-6 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]">
            <Link href="/configuration/kits">Retour</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!kit) return null

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" className="w-fit rounded-xl -ml-2 text-gray-500" asChild>
          <Link href="/configuration/kits">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kits
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-xl"
            onClick={() => setEditKitOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Modifier le kit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-xl border-red-100 text-red-600"
            onClick={() => setDeleteKitOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-gray-100 bg-white"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      >
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {kit.actif ? (
                  <Badge className="bg-[#58a639] hover:bg-[#58a639]">Actif</Badge>
                ) : (
                  <Badge variant="secondary">Inactif</Badge>
                )}
                <span className="text-xs text-gray-500">
                  {kit.lignes.length} ligne{kit.lignes.length === 1 ? "" : "s"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#525252] break-words leading-snug">
                {capitalizeFirstLetter(kit.nom)}
              </h1>
              {kit.description && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{kit.description}</p>
              )}
              <p className="text-xs text-gray-400">
                Auteur : <span className="font-medium text-gray-600">{kit.user.name}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-500 tracking-wide">
          Lignes du kit
        </h2>
        <Button
          size="sm"
          className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]"
          onClick={() => setLigneDialog({ mode: "create" })}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une ligne
        </Button>
      </div>

      <div className={cn(cardSurface, "overflow-hidden")}>
        {kit.lignes.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">
            Aucune ligne — ajoutez des actes ou des produits pharmacie.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Élément</TableHead>
                <TableHead className="w-24">Qté</TableHead>
                <TableHead className="hidden sm:table-cell w-28">Remise u.</TableHead>
                <TableHead className="w-14 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {kit.lignes.map((l, i) => (
                <TableRow key={l.id} className={cn(i % 2 === 1 && "bg-gray-50/40")}>
                  <TableCell className="tabular-nums text-gray-500">{l.position}</TableCell>
                  <TableCell>
                    {l.typeLigne === "ACTE" ? (
                      <Badge variant="outline" className="gap-1 border-blue-200 text-blue-800">
                        <Stethoscope className="h-3 w-3" />
                        Acte
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-800">
                        <Pill className="h-3 w-3" />
                        Pharmacie
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-900">
                      {l.acte?.nom ?? l.produit?.nom ?? "—"}
                    </span>
                    {l.produit && (
                      <span className="text-xs text-gray-500 block">{l.produit.dosage}</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{l.quantite}</TableCell>
                  <TableCell className="hidden sm:table-cell tabular-nums text-gray-600">
                    {l.remiseUnitaire}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => setLigneDialog({ mode: "edit", row: l })}
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-red-600"
                          onClick={() => setDeleteLigneId(l.id)}
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

      <Dialog open={editKitOpen} onOpenChange={setEditKitOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le kit</DialogTitle>
            <DialogDescription>En-tête et statut.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                className="rounded-xl"
                value={kitForm.nom}
                onChange={(e) => setKitForm((s) => ({ ...s, nom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                className="rounded-xl"
                value={kitForm.description}
                onChange={(e) => setKitForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
              <Label htmlFor="kit-meta-actif">Actif</Label>
              <Switch
                id="kit-meta-actif"
                checked={kitForm.actif}
                onCheckedChange={(v) => setKitForm((s) => ({ ...s, actif: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditKitOpen(false)}>
              Annuler
            </Button>
            <Button
              className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]"
              disabled={busyKit}
              onClick={() => void saveKitMeta()}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ligneDialog} onOpenChange={(o) => !o && setLigneDialog(null)}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {ligneDialog?.mode === "edit" ? "Modifier la ligne" : "Nouvelle ligne"}
            </DialogTitle>
            <DialogDescription>
              Acte médical ou produit pharmacie — quantités pour le parcours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={ligneForm.typeLigne}
                onValueChange={(v) =>
                  setLigneForm((s) => ({ ...s, typeLigne: v as "ACTE" | "PHARMA" }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTE">Acte</SelectItem>
                  <SelectItem value="PHARMA">Pharmacie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {ligneForm.typeLigne === "ACTE" ? (
              <div className="space-y-2">
                <Label>Acte</Label>
                <Select
                  value={ligneForm.acteId || "__none__"}
                  onValueChange={(v) =>
                    setLigneForm((s) => ({ ...s, acteId: v === "__none__" ? "" : v }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choisir un acte" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 rounded-xl">
                    <SelectItem value="__none__">—</SelectItem>
                    {actes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Recherche produit</Label>
                  <Input
                    className="rounded-xl"
                    placeholder="Filtrer la liste…"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Produit</Label>
                  <Select
                    value={ligneForm.produitId || "__none__"}
                    onValueChange={(v) =>
                      setLigneForm((s) => ({ ...s, produitId: v === "__none__" ? "" : v }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 rounded-xl">
                      <SelectItem value="__none__">—</SelectItem>
                      {produits.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom} ({p.dosage})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min={1}
                  className="rounded-xl"
                  value={ligneForm.quantite}
                  onChange={(e) =>
                    setLigneForm((s) => ({
                      ...s,
                      quantite: Number.parseInt(e.target.value, 10) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Position (tri)</Label>
                <Input
                  type="number"
                  min={0}
                  className="rounded-xl"
                  value={ligneForm.position}
                  onChange={(e) =>
                    setLigneForm((s) => ({
                      ...s,
                      position: Number.parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Remise unitaire</Label>
              <Input
                className="rounded-xl tabular-nums"
                value={ligneForm.remiseUnitaire}
                onChange={(e) =>
                  setLigneForm((s) => ({ ...s, remiseUnitaire: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setLigneDialog(null)}>
              Annuler
            </Button>
            <Button
              className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]"
              disabled={busyLigne}
              onClick={() => void saveLigne()}
            >
              {busyLigne && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteKitOpen} onOpenChange={setDeleteKitOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce kit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les lignes seront supprimées définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600"
              disabled={busyKit}
              onClick={() => void confirmDeleteKit()}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteLigneId} onOpenChange={(o) => !o && setDeleteLigneId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette ligne ?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600"
              onClick={() => void confirmDeleteLigne()}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

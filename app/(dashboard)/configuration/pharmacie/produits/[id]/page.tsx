"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  ProduitFormFields,
  type ProduitFormState,
} from "@/components/configuration/produit-form-fields"
import { ProduitFormDialogShell } from "@/components/configuration/produit-form-dialog-shell"
import {
  ArrowLeft,
  Package,
  Loader2,
  Pencil,
  Trash2,
  Sparkles,
  Hash,
  Pill,
  Boxes,
  Building2,
  Banknote,
  AlertTriangle,
} from "lucide-react"
import {
  useProduit,
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

type RefRow = { id: string; libelle: string }

type ProduitDetail = {
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
  createdAt?: string | null
  updatedAt?: string | null
  formeGalenique: RefRow
  conditionnement: RefRow
  assureur?: { id: string; nom: string } | null
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(cardSurface, className)}>{children}</div>
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ElementType
  label: string
}) {
  return (
    <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-gray-50">
      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </h2>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p
          className={cn(
            "text-[15px] font-semibold text-gray-800 mt-1",
            mono && "font-sans text-sm font-medium text-gray-700",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function money(s: string | undefined | null): string {
  if (s == null || s === "") return "—"
  const n = Number(s)
  if (Number.isNaN(n)) return String(s)
  return formatCurrency(n)
}

export default function ProduitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: raw, isPending, error } = useProduit(id)
  const p = raw as ProduitDetail | null | undefined

  const { data: condRaw } = useConditionnementsList()
  const { data: formeRaw } = useFormesGaleniquesList()
  const { data: assurancesRaw } = useAssurancesList()
  const conditionnements = (condRaw ?? []) as unknown as RefRow[]
  const formes = (formeRaw ?? []) as unknown as RefRow[]
  const assurances = (assurancesRaw ?? []) as unknown as { id: string; nom: string }[]

  const { update, remove } = useProduitMutations()

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
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

  React.useEffect(() => {
    if (!p || !editOpen) return
    setForm({
      nom: p.nom,
      principeActif: p.principeActif ?? "",
      codeCip: p.codeCip ?? "",
      formeGaleniqueId: p.formeGalenique.id,
      dosage: p.dosage,
      conditionnementId: p.conditionnement.id,
      qteParConditionnement: p.qteParConditionnement,
      prixAchatRef: String(p.prixAchatRef),
      prixVenteRef: String(p.prixVenteRef),
      hnc: p.hnc ? String(p.hnc) : "",
      qteAlerte: p.qteAlerte,
      assureurId: p.assureur?.id ?? "",
      sitePharma: p.sitePharma ?? "CKS",
      actif: p.actif,
    })
  }, [p, editOpen])

  async function handleSave() {
    if (!p) return
    if (!form.nom.trim() || !form.dosage.trim()) {
      toast.error("Nom et dosage requis.")
      return
    }
    try {
      await update.mutateAsync({
        id: p.id,
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
      })
      toast.success("Produit mis à jour.")
      setEditOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDelete() {
    if (!p) return
    try {
      await remove.mutateAsync(p.id)
      toast.success("Produit supprimé.")
      router.push("/configuration/pharmacie/produits")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  const busy = update.isPending || remove.isPending

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-28">
        <Loader2 className="h-10 w-10 animate-spin text-[#cd3b86]" />
        <p className="text-sm text-gray-500">Chargement du produit…</p>
      </div>
    )
  }

  if (error || p == null) {
    return (
      <div className="space-y-6 pb-10">
        <Button variant="ghost" className="rounded-xl -ml-2" asChild>
          <Link href="/configuration/pharmacie/produits">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Catalogue produits
          </Link>
        </Button>
        <SectionCard>
          <div className="px-6 py-10 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-800">Produit introuvable</p>
            <p className="text-sm text-gray-500 mt-2">
              Cet identifiant n&apos;existe pas ou a été supprimé.
            </p>
            <Button asChild className="mt-6 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]">
              <Link href="/configuration/pharmacie/produits">Retour</Link>
            </Button>
          </div>
        </SectionCard>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" className="w-fit rounded-xl -ml-2 text-gray-500" asChild>
          <Link href="/configuration/pharmacie/produits">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Catalogue produits
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-xl border-gray-200"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-xl border-red-100 text-red-600 hover:bg-red-50"
            onClick={() => setDeleteOpen(true)}
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
        <div className="h-1.5 bg-gradient-to-r from-[#cd3b86] via-[#e06bb0] to-[#cd3b86]/50" />
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                  {p.formeGalenique.libelle}
                </span>
                <Badge variant="outline" className="rounded-full text-xs">
                  {p.conditionnement.libelle}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "rounded-full text-xs border-0",
                    produitSitePharmaBadgeClass[p.sitePharma ?? "CKS"],
                  )}
                >
                  {produitSitePharmaLabels[p.sitePharma ?? "CKS"]}
                </Badge>
                {p.actif ? (
                  <Badge className="bg-[#58a639] hover:bg-[#58a639] rounded-full">Actif</Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full">
                    Inactif
                  </Badge>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#525252] leading-snug">
                {p.nom}
              </h1>
              {p.principeActif && (
                <p className="text-sm text-gray-500">{p.principeActif}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-400">
                <span className="font-sans text-gray-400">#{p.id}</span>
                {p.codeCip && (
                  <>
                    <span className="text-gray-200 hidden sm:inline">•</span>
                    <span className="font-sans">CIP {p.codeCip}</span>
                  </>
                )}
              </div>
            </div>
            {p.assureur ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 shrink-0 max-w-xs">
                <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-emerald-700/80">
                    Convention
                  </p>
                  <p className="text-sm font-semibold text-emerald-900 truncate">{p.assureur.nom}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-500 max-w-xs">
                Sans rattachement assureur.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard>
          <SectionTitle icon={Banknote} label="Tarification de référence" />
          <div className="px-5 pb-2 pt-1 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-400">Prix achat</p>
              <p className="text-lg font-extrabold text-gray-800 tabular-nums mt-1">
                {money(p.prixAchatRef)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-400">Prix vente</p>
              <p className="text-lg font-extrabold text-[#cd3b86] tabular-nums mt-1">
                {money(p.prixVenteRef)}
              </p>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <SectionTitle icon={AlertTriangle} label="Stock & alerte" />
          <div className="px-5 pb-5 pt-3">
            <p className="text-sm text-gray-600">
              Seuil d&apos;alerte rupture :{" "}
              <span className="font-bold text-gray-900 tabular-nums">{p.qteAlerte}</span>{" "}
              (unités par conditionnement selon référentiel).
            </p>
            {p.hnc != null && String(p.hnc).length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                HNC : <span className="font-semibold">{money(p.hnc)}</span>
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <SectionTitle icon={Sparkles} label="Détails" />
        <div className="pb-2">
          <InfoRow icon={Pill} label="Dosage / présentation" value={p.dosage} />
          <InfoRow
            icon={Hash}
            label="Quantité par conditionnement"
            value={String(p.qteParConditionnement)}
            mono
          />
          <InfoRow icon={Boxes} label="Conditionnement" value={p.conditionnement.libelle} />
          <InfoRow icon={Package} label="Forme galénique" value={p.formeGalenique.libelle} />
        </div>
      </SectionCard>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <ProduitFormDialogShell
          title="Modifier le produit"
          description="Tarifs et rattachements du produit au catalogue."
          icon={Package}
          footer={
            <>
              <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
              <Button
                className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                disabled={busy}
                onClick={() => void handleSave()}
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
            idPrefix="pdetail"
          />
        </ProduitFormDialogShell>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>Action définitive.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

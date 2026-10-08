"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  ArrowLeft,
  Building2,
  FileText,
  Hash,
  Loader2,
  Pencil,
  Percent,
  Trash2,
  Shield,
  Sparkles,
  Calculator,
} from "lucide-react"
import { useActe, useActeMutations, useCategoriesList } from "@/hooks/use-actes"
import { useAssurancesList } from "@/hooks/use-assurances"
import { formatCurrency } from "@/lib/formatting"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  ActeEditDialog,
  type ActeRowLike,
  type ActeSavePayload,
} from "@/components/actes/acte-edit-dialog"
import { acteTypeLabels, normalizeActeType } from "@/lib/validations/acte"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

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

export default function ActeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: raw, isPending, error } = useActe(id)
  const acte = raw as ActeRowLike | null | undefined

  const { data: catRaw } = useCategoriesList()
  const categories = (catRaw ?? []) as unknown as { id: string; nom: string }[]

  const { data: assurancesRaw } = useAssurancesList()
  const assurances = assurancesRaw ?? []

  const { update, remove } = useActeMutations()

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const busy = update.isPending || remove.isPending

  async function handleSaveWrapper(payload: ActeSavePayload) {
    try {
      await update.mutateAsync({
        id,
        ...payload,
      })
      toast.success("Acte mis à jour.")
      setEditOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function confirmDelete() {
    try {
      await remove.mutateAsync(id)
      toast.success("Acte supprimé.")
      router.push("/configuration/actes")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-28">
        <Loader2 className="h-10 w-10 animate-spin text-[#cd3b86]" />
        <p className="text-sm text-gray-500">Chargement de l&apos;acte…</p>
      </div>
    )
  }

  if (error || acte == null) {
    return (
      <div className="space-y-6 pb-12 max-w-lg">
        <button
          type="button"
          onClick={() => router.push("/configuration/actes")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </button>
        <SectionCard>
          <div className="px-6 py-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-lg font-bold text-gray-800">Acte introuvable</p>
            <p className="text-sm text-gray-500 mt-2">
              Cet identifiant n&apos;existe pas ou a été supprimé.
            </p>
            <Button asChild className="mt-6 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]">
              <Link href="/configuration/actes">Retour au catalogue</Link>
            </Button>
          </div>
        </SectionCard>
      </div>
    )
  }

  const refActe = `ACT-${acte.id.padStart(5, "0")}`

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push("/configuration/actes")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Catalogue des actes
        </button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-xl border-gray-200 bg-white hover:border-[#cd3b86]/40 hover:bg-pink-50/50 hover:text-[#cd3b86]"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Hero */}
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
                  {acte.categorie.nom}
                </span>
                <Badge variant="outline" className="text-xs font-medium border-gray-200 rounded-full">
                  {acteTypeLabels[normalizeActeType(acte.typeActe)]}
                </Badge>
                {acte.exonerePartPatient ? (
                  <Badge variant="outline" className="text-xs font-medium border-blue-200 text-blue-800 rounded-full">
                    Exonéré de la part patient
                  </Badge>
                ) : null}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#525252] leading-snug whitespace-pre-wrap break-words">
                {acte.nom}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-400">
                <span className="font-sans text-gray-300">#{acte.id}</span>
                <span className="text-gray-200 hidden sm:inline">•</span>
                <span className="font-sans font-medium text-gray-500">{refActe}</span>
              </div>
            </div>
            {acte.assureur ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 shrink-0 max-w-[min(100%,16rem)]">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700/80">
                    Convention
                  </p>
                  <p className="text-sm font-semibold text-emerald-900 truncate" title={acte.assureur.nom}>
                    {acte.assureur.nom}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-500 max-w-xs">
                Aucun assureur — tarif hors convention.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard>
          <SectionTitle icon={Building2} label="Assureur conventionné" />
          <div className="px-5 pb-5 pt-3">
            {acte.assureur ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800">{acte.assureur.nom}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Rattachement pour tarification négociée.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 leading-relaxed">
                Aucun rattachement — acte générique ou tarif libre.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle icon={Sparkles} label="Résumé tarifaire" />
          <div className="px-5 pb-2 pt-1 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Coefficient</p>
              <p className="text-xl font-extrabold text-gray-800 tabular-nums mt-1">{acte.coefficient}</p>
            </div>
            <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Prix HNC</p>
              <p className="text-lg font-extrabold text-[#cd3b86] tabular-nums mt-1">
                {acte.prixHnc ? formatCurrency(Number(acte.prixHnc)) : "—"}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <SectionTitle icon={Percent} label="Tarification & codes" />
        <div className="pb-2">
          <InfoRow
            icon={Hash}
            label="Code base"
            value={acte.codeBase ?? "—"}
            mono
          />
          <InfoRow
            icon={Calculator}
            label="Valeur fixe"
            value={
              acte.valeurFixe != null
                ? formatCurrency(Number(acte.valeurFixe))
                : "—"
            }
          />
          <InfoRow
            icon={Percent}
            label="Impute assurance"
            value={acte.imputeAssurance != null ? String(acte.imputeAssurance) : "—"}
          />
        </div>
      </SectionCard>

      <div className="rounded-2xl border border-gray-100 bg-white/80 px-5 py-3.5 text-[11px] text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          Référentiel actes — modifications enregistrées via l&apos;application.
        </span>
      </div>

      <ActeEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initialActe={acte}
        categories={categories}
        assurances={assurances}
        isPending={update.isPending}
        onSave={handleSaveWrapper}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#525252]">
              Supprimer cet acte ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed">
              Action définitive. Les factures ou visites qui référencent encore cet acte
              peuvent être impactées selon votre logique métier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-gray-200">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
              onClick={() => void confirmDelete()}
              disabled={busy}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

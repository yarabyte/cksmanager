"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Save,
  Receipt,
  Calendar,
  Stethoscope,
  ScrollText,
  ChevronRight,
  User,
  Search,
  FileStack,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency, formatDate } from "@/lib/formatting"
import { createFacture, listVisitesAvecFeuillesEligibles } from "@/app/actions/factures"
import type { VisiteFeuillesEligibles } from "@/lib/types/facture"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description?: string
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-[#cd3b86]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  )
}

export default function NouvelleFacturePage() {
  const router = useRouter()
  const [visites, setVisites] = React.useState<VisiteFeuillesEligibles[]>([])
  const [loading, setLoading] = React.useState(true)
  const [pending, setPending] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selectedVisite, setSelectedVisite] = React.useState<string | null>(null)
  const [selectedFeuilles, setSelectedFeuilles] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    void listVisitesAvecFeuillesEligibles().then((v) => {
      setVisites(v)
      setLoading(false)
    })
  }, [])

  const filteredVisites = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return visites
    return visites.filter(
      (v) =>
        (v.patientLabel?.toLowerCase().includes(q) ?? false) ||
        (v.medecinNom?.toLowerCase().includes(q) ?? false) ||
        v.feuilles.some((f) => f.numero.toLowerCase().includes(q)),
    )
  }, [visites, search])

  const visite = visites.find((v) => v.visiteId === selectedVisite)

  function selectVisite(v: VisiteFeuillesEligibles) {
    setSelectedVisite(v.visiteId)
    setSelectedFeuilles(
      v.feuilles.length === 1 ? new Set([v.feuilles[0]!.id]) : new Set(),
    )
  }

  function toggleFeuille(id: string) {
    setSelectedFeuilles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCreate() {
    if (!selectedVisite || selectedFeuilles.size < 1) {
      toast.error("Sélectionnez au moins une feuille de circulation validée.")
      return
    }
    setPending(true)
    try {
      const res = await createFacture({
        visiteId: selectedVisite,
        feuilleIds: [...selectedFeuilles],
      })
      if (res.ok) {
        toast.success("Facture créée")
        router.push(`/facturation/${res.id}`)
      } else {
        toast.error(res.error)
      }
    } finally {
      setPending(false)
    }
  }

  const totalSelected =
    visite?.feuilles
      .filter((f) => selectedFeuilles.has(f.id))
      .reduce(
        (s, f) => s + (f.statutPaiement === "PAYEE" ? 0 : f.montantPatient),
        0,
      ) ?? 0

  const totalAssurance =
    visite?.feuilles
      .filter((f) => selectedFeuilles.has(f.id))
      .reduce((s, f) => s + f.montantAssurance, 0) ?? 0

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-28">
      {/* Fil d'Ariane */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
        <Link href="/facturation" className="hover:text-[#cd3b86] transition-colors">
          Facturation
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-600">Nouvelle facture</span>
      </nav>

      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Facturation
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
            Nouvelle facture
          </h1>
          <p className="max-w-2xl text-sm text-gray-500 leading-relaxed">
            Regroupez une ou plusieurs feuilles de circulation confirmées d&apos;une même visite,
            y compris celles déjà payées ou sans reste à encaisser.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-xl border-gray-200"
        >
          <Link href="/facturation">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className={cn(cardSurface, "flex items-center justify-center gap-2 px-5 py-16 text-sm text-gray-500")}>
          <Loader2 className="h-5 w-5 animate-spin text-[#cd3b86]" />
          Chargement des visites éligibles…
        </div>
      ) : visites.length === 0 ? (
        <div className={cn(cardSurface, "px-5 py-16 text-center")}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
            <FileStack className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-700">
            Aucune visite éligible
          </p>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            Il faut au moins une feuille de circulation validée, non encore rattachée à une
            facture.
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-xl">
            <Link href="/feuilles-circulation">Voir les feuilles de circulation</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          {/* Colonne visites */}
          <section className={cardSurface}>
            <SectionHeader
              icon={Calendar}
              title="Choisir une visite"
              description="Sélectionnez la visite concernée par la facture groupée."
            />
            <div className="space-y-4 p-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Rechercher un patient, médecin ou n° de feuille…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 rounded-xl border-gray-200 bg-gray-50 pl-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                {filteredVisites.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    Aucune visite ne correspond à votre recherche.
                  </p>
                ) : (
                  filteredVisites.map((v) => {
                    const selected = selectedVisite === v.visiteId
                    return (
                      <button
                        key={v.visiteId}
                        type="button"
                        onClick={() => selectVisite(v)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-all duration-150",
                          selected
                            ? "border-[#cd3b86]/30 bg-[#cd3b86]/[0.04] ring-1 ring-[#cd3b86]/20"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/80",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 shrink-0 text-gray-400" />
                              <p className="font-semibold text-gray-800 truncate">
                                {v.patientLabel ?? `Patient #${v.patientId}`}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(v.dateVisite)}
                              </span>
                              {v.medecinNom && (
                                <span className="inline-flex items-center gap-1">
                                  <Stethoscope className="h-3.5 w-3.5" />
                                  {v.medecinNom}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 rounded-lg text-[10px] font-medium",
                              selected
                                ? "border-[#cd3b86]/20 bg-[#cd3b86]/10 text-[#cd3b86]"
                                : "border-gray-200 bg-gray-50 text-gray-600",
                            )}
                          >
                            {v.feuilles.length} feuille{v.feuilles.length > 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </section>

          {/* Colonne récap / feuilles */}
          <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
            {!visite ? (
              <div className={cn(cardSurface, "p-5 text-center")}>
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
                  <Receipt className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-700">
                  Sélectionnez une visite
                </p>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  Les feuilles de circulation éligibles apparaîtront ici pour constituer la
                  facture.
                </p>
              </div>
            ) : (
              <section className={cardSurface}>
                <SectionHeader
                  icon={ScrollText}
                  title="Feuilles à regrouper"
                  description="Cochez les feuilles de circulation à inclure dans la facture."
                />
                <div className="space-y-3 p-5">
                  {visite.feuilles.map((f) => {
                    const checked = selectedFeuilles.has(f.id)
                    const dejaPayee = f.statutPaiement === "PAYEE"
                    const soldeZero = f.montantPatient === 0 && f.montantAssurance === 0
                    return (
                      <label
                        key={f.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                          checked
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/60",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleFeuille(f.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-sans text-sm font-semibold text-gray-800">
                              {f.numero}
                            </p>
                            {dejaPayee && (
                              <Badge
                                variant="outline"
                                className="rounded-md border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                              >
                                Payée
                              </Badge>
                            )}
                            {soldeZero && (
                              <Badge
                                variant="outline"
                                className="rounded-md border-gray-200 bg-gray-50 text-[10px] text-gray-600"
                              >
                                Solde 0
                              </Badge>
                            )}
                          </div>
                          {f.libelle && (
                            <p className="mt-0.5 truncate text-xs text-gray-500">{f.libelle}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs">
                            <span className="text-gray-500">
                              Patient{" "}
                              <span className="font-semibold text-[#cd3b86]">
                                {formatCurrency(f.montantPatient)}
                              </span>
                            </span>
                            <span className="text-gray-500">
                              Assurance{" "}
                              <span className="font-semibold text-emerald-600">
                                {formatCurrency(f.montantAssurance)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </label>
                    )
                  })}

                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Feuilles sélectionnées</span>
                      <span className="font-semibold text-gray-800">{selectedFeuilles.size}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Part assurance</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(totalAssurance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200/80 pt-2">
                      <span className="text-sm font-medium text-gray-700">Total patient</span>
                      <span className="text-lg font-bold text-[#cd3b86]">
                        {formatCurrency(totalSelected)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      )}

      {/* Barre d'actions fixe */}
      {!loading && visites.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="hidden text-xs text-gray-500 sm:block">
              {visite ? (
                <>
                  Facture pour{" "}
                  <span className="font-medium text-gray-700">
                    {visite.patientLabel ?? `Patient #${visite.patientId}`}
                  </span>
                  {" · "}
                  {selectedFeuilles.size} feuille{selectedFeuilles.size > 1 ? "s" : ""} de
                  circulation
                </>
              ) : (
                "Sélectionnez une visite pour continuer"
              )}
            </p>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/facturation">Annuler</Link>
              </Button>
              <Button
                className="gap-2 min-w-[180px] rounded-xl bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
                disabled={pending || !visite || selectedFeuilles.size < 1}
                onClick={() => void handleCreate()}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Créer la facture (brouillon)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

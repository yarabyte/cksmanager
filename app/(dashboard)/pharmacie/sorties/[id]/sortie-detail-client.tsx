"use client"

import * as React from "react"
import Link from "next/link"
import {
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  FileText,
  Package,
  PackageCheck,
  Pill,
  Receipt,
  ScrollText,
  User,
  Warehouse,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatutBadge } from "@/components/pharmacie/sortie-detail-panel"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { SortiePharmacieDetail, SortiePharmacieLigne } from "@/lib/types/pharmacie-sortie"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"

type ProduitGroupe = {
  key: string
  nom: string
  dosage: string | null
  lots: SortiePharmacieLigne[]
  totalServi: number
  montantUnitaire: number
}

function groupLignesParProduit(lignes: SortiePharmacieLigne[]): ProduitGroupe[] {
  const map = new Map<string, ProduitGroupe>()
  for (const l of lignes) {
    const key = `${l.produitNom}|${l.produitDosage ?? ""}`
    const prev = map.get(key) ?? {
      key,
      nom: l.produitNom,
      dosage: l.produitDosage,
      lots: [],
      totalServi: 0,
      montantUnitaire: l.montantPatientUnitaire,
    }
    prev.lots.push(l)
    prev.totalServi += l.quantiteServie
    map.set(key, prev)
  }
  return [...map.values()]
}

function ProduitSortieCard({ groupe, index }: { groupe: ProduitGroupe; index: number }) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="bg-gradient-to-r from-[#cd3b86]/[0.03] to-transparent px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Pill className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">{groupe.nom}</h3>
              {groupe.dosage && (
                <span className="text-sm text-gray-400">{groupe.dosage}</span>
              )}
              <span className="text-[10px] font-medium text-gray-300">#{index + 1}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="rounded-md border-[#cd3b86]/20 bg-[#cd3b86]/10 text-[10px] font-semibold text-[#cd3b86]"
              >
                {groupe.totalServi} unité{groupe.totalServi > 1 ? "s" : ""} servie
                {groupe.totalServi > 1 ? "s" : ""}
              </Badge>
              <span className="text-xs text-gray-500">
                P.U. patient {formatCurrency(groupe.montantUnitaire)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3 sm:px-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
          Lots prélevés (FEFO)
        </p>
        <div className="space-y-2">
          {groupe.lots.map((lot) => (
            <div
              key={lot.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-gray-100 bg-white px-3 py-2.5 text-xs"
            >
              <span className="font-mono font-semibold text-gray-800">{lot.numeroLot}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">Exp. {formatDate(lot.datePeremption)}</span>
              <span className="ml-auto inline-flex items-center rounded-md bg-[#cd3b86]/10 px-2 py-0.5 font-bold tabular-nums text-[#cd3b86]">
                −{lot.quantiteServie}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

function DocumentLinkRow({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string
  value: string
  href: string
  icon: React.ElementType
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 transition-colors hover:border-[#cd3b86]/20 hover:bg-[#cd3b86]/[0.03]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#cd3b86] shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="font-semibold text-gray-900 truncate">{value}</p>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />
    </Link>
  )
}

export function SortieDetailClient({ sortie }: { sortie: SortiePharmacieDetail }) {
  const produits = React.useMemo(
    () => groupLignesParProduit(sortie.lignes),
    [sortie.lignes],
  )
  const totalServi = sortie.lignes.reduce((s, l) => s + l.quantiteServie, 0)
  const documentType = sortie.factureNumero ? "FACTURE" : "FEUILLE"

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
        <Link href="/pharmacie/sorties" className="hover:text-[#cd3b86] transition-colors">
          Sorties
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-600">{sortie.numero}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-lg border-[#cd3b86]/20 bg-[#cd3b86]/10 text-[10px] font-semibold text-[#cd3b86]"
            >
              <PackageCheck className="mr-1 h-3 w-3" />
              Sortie validée
            </Badge>
            <StatutBadge statut={sortie.statut} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
            {sortie.numero}
          </h1>
          <p className="text-sm text-gray-500">
            {sortie.createdAt ? formatDateTime(sortie.createdAt) : "—"}
            {" · "}
            Par <span className="font-medium text-gray-700">{sortie.userNom}</span>
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 rounded-xl border-gray-200"
        >
          <Link href="/pharmacie/sorties">
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className={cn(cardSurface, "overflow-hidden")}>
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg text-[10px] font-semibold",
                    documentType === "FACTURE"
                      ? "border-[#cd3b86]/20 bg-[#cd3b86]/10 text-[#cd3b86]"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {documentType === "FACTURE" ? (
                    <>
                      <FileText className="mr-1 h-3 w-3" />
                      Facture
                    </>
                  ) : (
                    <>
                      <ScrollText className="mr-1 h-3 w-3" />
                      Feuille
                    </>
                  )}
                </Badge>
                {sortie.factureNumero && (
                  <span className="font-semibold text-gray-900">{sortie.factureNumero}</span>
                )}
                {sortie.encaissementNumero && (
                  <span className="text-sm text-gray-500">
                    Reçu {sortie.encaissementNumero}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  {sortie.patientLabel ?? `Patient #${sortie.patientId}`}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-gray-400" />
                  {sortie.pharmacieNom}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Warehouse className="h-3.5 w-3.5 text-gray-400" />
                  {sortie.magasinNom}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Produits dispensés · lots FEFO
              </p>
              {produits.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center text-gray-500">
                    <PackageCheck className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium text-gray-600">Aucune ligne</p>
                  </div>
                ) : (
                  produits.map((g, i) => (
                    <ProduitSortieCard key={g.key} groupe={g} index={i} />
                  ))
                )}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <section className={cn(cardSurface, "overflow-hidden")}>
            <Tabs defaultValue="recap" className="w-full">
              <div className="border-b border-gray-100 px-2 pt-2">
                <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl bg-gray-100/80 p-1">
                  <TabsTrigger
                    value="recap"
                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#cd3b86] data-[state=active]:shadow-sm"
                  >
                    <Receipt className="mr-1.5 h-3.5 w-3.5" />
                    Récapitulatif
                  </TabsTrigger>
                  <TabsTrigger
                    value="document"
                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#cd3b86] data-[state=active]:shadow-sm"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Document source
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="recap" className="mt-0 space-y-3 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Produits</span>
                  <span className="font-semibold text-gray-800">{produits.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Lignes lot</span>
                  <span className="font-semibold text-gray-800">{sortie.lignes.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Unités servies</span>
                  <span className="font-bold text-[#cd3b86] tabular-nums">{totalServi}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Magasin</span>
                  <span className="font-medium text-gray-700 text-right text-xs max-w-[160px] truncate">
                    {sortie.magasinNom}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pharmacie</span>
                  <span className="font-medium text-gray-700 text-right text-xs max-w-[160px] truncate">
                    {sortie.pharmacieNom}
                  </span>
                </div>

                <div
                  className={cn(
                    "rounded-xl border px-3.5 py-3 text-sm font-medium",
                    sortie.statut === "COMPLETE"
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                      : "border-amber-200 bg-amber-50/80 text-amber-900",
                  )}
                >
                  {sortie.statut === "COMPLETE"
                    ? "Dispensation complète"
                    : "Dispensation partielle"}
                </div>
              </TabsContent>

              <TabsContent value="document" className="mt-0 space-y-2.5 p-5">
                <DocumentLinkRow
                  label="Patient"
                  value={sortie.patientLabel ?? `Patient #${sortie.patientId}`}
                  href={`/patients/${sortie.patientId}`}
                  icon={User}
                />
                {sortie.feuilleId && sortie.feuilleNumero && (
                  <DocumentLinkRow
                    label="Feuille de circulation"
                    value={sortie.feuilleNumero}
                    href={`/feuilles-circulation/${sortie.feuilleId}`}
                    icon={ScrollText}
                  />
                )}
                {sortie.factureId && sortie.factureNumero && (
                  <DocumentLinkRow
                    label="Facture"
                    value={sortie.factureNumero}
                    href={`/facturation/${sortie.factureId}`}
                    icon={FileText}
                  />
                )}
                {sortie.encaissementId && sortie.encaissementNumero && (
                  <DocumentLinkRow
                    label="Reçu caisse"
                    value={sortie.encaissementNumero}
                    href={`/caisse/recu/${sortie.encaissementId}`}
                    icon={Receipt}
                  />
                )}
                {!sortie.feuilleId &&
                  !sortie.factureId &&
                  !sortie.encaissementId && (
                    <p className="py-6 text-center text-sm text-gray-500">
                      Aucun document lié.
                    </p>
                  )}
              </TabsContent>
            </Tabs>
          </section>
        </aside>
      </div>
    </div>
  )
}

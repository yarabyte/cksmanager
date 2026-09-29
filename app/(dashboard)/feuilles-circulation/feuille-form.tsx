"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Stethoscope,
  Loader2,
  AlertTriangle,
  Save,
  User,
  ShieldCheck,
  PackagePlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatCurrency, formatDate, formatBirthAge } from "@/lib/formatting"
import {
  CategorieIcon,
  formatCategorieLabel,
} from "@/components/shared/categorie-icon"
import { computeLigne, normalizeDecimal, resolveValeurUnitairePoint } from "@/lib/feuille-circulation/calcul"
import {
  createFeuille,
  updateFeuille,
  getVisiteFeuilleContext,
} from "@/app/actions/feuilles-circulation"
import type {
  ActeOption,
  CategorieOption,
  FeuilleLigneRow,
  KitOption,
  ProduitOption,
  VisiteFeuilleContext,
  VisiteRecenteOption,
} from "@/lib/types/feuille-circulation"

type LineState = {
  key: string
  categorieId: string
  isPharmacie: boolean
  acteId: string | null
  produitId: string | null
  quantite: number
  hnc: string
  prixUnitaire: string
  remiseUnitaire: string
}

let keySeq = 0
function newKey() {
  keySeq += 1
  return `l${Date.now()}_${keySeq}`
}

function emptyLine(): LineState {
  return {
    key: newKey(),
    categorieId: "",
    isPharmacie: false,
    acteId: null,
    produitId: null,
    quantite: 1,
    hnc: "",
    prixUnitaire: "",
    remiseUnitaire: "",
  }
}

function formatHncValue(value: number | null | undefined): string {
  if (value == null || value <= 0) return ""
  return String(value)
}

function resolveDefaultHnc(
  line: Pick<LineState, "isPharmacie" | "acteId" | "produitId">,
  acteMap: Map<string, ActeOption>,
  produitMap: Map<string, ProduitOption>,
): number | null {
  if (line.isPharmacie) {
    const produit = line.produitId ? produitMap.get(line.produitId) : undefined
    return produit?.hnc ?? null
  }
  const acte = line.acteId ? acteMap.get(line.acteId) : undefined
  return acte?.prixHnc ?? null
}

function lineStateFromRow(
  l: FeuilleLigneRow,
  acteMap: Map<string, ActeOption>,
  produitMap: Map<string, ProduitOption>,
): LineState {
  const base: LineState = {
    key: newKey(),
    categorieId: l.categorieId,
    isPharmacie: l.typeLigne === "PHARMA",
    acteId: l.acteId,
    produitId: l.produitId,
    quantite: l.quantite,
    hnc: "",
    prixUnitaire: l.puSnapshot != null ? String(l.puSnapshot) : "",
    remiseUnitaire: l.remiseUnitaire != null ? String(l.remiseUnitaire) : "",
  }
  const stored = l.hnc > 0 ? l.hnc : null
  const fallback = resolveDefaultHnc(base, acteMap, produitMap)
  return {
    ...base,
    hnc: formatHncValue(stored ?? fallback),
  }
}

export type FeuilleFormProps = {
  mode: "create" | "edit"
  categories: CategorieOption[]
  actes: ActeOption[]
  produits: ProduitOption[]
  kits: KitOption[]
  visites?: VisiteRecenteOption[]
  initialVisiteId?: string | null
  feuilleId?: string
  initialVisiteContext?: VisiteFeuilleContext | null
  initialLibelle?: string
  initialLignes?: FeuilleLigneRow[]
}

export function FeuilleForm(props: FeuilleFormProps) {
  const router = useRouter()
  const { categories, actes, produits, kits } = props

  const categorieMap = React.useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )
  const acteMap = React.useMemo(() => new Map(actes.map((a) => [a.id, a])), [actes])
  const produitMap = React.useMemo(
    () => new Map(produits.map((p) => [p.id, p])),
    [produits],
  )
  const pharmacieCategorieId = React.useMemo(
    () => categories.find((c) => c.isPharmacie)?.id ?? null,
    [categories],
  )

  const [visiteId, setVisiteId] = React.useState<string | null>(
    props.initialVisiteId ?? props.initialVisiteContext?.visiteId ?? null,
  )
  const [context, setContext] = React.useState<VisiteFeuilleContext | null>(
    props.initialVisiteContext ?? null,
  )
  const [loadingContext, setLoadingContext] = React.useState(false)
  const [libelle, setLibelle] = React.useState(props.initialLibelle ?? "")
  const [lines, setLines] = React.useState<LineState[]>(() => {
    const acteMapInit = new Map(props.actes.map((a) => [a.id, a]))
    const produitMapInit = new Map(props.produits.map((p) => [p.id, p]))
    if (props.initialLignes && props.initialLignes.length > 0) {
      return props.initialLignes.map((l) => lineStateFromRow(l, acteMapInit, produitMapInit))
    }
    return [emptyLine()]
  })
  const [kitToAdd, setKitToAdd] = React.useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  // Chargement du contexte assurance quand une visite est sélectionnée (mode create)
  const loadContext = React.useCallback(async (id: string) => {
    setLoadingContext(true)
    try {
      const ctx = await getVisiteFeuilleContext(id)
      setContext(ctx)
    } catch {
      toast.error("Impossible de charger le contexte de la visite.")
    } finally {
      setLoadingContext(false)
    }
  }, [])

  React.useEffect(() => {
    if (props.mode === "create" && props.initialVisiteId) {
      void loadContext(props.initialVisiteId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const affiliation = context?.affiliation ?? null
  const priseEnChargePatient = context?.priseEnChargePatient ?? false
  const affiliationExpiree = context?.affiliationExpiree ?? false

  function tauxForCategorie(categorieId: string): number {
    if (!affiliation) return 0
    if (categorieId in affiliation.couvertures) return affiliation.couvertures[categorieId]
    return affiliation.tauxCouverture ?? 0
  }

  function resolveHncForSubmit(line: LineState): number | null {
    const parsed = normalizeDecimal(line.hnc)
    if (parsed !== null && parsed > 0) return parsed
    return resolveDefaultHnc(line, acteMap, produitMap)
  }

  // Calcul de prévisualisation d'une ligne (même logique que le serveur)
  function previewLine(line: LineState) {
    const taux = tauxForCategorie(line.categorieId)
    const hncSaisi = resolveHncForSubmit(line)
    if (line.isPharmacie) {
      const produit = line.produitId ? produitMap.get(line.produitId) : undefined
      if (!produit) return null
      const pu = normalizeDecimal(line.prixUnitaire) ?? produit.prixVenteRef
      const remise = normalizeDecimal(line.remiseUnitaire) ?? 0
      return computeLigne({
        typeLigne: "PHARMA",
        quantite: line.quantite,
        taux,
        hncSaisi,
        pu,
        remise,
        produitHnc: produit.hnc,
      })
    }
    const acte = line.acteId ? acteMap.get(line.acteId) : undefined
    if (!acte) return null
    const valeurPoint = resolveValeurUnitairePoint(
      acte.codeBase,
      affiliation?.valeurs ?? {},
      acte.valeurPointTarif,
    )
    return computeLigne({
      typeLigne: "ACTE",
      quantite: line.quantite,
      taux,
      hncSaisi,
      valeurFixe: acte.valeurFixe,
      coefficient: acte.coefficient,
      valeurUnitairePoint: valeurPoint,
      acteHnc: acte.prixHnc,
      imputeAssurance: acte.imputeAssurance,
    })
  }

  const totals = React.useMemo(() => {
    let assurance = 0
    let patient = 0
    let hnc = 0
    let total = 0
    for (const line of lines) {
      const r = previewLine(line)
      if (!r) continue
      assurance += r.montantAssurance
      patient += r.montantPatient
      hnc += r.hnc * Math.max(1, line.quantite)
      total += r.montantTotal
    }
    return { assurance, patient, hnc, total }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, context])

  // ── Mutateurs de lignes ──
  function updateLine(key: string, patch: Partial<LineState>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function onCategorieChange(key: string, categorieId: string | undefined) {
    const cat = categorieId ? categorieMap.get(categorieId) : undefined
    updateLine(key, {
      categorieId: categorieId ?? "",
      isPharmacie: cat?.isPharmacie ?? false,
      acteId: null,
      produitId: null,
      prixUnitaire: "",
      remiseUnitaire: "",
      hnc: "",
    })
  }

  function onActeChange(key: string, acteId: string | null) {
    const acte = acteId ? acteMap.get(acteId) : undefined
    updateLine(key, {
      acteId,
      hnc: formatHncValue(acte?.prixHnc),
    })
  }

  function onProduitChange(key: string, produitId: string | null) {
    const produit = produitId ? produitMap.get(produitId) : undefined
    updateLine(key, {
      produitId,
      hnc: formatHncValue(produit?.hnc),
    })
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()])
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? [emptyLine()] : prev.filter((l) => l.key !== key)))
  }

  function addKit(kitId: string) {
    const kit = kits.find((k) => k.id === kitId)
    if (!kit) return
    const newLines: LineState[] = []
    let skipped = 0
    for (const kl of kit.lignes) {
      if (kl.typeLigne === "PHARMA") {
        if (!pharmacieCategorieId || !kl.produitId) {
          skipped += 1
          continue
        }
        newLines.push({
          ...emptyLine(),
          categorieId: pharmacieCategorieId,
          isPharmacie: true,
          produitId: kl.produitId,
          quantite: kl.quantite,
          remiseUnitaire: kl.remiseUnitaire ? String(kl.remiseUnitaire) : "",
          hnc: formatHncValue(produitMap.get(kl.produitId)?.hnc),
        })
      } else {
        if (!kl.acteId) {
          skipped += 1
          continue
        }
        const acte = acteMap.get(kl.acteId)
        if (!acte) {
          skipped += 1
          continue
        }
        newLines.push({
          ...emptyLine(),
          categorieId: acte.categorieId,
          isPharmacie: false,
          acteId: kl.acteId,
          quantite: kl.quantite,
          hnc: formatHncValue(acte.prixHnc),
        })
      }
    }
    if (newLines.length === 0) {
      toast.error("Aucune ligne exploitable dans ce kit.")
      return
    }
    setLines((prev) => {
      const hasOnlyEmpty = prev.length === 1 && !prev[0].categorieId
      return hasOnlyEmpty ? newLines : [...prev, ...newLines]
    })
    toast.success(
      `Kit « ${kit.nom} » ajouté (${newLines.length} ligne${newLines.length > 1 ? "s" : ""}).` +
        (skipped ? ` ${skipped} ignorée(s).` : ""),
    )
    setKitToAdd(undefined)
  }

  // ── Soumission ──
  function buildPayloadLignes() {
    if (affiliationExpiree) {
      toast.error("L'affiliation assurance de ce patient est expirée ou pas encore active.")
      return null
    }
    if (!affiliation && !priseEnChargePatient) {
      toast.error("Contexte assurance introuvable.")
      return null
    }
    const payloadLignes = lines
      .filter((l) => l.categorieId && (l.isPharmacie ? l.produitId : l.acteId))
      .map((l, idx) => ({
        typeLigne: l.isPharmacie ? ("PHARMA" as const) : ("ACTE" as const),
        categorieId: l.categorieId,
        acteId: l.isPharmacie ? null : l.acteId,
        produitId: l.isPharmacie ? l.produitId : null,
        quantite: l.quantite,
        hnc: resolveHncForSubmit(l),
        prixUnitaire: l.prixUnitaire || null,
        remiseUnitaire: l.remiseUnitaire || null,
        position: idx,
      }))

    if (payloadLignes.length === 0) {
      toast.error("Ajoutez au moins une ligne complète.")
      return null
    }

    return payloadLignes
  }

  function requestSubmit() {
    const payloadLignes = buildPayloadLignes()
    if (!payloadLignes) return
    if (props.mode === "create") {
      setConfirmOpen(true)
      return
    }
    void handleSubmit(payloadLignes)
  }

  async function handleSubmit(payloadLignes = buildPayloadLignes()) {
    if (!payloadLignes) return

    setSubmitting(true)
    try {
      const res =
        props.mode === "create"
          ? await createFeuille({
              visiteId,
              libelle: libelle || null,
              lignes: payloadLignes,
            })
          : await updateFeuille({
              id: props.feuilleId,
              libelle: libelle || null,
              lignes: payloadLignes,
            })

      if (res.ok) {
        setConfirmOpen(false)
        toast.success(
          props.mode === "create"
            ? "Feuille de circulation créée avec succès."
            : "Feuille de circulation mise à jour.",
        )
        router.push(`/feuilles-circulation/${res.id}`)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Une erreur est survenue.")
    } finally {
      setSubmitting(false)
    }
  }

  const validLineCount = lines.filter(
    (l) => l.categorieId && (l.isPharmacie ? l.produitId : l.acteId),
  ).length

  const canEditLines =
    props.mode === "edit" || (!!visiteId && !!context && !affiliationExpiree && !!affiliation)

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      {/* Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {props.mode === "create" ? "Nouvelle feuille de circulation" : "Modifier la feuille de circulation"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sélectionnez les actes et produits ; les parts assurance / patient sont calculées automatiquement.
        </p>
      </div>

      {/* Visite / patient / assurance */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
        {props.mode === "create" && (
          <div className="space-y-1.5">
            <Label>Visite</Label>
            <Combobox
              options={(props.visites ?? []).map((v) => {
                const birth = formatBirthAge(v.patientDob)
                const name = v.patientLabel ?? `Patient #${v.patientId}`
                return {
                  value: v.id,
                  label: `${birth ? `${birth} · ` : ""}${name} — ${formatDate(v.dateVisite)}`,
                  description: v.hasAffiliation ? undefined : "Non assuré",
                }
              })}
              value={visiteId ?? undefined}
              onChange={(v) => {
                setVisiteId(v ?? null)
                setContext(null)
                if (v) void loadContext(v)
              }}
              placeholder="Choisir une visite..."
              searchPlaceholder="Rechercher un patient..."
              emptyMessage="Aucune visite récente."
            />
          </div>
        )}

        {loadingContext ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement du contexte...
          </div>
        ) : context ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="flex flex-col leading-tight">
                {context.patientDob && (
                  <span className="text-[11px] text-gray-400">
                    {formatBirthAge(context.patientDob)}
                  </span>
                )}
                <span className="font-medium text-gray-700">
                  {context.patientLabel ?? `Patient #${context.patientId}`}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{context.medecinNom ?? "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-gray-400" />
              {affiliation ? (
                priseEnChargePatient ? (
                  <span className="text-gray-600">
                    {affiliation.assuranceNom}
                    <Badge variant="secondary" className="ml-2">
                      0 %
                    </Badge>
                  </span>
                ) : (
                  <span className="text-gray-600">
                    {affiliation.assuranceNom}
                    <Badge variant="secondary" className="ml-2">
                      {affiliation.tauxCouverture}%
                    </Badge>
                  </span>
                )
              ) : (
                <span className="text-amber-700">Assurance expirée</span>
              )}
            </div>
          </div>
        ) : null}

        {priseEnChargePatient && (
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Patient rattaché à « {affiliation?.assuranceNom ?? "Non assuré"} » : tarification au
            barème clinique, 100 % à la charge du patient.
          </div>
        )}
        {affiliationExpiree && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            L&apos;affiliation assurance de ce patient est expirée ou pas encore active.
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Libellé (optionnel)</Label>
          <Input
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            placeholder="Ex : Consultation + bilan"
            maxLength={255}
          />
        </div>
      </div>

      {/* Lignes */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Lignes</p>
          <div className="flex items-center gap-2">
            {kits.length > 0 && (
              <div className="w-56">
                <Combobox
                  options={kits.map((k) => ({ value: k.id, label: k.nom }))}
                  value={kitToAdd}
                  onChange={(v) => {
                    if (v) addKit(v)
                  }}
                  placeholder="Ajouter un kit..."
                  searchPlaceholder="Rechercher un kit..."
                  emptyMessage="Aucun kit."
                  clearable={false}
                />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={addLine}
              disabled={!canEditLines}
            >
              <Plus className="h-4 w-4" />
              Ligne
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[260px] w-[260px] whitespace-nowrap">Catégorie</TableHead>
                <TableHead className="min-w-[320px] w-[320px]">Acte / Produit</TableHead>
                <TableHead className="w-[110px] text-center">Qté</TableHead>
                <TableHead className="w-[120px] hidden md:table-cell">PU</TableHead>
                <TableHead className="w-[120px]">HNC</TableHead>
                <TableHead className="text-right w-[120px]">Assurance</TableHead>
                <TableHead className="text-right w-[120px]">Patient</TableHead>
                <TableHead className="w-[44px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => {
                const preview = previewLine(line)
                const acteOptions = actes
                  .filter((a) => a.categorieId === line.categorieId)
                  .map((a) => {
                    const parts = [
                      a.assureurNom,
                      a.prixHnc != null && a.prixHnc > 0
                        ? `HNC ${formatCurrency(a.prixHnc)}`
                        : null,
                      a.valeurFixe != null && a.valeurFixe > 0
                        ? formatCurrency(a.valeurFixe)
                        : a.valeurPointTarif != null && a.coefficient > 0
                          ? formatCurrency(a.coefficient * a.valeurPointTarif)
                          : null,
                    ].filter(Boolean)
                    return {
                      value: a.id,
                      label: a.nom,
                      description: parts.length > 0 ? parts.join(" · ") : undefined,
                      searchText: [a.assureurNom, a.codeBase].filter(Boolean).join(" "),
                    }
                  })
                const produitOptions = produits.map((p) => ({
                  value: p.id,
                  label: `${p.nom} ${p.dosage}`.trim(),
                  description: formatCurrency(p.prixVenteRef),
                }))
                const selectedProduit = line.produitId ? produitMap.get(line.produitId) : undefined
                const selectedActe = line.acteId ? acteMap.get(line.acteId) : undefined
                const defaultHnc = resolveDefaultHnc(line, acteMap, produitMap)
                const qty = Math.max(1, line.quantite)
                const hncUnit =
                  preview?.hnc ?? normalizeDecimal(line.hnc) ?? defaultHnc ?? 0
                const canEditHnc = canEditLines && Boolean(line.acteId || line.produitId)
                return (
                  <TableRow key={line.key} className="align-top">
                    <TableCell className="min-w-[260px] w-[260px] align-middle">
                      <Combobox
                        options={categories.map((c) => ({
                          value: c.id,
                          label: formatCategorieLabel(c.nom),
                          icon: <CategorieIcon nom={c.nom} className="h-3.5 w-3.5 shrink-0" />,
                        }))}
                        value={line.categorieId || undefined}
                        onChange={(v) => onCategorieChange(line.key, v)}
                        placeholder="Catégorie"
                        clearable={false}
                        disabled={!canEditLines}
                        truncateLabel={false}
                        className="h-9 w-full whitespace-nowrap"
                      />
                    </TableCell>
                    <TableCell className="min-w-[320px] w-[320px] align-top">
                      {line.isPharmacie ? (
                        <Combobox
                          options={produitOptions}
                          value={line.produitId ?? undefined}
                          onChange={(v) => onProduitChange(line.key, v ?? null)}
                          placeholder="Produit"
                          searchPlaceholder="Rechercher un produit..."
                          disabled={!canEditLines || !line.categorieId}
                          wrapLabel
                        />
                      ) : (
                        <Combobox
                          key={`${line.key}-acte-${line.categorieId}`}
                          options={acteOptions}
                          value={line.acteId ?? undefined}
                          onChange={(v) => onActeChange(line.key, v ?? null)}
                          placeholder="Acte"
                          searchPlaceholder="Rechercher un acte..."
                          emptyMessage="Aucun acte dans cette catégorie."
                          disabled={!canEditLines || !line.categorieId}
                          wrapLabel
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {canEditLines ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            disabled={qty <= 1}
                            onClick={() =>
                              updateLine(line.key, {
                                quantite: Math.max(1, qty - 1),
                              })
                            }
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={line.quantite}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "")
                              updateLine(line.key, {
                                quantite: Math.max(1, Number(raw) || 1),
                              })
                            }}
                            className="w-8 shrink-0 bg-transparent p-0 text-center text-sm font-medium tabular-nums text-gray-700 outline-none"
                            aria-label="Quantité"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() =>
                              updateLine(line.key, { quantite: qty + 1 })
                            }
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium tabular-nums text-gray-700">
                          {line.quantite}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {line.isPharmacie ? (
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={line.prixUnitaire}
                          onChange={(e) => updateLine(line.key, { prixUnitaire: e.target.value })}
                          placeholder={
                            selectedProduit ? String(selectedProduit.prixVenteRef) : "PU"
                          }
                          disabled={!canEditLines}
                          className="h-9"
                        />
                      ) : preview ? (
                        <span className="text-sm font-medium tabular-nums text-gray-700">
                          {formatCurrency(preview.valeur)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEditHnc ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={line.hnc}
                          onChange={(e) => updateLine(line.key, { hnc: e.target.value })}
                          placeholder={
                            defaultHnc != null && defaultHnc > 0 ? String(defaultHnc) : "0"
                          }
                          className="w-full min-w-[4rem] bg-transparent p-0 text-right text-sm font-medium tabular-nums text-gray-700 outline-none placeholder:text-gray-300"
                          aria-label="HNC unitaire"
                        />
                      ) : (
                        <span className="text-sm font-medium tabular-nums text-gray-700">
                          {line.acteId || line.produitId ? formatCurrency(hncUnit) : "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-emerald-600">
                      {preview ? formatCurrency(preview.montantAssurance) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {preview ? formatCurrency(preview.montantPatient) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-600"
                        onClick={() => removeLine(line.key)}
                        disabled={!canEditLines}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Totaux */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Part assurance</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totals.assurance)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Part patient</p>
            <p className="text-lg font-bold text-[#cd3b86]">{formatCurrency(totals.patient)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.total)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/feuilles-circulation">Annuler</Link>
        </Button>
        <Button
          onClick={requestSubmit}
          disabled={submitting || !canEditLines}
          className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : props.mode === "create" ? (
            <PackagePlus className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {props.mode === "create" ? "Créer la feuille de circulation" : "Enregistrer"}
        </Button>
      </div>

      {props.mode === "create" && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Créer la feuille de circulation ?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Vous allez créer une feuille pour{" "}
                    <strong className="text-foreground">
                      {context?.patientLabel ?? "ce patient"}
                    </strong>
                    {context?.dateVisite ? (
                      <>
                        {" "}
                        (visite du{" "}
                        <strong className="text-foreground">
                          {formatDate(context.dateVisite)}
                        </strong>
                        )
                      </>
                    ) : null}
                    , avec{" "}
                    <strong className="text-foreground tabular-nums">
                      {validLineCount} ligne{validLineCount > 1 ? "s" : ""}
                    </strong>
                    .
                  </p>
                  <div className="grid gap-1 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs">
                    <div className="flex justify-between gap-4">
                      <span>Part assurance</span>
                      <span className="font-medium text-emerald-600 tabular-nums">
                        {formatCurrency(totals.assurance)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Part patient</span>
                      <span className="font-medium text-[#cd3b86] tabular-nums">
                        {formatCurrency(totals.patient)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-gray-200 pt-1">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatCurrency(totals.total)}
                      </span>
                    </div>
                  </div>
                  <p>Cette action enregistrera définitivement la feuille de circulation.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl" disabled={submitting}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  void handleSubmit()
                }}
                disabled={submitting}
                className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackagePlus className="h-4 w-4" />
                )}
                Confirmer la création
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
import {
  createBordereau,
  listFacturesEligibles,
} from "@/app/actions/bordereaux"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { formatCurrency, formatDate, formatFactureNumero } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { FactureEligibleBordereau } from "@/lib/types/bordereau"

export function NouveauBordereauClient({
  assureurs,
}: {
  assureurs: { id: string; nom: string; code: string | null; nbFactures: number }[]
}) {
  const router = useRouter()
  const [assuranceId, setAssuranceId] = React.useState("")
  const [factures, setFactures] = React.useState<FactureEligibleBordereau[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!assuranceId) {
      setFactures([])
      setSelected(new Set())
      return
    }
    let cancelled = false
    setLoading(true)
    void listFacturesEligibles(assuranceId)
      .then((rows) => {
        if (!cancelled) {
          setFactures(rows)
          setSelected(new Set())
        }
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Erreur de chargement")
          setFactures([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [assuranceId])

  const total = React.useMemo(
    () =>
      factures
        .filter((f) => selected.has(f.id))
        .reduce((s, f) => s + f.montantAssurance, 0),
    [factures, selected],
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === factures.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(factures.map((f) => f.id)))
    }
  }

  async function handleCreate() {
    if (!assuranceId) {
      toast.error("Choisissez un assureur.")
      return
    }
    if (selected.size === 0) {
      toast.error("Sélectionnez au moins une facture.")
      return
    }
    setSaving(true)
    try {
      const res = await createBordereau({
        assuranceId,
        factureIds: [...selected],
      })
      if (res.ok) {
        toast.success("Bordereau créé")
        router.push(`/facturation/bordereaux/${res.id}`)
      } else {
        toast.error(res.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/facturation/bordereaux"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux bordereaux
        </Link>
        <Button
          onClick={() => void handleCreate()}
          disabled={saving || selected.size === 0}
          className="gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Créer le bordereau
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Nouveau bordereau assureur
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Un bordereau regroupe les factures impayées d&apos;un seul assureur.
        </p>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Assureur</CardTitle>
        </CardHeader>
        <CardContent>
          {assureurs.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun assureur n&apos;a de facture éligible (confirmée ou payée côté patient,
              part assurance &gt; 0, hors bordereau).
            </p>
          ) : (
            <Select value={assuranceId} onValueChange={setAssuranceId}>
              <SelectTrigger className="max-w-md rounded-lg">
                <SelectValue placeholder="Sélectionner un assureur…" />
              </SelectTrigger>
              <SelectContent>
                {assureurs.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nom}
                    {a.code ? ` (${a.code})` : ""}
                    {` — ${a.nbFactures} facture${a.nbFactures > 1 ? "s" : ""}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {assuranceId && (
        <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold">
                Factures éligibles ({factures.length})
              </CardTitle>
              <p className="text-sm text-gray-500">
                Sélection :{" "}
                <strong className="text-[#cd3b86]">{formatCurrency(total)}</strong>
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : factures.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">
                Aucune facture éligible pour cet assureur.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="w-10 pl-4">
                        <Checkbox
                          checked={selected.size === factures.length && factures.length > 0}
                          onCheckedChange={toggleAll}
                          aria-label="Tout sélectionner"
                        />
                      </TableHead>
                      <TableHead>N° facture</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Visite</TableHead>
                      <TableHead className="text-right pr-4">Part assurance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.map((f, i) => (
                      <TableRow
                        key={f.id}
                        className={cn(
                          "cursor-pointer hover:bg-[#cd3b86]/3",
                          i % 2 !== 0 && "bg-gray-50/30",
                          selected.has(f.id) && "bg-[#cd3b86]/5",
                        )}
                        onClick={() => toggle(f.id)}
                      >
                        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected.has(f.id)}
                            onCheckedChange={() => toggle(f.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {formatFactureNumero(f.numero)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {f.patientLabel ?? `Patient #${f.patientId}`}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {f.dateVisite ? formatDate(f.dateVisite) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums pr-4">
                          {formatCurrency(f.montantAssurance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

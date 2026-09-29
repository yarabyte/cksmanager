"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  BedDouble,
  Loader2,
  Search,
  Stethoscope,
  User,
} from "lucide-react"
import { createHospitalisation } from "@/app/actions/hospitalisation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/formatting"
import { cn } from "@/lib/utils"
import type { VisiteEligibleHospitalisation } from "@/lib/types/hospitalisation"

export function NouvelleHospitalisationClient({
  visites,
}: {
  visites: VisiteEligibleHospitalisation[]
}) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [selectedVisite, setSelectedVisite] = React.useState<string | null>(null)
  const [dateEntree, setDateEntree] = React.useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [commentaires, setCommentaires] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return visites
    return visites.filter(
      (v) =>
        (v.patientLabel?.toLowerCase().includes(q) ?? false) ||
        v.patientId.includes(q) ||
        (v.medecinNom?.toLowerCase().includes(q) ?? false),
    )
  }, [visites, search])

  const selected = visites.find((v) => v.id === selectedVisite) ?? null

  async function handleSubmit() {
    if (!selectedVisite) {
      toast.error("Sélectionnez une visite.")
      return
    }
    if (!dateEntree) {
      toast.error("Date d'entrée obligatoire.")
      return
    }
    setPending(true)
    try {
      const res = await createHospitalisation({
        visiteId: selectedVisite,
        dateEntree,
        commentaires: commentaires.trim() || null,
      })
      if (res.ok) {
        toast.success("Admission enregistrée")
        router.push(`/hospitalisation/${res.id}`)
      } else {
        toast.error(res.error)
        setPending(false)
      }
    } catch {
      toast.error("Erreur à la création")
      setPending(false)
    }
  }

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <Link
        href="/hospitalisation"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Nouvelle admission
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Choisissez la visite du patient, puis la date d&apos;entrée.
        </p>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-[#cd3b86]">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Visite</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Une hospitalisation est liée à une seule visite.
            </p>
          </div>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un patient…"
              className="pl-9 rounded-xl"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-xl border border-gray-100 p-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Aucune visite éligible (sans hospitalisation).
              </p>
            ) : (
              filtered.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVisite(v.id)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2.5 transition-colors",
                    selectedVisite === v.id
                      ? "bg-[#cd3b86]/10 ring-1 ring-[#cd3b86]/30"
                      : "hover:bg-gray-50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="font-semibold text-sm text-gray-800 truncate">
                      {v.patientLabel ?? `Patient #${v.patientId}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 pl-5">
                    Visite {formatDate(v.dateVisite)}
                    {v.medecinNom ? ` · ${v.medecinNom}` : ""}
                  </p>
                </button>
              ))
            )}
          </div>
          {selected ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              Sélection : {selected.patientLabel ?? `#${selected.patientId}`} — visite du{" "}
              {formatDate(selected.dateVisite)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#cd3b86]/10 text-[#cd3b86]">
            <BedDouble className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Séjour</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              La date de sortie sera saisie plus tard.
            </p>
          </div>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Date d&apos;entrée</Label>
            <DatePickerFr dateValue={dateEntree} onDateChange={setDateEntree} />
          </div>
          <div className="space-y-2">
            <Label>Commentaires (optionnel)</Label>
            <Textarea
              value={commentaires}
              onChange={(e) => setCommentaires(e.target.value)}
              rows={3}
              placeholder="Service, chambre…"
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild className="rounded-lg">
          <Link href="/hospitalisation">Annuler</Link>
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          disabled={pending || !selectedVisite}
          className="gap-2 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BedDouble className="h-4 w-4" />}
          Enregistrer l&apos;admission
        </Button>
      </div>
    </div>
  )
}

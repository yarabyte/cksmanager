"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Building2,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Warehouse,
} from "lucide-react"
import { createMagasin, updateMagasin } from "@/app/actions/pharmacie-ops"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type MagasinRow = {
  id: string
  nom: string
  emplacement: string | null
  description: string | null
  actif: boolean
  pharmacieNom: string | null
  nbLots: number
}

export function MagasinsClient({ initial }: { initial: MagasinRow[] }) {
  const rows = initial
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<MagasinRow | null>(null)
  const [pending, setPending] = React.useState(false)
  const [form, setForm] = React.useState({
    nom: "",
    emplacement: "",
    description: "",
    actif: true,
  })

  const actifs = rows.filter((m) => m.actif).length
  const totalLots = rows.reduce((s, m) => s + m.nbLots, 0)

  function openCreate() {
    setEditing(null)
    setForm({ nom: "", emplacement: "", description: "", actif: true })
    setOpen(true)
  }

  function openEdit(m: MagasinRow) {
    setEditing(m)
    setForm({
      nom: m.nom,
      emplacement: m.emplacement ?? "",
      description: m.description ?? "",
      actif: m.actif,
    })
    setOpen(true)
  }

  async function submit() {
    if (!form.nom.trim()) {
      toast.error("Nom obligatoire.")
      return
    }
    setPending(true)
    try {
      if (editing) {
        await updateMagasin({ id: editing.id, ...form })
        toast.success("Magasin mis à jour")
      } else {
        await createMagasin(form)
        toast.success("Magasin créé")
      }
      setOpen(false)
      window.location.reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setPending(false)
    }
  }

  const kpis = [
    {
      label: "Magasins",
      value: String(rows.length),
      icon: Warehouse,
      accent: "text-gray-900",
      bg: "bg-gray-100",
    },
    {
      label: "Actifs",
      value: String(actifs),
      icon: Building2,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Lots en stock",
      value: String(totalLots),
      icon: Package,
      accent: "text-[#cd3b86]",
      bg: "bg-[#cd3b86]/8",
    },
  ]

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Magasins
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Points de stock pharmacie
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nouveau magasin
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon, accent, bg }) => (
          <Card
            key={label}
            className="border border-gray-100 shadow-sm rounded-2xl bg-white"
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className={cn("text-xl font-extrabold mt-1 tabular-nums", accent)}>
                    {value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    bg,
                    accent,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <Warehouse className="h-7 w-7 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Aucun magasin</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Créez un magasin pour stocker les lots.
              </p>
            </div>
            <Button
              onClick={openCreate}
              size="sm"
              className="gap-1.5 rounded-lg bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Nouveau magasin
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((m) => (
            <Card
              key={m.id}
              className={cn(
                "group border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md hover:border-[#cd3b86]/20",
                !m.actif && "opacity-75",
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                      m.actif
                        ? "bg-[#cd3b86]/10 text-[#cd3b86]"
                        : "bg-gray-100 text-gray-400",
                    )}
                  >
                    <Warehouse className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-medium",
                        m.actif
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600",
                      )}
                    >
                      {m.actif ? "Actif" : "Inactif"}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(m)}
                      className="h-8 w-8 rounded-lg text-gray-400 hover:text-[#cd3b86] hover:bg-[#cd3b86]/8"
                      aria-label="Modifier"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <h2 className="text-lg font-extrabold tracking-tight text-gray-900 truncate">
                    {m.nom}
                  </h2>
                  {m.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">{m.emplacement || "Emplacement non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">
                      {m.pharmacieNom || "Aucune pharmacie liée"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span>
                      <strong className="tabular-nums text-gray-900">{m.nbLots}</strong>{" "}
                      lot{m.nbLots > 1 ? "s" : ""} en stock
                    </span>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le magasin" : "Nouveau magasin"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Emplacement</Label>
              <Input
                value={form.emplacement}
                onChange={(e) =>
                  setForm((f) => ({ ...f, emplacement: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.actif}
                onCheckedChange={(actif) => setForm((f) => ({ ...f, actif }))}
              />
              <Label>Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => void submit()}
              disabled={pending}
              className="bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

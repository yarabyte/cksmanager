"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Building2,
  Loader2,
  Pencil,
  Plus,
  Store,
  User,
  Warehouse,
} from "lucide-react"
import { createPharmacie, updatePharmacie } from "@/app/actions/pharmacie-ops"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type UserRow = {
  id: string
  name: string
  role: string | null
  actif: boolean
}

type Row = {
  id: string
  nom: string
  actif: boolean
  magasinId: string
  magasinNom: string
  nbUsers: number
  users: UserRow[]
}

function roleLabel(role: string | null) {
  if (!role) return null
  const map: Record<string, string> = {
    pharmacie: "Pharmacie",
    commis_pharmacie: "Commis",
  }
  return map[role] ?? role.replace(/_/g, " ")
}

export function OfficinesClient({
  initial,
  magasins,
}: {
  initial: Row[]
  magasins: { id: string; nom: string; pharmacieId: string | null }[]
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Row | null>(null)
  const [pending, setPending] = React.useState(false)
  const [form, setForm] = React.useState({ nom: "", magasinId: "", actif: true })

  const rows = initial
  const actives = rows.filter((r) => r.actif).length
  const totalUsers = rows.reduce((s, r) => s + r.nbUsers, 0)

  const magasinsDispo = magasins.filter(
    (m) => !m.pharmacieId || m.pharmacieId === editing?.id,
  )

  function openCreate() {
    setEditing(null)
    setForm({ nom: "", magasinId: magasinsDispo[0]?.id ?? "", actif: true })
    setOpen(true)
  }

  function openEdit(r: Row) {
    setEditing(r)
    setForm({ nom: r.nom, magasinId: r.magasinId, actif: r.actif })
    setOpen(true)
  }

  async function submit() {
    if (!form.nom.trim() || !form.magasinId) {
      toast.error("Nom et magasin obligatoires.")
      return
    }
    setPending(true)
    try {
      if (editing) {
        await updatePharmacie({ id: editing.id, ...form })
        toast.success("Pharmacie mise à jour")
      } else {
        await createPharmacie(form)
        toast.success("Pharmacie créée")
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
      label: "Officines",
      value: String(rows.length),
      icon: Store,
      accent: "text-gray-900",
      bg: "bg-gray-100",
    },
    {
      label: "Actives",
      value: String(actives),
      icon: Building2,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Utilisateurs",
      value: String(totalUsers),
      icon: User,
      accent: "text-[#cd3b86]",
      bg: "bg-[#cd3b86]/8",
    },
  ]

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Pharmacies
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Officines liées chacune à un magasin de stock
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-1.5 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nouvelle pharmacie
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
              <Store className="h-7 w-7 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600">Aucune pharmacie</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Créez une officine liée à un magasin.
              </p>
            </div>
            <Button
              onClick={openCreate}
              size="sm"
              className="gap-1.5 rounded-lg bg-[#cd3b86] hover:bg-[#b8307a] text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Nouvelle pharmacie
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <Card
              key={r.id}
              className={cn(
                "group border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md hover:border-[#cd3b86]/20",
                !r.actif && "opacity-75",
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                      r.actif
                        ? "bg-[#cd3b86]/10 text-[#cd3b86]"
                        : "bg-gray-100 text-gray-400",
                    )}
                  >
                    <Store className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-medium",
                        r.actif
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600",
                      )}
                    >
                      {r.actif ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(r)}
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
                    {r.nom}
                  </h2>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Warehouse className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">{r.magasinNom}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400 mb-2.5">
                    <User className="h-3.5 w-3.5" />
                    Utilisateurs
                    <Badge
                      variant="secondary"
                      className="ml-auto font-medium bg-[#cd3b86]/10 text-[#cd3b86] tabular-nums"
                    >
                      {r.users?.length ?? r.nbUsers}
                    </Badge>
                  </div>
                  {(r.users?.length ?? 0) === 0 ? (
                    <p className="text-xs text-gray-400">Aucun utilisateur affecté</p>
                  ) : (
                    <ul className="space-y-2">
                      {r.users.map((u) => (
                        <li
                          key={u.id}
                          className="flex items-center gap-2.5 min-w-0"
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                              u.actif
                                ? "bg-gray-100 text-gray-700"
                                : "bg-gray-50 text-gray-400",
                            )}
                          >
                            {u.name
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase() ?? "")
                              .join("")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-sm font-medium truncate",
                                u.actif ? "text-gray-800" : "text-gray-400",
                              )}
                            >
                              {u.name}
                            </p>
                            {roleLabel(u.role) && (
                              <p className="text-[11px] text-gray-400 truncate">
                                {roleLabel(u.role)}
                                {!u.actif ? " · Inactif" : ""}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
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
              {editing ? "Modifier la pharmacie" : "Nouvelle pharmacie"}
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
              <Label>Magasin</Label>
              <Select
                value={form.magasinId}
                onValueChange={(magasinId) => setForm((f) => ({ ...f, magasinId }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {magasinsDispo.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.actif}
                onCheckedChange={(actif) => setForm((f) => ({ ...f, actif }))}
              />
              <Label>Active</Label>
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

"use client"

import * as React from "react"
import {
  Building2,
  FileText,
  Hash,
  ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  Save,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { useParametres, useParametresMutation } from "@/hooks/use-parametres"
import { WhatsAppPhoneInput } from "@/components/ui/whatsapp-phone-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DashboardActionBar } from "@/components/layout/dashboard-action-bar"
import { formatWhatsAppPhoneDisplay } from "@/lib/phone"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"

type ParamRow = {
  id: string
  nomClinique?: string | null
  logo?: string | null
  adresse?: string | null
  telephone?: string | null
  email?: string | null
  numeroFactureDepart: number
  niu?: string | null
  registreCommerce?: string | null
  noteBasPage1?: string | null
  noteBasPage2?: string | null
  whatsappRapportCaisse1?: string | null
  whatsappRapportCaisse2?: string | null
}

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

function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-gray-700">
        {children}
      </Label>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

export default function ParametresPage() {
  const { data: raw, isLoading, error } = useParametres()
  const p = raw as ParamRow | null | undefined
  const { mutateAsync, isPending } = useParametresMutation()
  const logoInputRef = React.useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = React.useState(false)

  const [form, setForm] = React.useState({
    nomClinique: "",
    logo: "",
    adresse: "",
    telephone: "",
    email: "",
    numeroFactureDepart: "1",
    niu: "",
    registreCommerce: "",
    noteBasPage1: "",
    noteBasPage2: "",
    whatsappRapportCaisse1: "",
    whatsappRapportCaisse2: "",
  })

  React.useEffect(() => {
    if (!p) return
    setForm({
      nomClinique: p.nomClinique ?? "",
      logo: p.logo ?? "",
      adresse: p.adresse ?? "",
      telephone: p.telephone ?? "",
      email: p.email ?? "",
      numeroFactureDepart: String(p.numeroFactureDepart),
      niu: p.niu ?? "",
      registreCommerce: p.registreCommerce ?? "",
      noteBasPage1: p.noteBasPage1 ?? "",
      noteBasPage2: p.noteBasPage2 ?? "",
      whatsappRapportCaisse1: p.whatsappRapportCaisse1 ?? "",
      whatsappRapportCaisse2: p.whatsappRapportCaisse2 ?? "",
    })
  }, [p])

  const completion = React.useMemo(() => {
    const checks = [
      { label: "Nom clinique", ok: !!form.nomClinique.trim() },
      { label: "Logo", ok: !!form.logo.trim() },
      { label: "Coordonnées", ok: !!(form.telephone.trim() || form.email.trim()) },
      { label: "NIU / RC", ok: !!(form.niu.trim() || form.registreCommerce.trim()) },
      {
        label: "WhatsApp rapports",
        ok: !!(form.whatsappRapportCaisse1.trim() || form.whatsappRapportCaisse2.trim()),
      },
    ]
    const done = checks.filter((c) => c.ok).length
    return { checks, done, total: checks.length }
  }, [form])

  async function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.set("file", file)
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd })
      const data: unknown = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Téléversement impossible"
        toast.error(msg)
        return
      }
      const url =
        typeof data === "object" &&
        data !== null &&
        "url" in data &&
        typeof (data as { url: unknown }).url === "string"
          ? (data as { url: string }).url
          : null
      if (!url) {
        toast.error("Réponse serveur invalide")
        return
      }
      setForm((f) => ({ ...f, logo: url }))
      toast.success("Logo téléversé — pensez à enregistrer.")
    } catch {
      toast.error("Erreur réseau lors du téléversement")
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!p) {
      toast.error("Aucune ligne paramètres en base.")
      return
    }
    const n = Number.parseInt(form.numeroFactureDepart, 10)
    if (Number.isNaN(n) || n < 1) {
      toast.error("Numéro de départ de facture invalide.")
      return
    }
    try {
      await mutateAsync({
        id: p.id,
        nomClinique: form.nomClinique.trim() || null,
        logo: form.logo.trim() || null,
        adresse: form.adresse.trim() || null,
        telephone: form.telephone.trim() || null,
        email: form.email.trim() || null,
        numeroFactureDepart: n,
        niu: form.niu.trim() || null,
        registreCommerce: form.registreCommerce.trim() || null,
        noteBasPage1: form.noteBasPage1.trim() || null,
        noteBasPage2: form.noteBasPage2.trim() || null,
        whatsappRapportCaisse1: form.whatsappRapportCaisse1.trim() || null,
        whatsappRapportCaisse2: form.whatsappRapportCaisse2.trim() || null,
      })
      toast.success("Paramètres enregistrés.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-[#cd3b86]" />
        <p className="text-sm text-gray-500">Chargement des paramètres…</p>
      </div>
    )
  }

  if (error || p == null) {
    return (
      <Card className={cn(cardSurface, "border-dashed")}>
        <CardContent className="py-16 text-center">
          <Building2 className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-700">Paramètres introuvables</p>
          <p className="mt-1 text-sm text-gray-500">
            Exécutez le seed Prisma après migration.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Paramètres clinique
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Identité, facturation, notifications et mentions sur les documents
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium",
            completion.done === completion.total
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          {completion.done}/{completion.total} sections renseignées
        </Badge>
      </div>

      {/* Aperçu en-tête document */}
      <Card className={cn(cardSurface, "overflow-hidden")}>
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#cd3b86]/5 to-transparent px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Aperçu en-tête document
          </p>
        </div>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              {form.logo.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logo.trim()}
                  alt=""
                  className="max-h-full max-w-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-lg font-bold text-gray-900">
                {form.nomClinique.trim() || "Nom de la clinique"}
              </p>
              {form.adresse && (
                <p className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {form.adresse}
                </p>
              )}
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                {form.telephone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {form.telephone}
                  </span>
                )}
                {form.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {form.email}
                  </span>
                )}
              </p>
              {(form.niu || form.registreCommerce) && (
                <p className="text-xs text-gray-400">
                  {[form.niu && `NIU ${form.niu}`, form.registreCommerce && `RC ${form.registreCommerce}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {completion.checks.map(({ label, ok }) => (
          <span
            key={label}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[11px] font-medium",
              ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-gray-50 text-gray-500",
            )}
          >
            {label}
          </span>
        ))}
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* Identité */}
          <section className={cn(cardSurface, "overflow-hidden")}>
            <SectionHeader
              icon={Building2}
              title="Identité de la structure"
              description="Affichée sur factures, reçus et documents imprimés."
            />
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <FieldLabel htmlFor="nomClinique">Nom de la clinique</FieldLabel>
                <Input
                  id="nomClinique"
                  className="rounded-xl"
                  value={form.nomClinique}
                  onChange={(e) => setForm((f) => ({ ...f, nomClinique: e.target.value }))}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <FieldLabel hint="PNG, JPEG, WebP ou SVG — max 2 Mo">
                  Logo
                </FieldLabel>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    onChange={(e) => void handleLogoFileChange(e)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-lg shrink-0"
                    disabled={logoUploading}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logoUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Téléverser
                  </Button>
                  <Input
                    id="logo-url"
                    placeholder="/uploads/logos/… ou https://…"
                    className="rounded-xl flex-1"
                    value={form.logo}
                    onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="adresse">Adresse</FieldLabel>
                <Input
                  id="adresse"
                  className="rounded-xl"
                  value={form.adresse}
                  onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="telephone">Téléphone</FieldLabel>
                  <Input
                    id="telephone"
                    className="rounded-xl"
                    value={form.telephone}
                    onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    className="rounded-xl"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Facturation */}
          <section className={cn(cardSurface, "overflow-hidden h-fit")}>
            <SectionHeader
              icon={Receipt}
              title="Facturation"
              description="Numérotation et identifiants légaux."
            />
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <FieldLabel htmlFor="numeroFactureDepart" hint="Prochain numéro séquentiel">
                  N° départ facture
                </FieldLabel>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="numeroFactureDepart"
                    type="number"
                    min={1}
                    className="rounded-xl pl-9 tabular-nums"
                    value={form.numeroFactureDepart}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, numeroFactureDepart: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="niu">NIU</FieldLabel>
                <Input
                  id="niu"
                  className="rounded-xl"
                  value={form.niu}
                  onChange={(e) => setForm((f) => ({ ...f, niu: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="registreCommerce">Registre de commerce</FieldLabel>
                <Input
                  id="registreCommerce"
                  className="rounded-xl"
                  value={form.registreCommerce}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, registreCommerce: e.target.value }))
                  }
                />
              </div>
            </div>
          </section>
        </div>

        {/* WhatsApp */}
        <section className={cn(cardSurface, "overflow-hidden")}>
          <SectionHeader
            icon={MessageCircle}
            title="Rapports caisse WhatsApp"
            description="Responsables notifiés à chaque clôture de caisse (WasenderApi)."
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-gray-100 p-4">
              <FieldLabel htmlFor="whatsappRapportCaisse1">Responsable 1</FieldLabel>
              <WhatsAppPhoneInput
                id="whatsappRapportCaisse1"
                value={form.whatsappRapportCaisse1}
                onChange={(v) => setForm((f) => ({ ...f, whatsappRapportCaisse1: v }))}
              />
              {form.whatsappRapportCaisse1 && (
                <p className="text-xs text-emerald-600">
                  {formatWhatsAppPhoneDisplay(form.whatsappRapportCaisse1)}
                </p>
              )}
            </div>
            <div className="space-y-2 rounded-xl border border-gray-100 p-4">
              <FieldLabel htmlFor="whatsappRapportCaisse2">Responsable 2 (optionnel)</FieldLabel>
              <WhatsAppPhoneInput
                id="whatsappRapportCaisse2"
                value={form.whatsappRapportCaisse2}
                onChange={(v) => setForm((f) => ({ ...f, whatsappRapportCaisse2: v }))}
              />
              {form.whatsappRapportCaisse2 && (
                <p className="text-xs text-emerald-600">
                  {formatWhatsAppPhoneDisplay(form.whatsappRapportCaisse2)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Mentions */}
        <section className={cn(cardSurface, "overflow-hidden")}>
          <SectionHeader
            icon={FileText}
            title="Mentions (bas de page)"
            description="Textes libres en pied de facture ou de document."
          />
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel htmlFor="noteBasPage1">Note 1</FieldLabel>
              <Textarea
                id="noteBasPage1"
                rows={4}
                className="rounded-xl resize-none"
                value={form.noteBasPage1}
                onChange={(e) => setForm((f) => ({ ...f, noteBasPage1: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="noteBasPage2">Note 2</FieldLabel>
              <Textarea
                id="noteBasPage2"
                rows={4}
                className="rounded-xl resize-none"
                value={form.noteBasPage2}
                onChange={(e) => setForm((f) => ({ ...f, noteBasPage2: e.target.value }))}
              />
            </div>
          </div>
        </section>

        <DashboardActionBar>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <p className="hidden text-xs text-gray-400 sm:block">
              ID enregistrement · {p.id}
            </p>
            <Button
              type="submit"
              className="ml-auto gap-2 rounded-lg bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white shadow-sm"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer les paramètres
            </Button>
          </div>
        </DashboardActionBar>
      </form>
    </div>
  )
}

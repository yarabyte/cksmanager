"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Activity,
  Loader2,
  Save,
  Scale,
  HeartPulse,
  FlaskConical,
  Baby,
  CalendarDays,
  Stethoscope,
  UserRound,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import {
  useParametrePatientByVisite,
  useParametrePatientMutations,
} from "@/hooks/use-parametres-patient"
import { computeImc } from "@/lib/medical/imc"
import {
  BANDELETTE_NITRITE_VALUES,
  BANDELETTE_PH_VALUES,
  BANDELETTE_QUALI_VALUES,
  BANDELETTE_SUCRE_VALUES,
  bandeletteNitriteLabels,
  bandeletteQualiLabels,
  bandeletteSucreLabels,
} from "@/lib/medical/bandelette"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const fieldInput =
  "rounded-xl h-11 bg-white border-gray-200 shadow-sm focus-visible:bg-white focus-visible:ring-[#cd3b86]/25 transition-colors"
const fieldSelect =
  "rounded-xl h-11 bg-white border-gray-200 shadow-sm w-full focus:ring-[#cd3b86]/25"

function imcCategory(imc: number): { label: string; className: string } {
  if (imc < 18.5) return { label: "Maigreur", className: "text-sky-700 bg-sky-50" }
  if (imc < 25) return { label: "Normal", className: "text-[#58a639] bg-[#58a639]/10" }
  if (imc < 30) return { label: "Surpoids", className: "text-amber-700 bg-amber-50" }
  return { label: "Obésité", className: "text-red-700 bg-red-50" }
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
  accent = "pink",
}: {
  title: string
  description?: string
  icon: React.ElementType
  children: React.ReactNode
  accent?: "pink" | "green" | "blue" | "amber"
}) {
  const accentMap = {
    pink: "bg-[#cd3b86]/10 text-[#cd3b86]",
    green: "bg-[#58a639]/10 text-[#58a639]",
    blue: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
  }
  return (
    <section
      className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-start gap-3 border-b border-gray-50 bg-gradient-to-r from-gray-50/80 to-white px-5 py-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            accentMap[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="font-['DM_Sans',sans-serif] text-base font-bold text-gray-900">
            {title}
          </h3>
          {description ? (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-gray-600">
        {label}
        {required ? <span className="text-[#cd3b86]"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  )
}

type FormState = {
  poidsKg: string
  tailleCm: string
  pas: string
  pad: string
  pouls: string
  temperatureC: string
  nitrite: string
  sang: string
  leucocytes: string
  proteine: string
  cetones: string
  ph: string
  sucre: string
  perimetreCranien: string
  perimetreBrachial: string
  frequenceRespiratoire: string
  sao2: string
}

const emptyForm: FormState = {
  poidsKg: "",
  tailleCm: "",
  pas: "",
  pad: "",
  pouls: "",
  temperatureC: "",
  nitrite: "negatif",
  sang: "negatif",
  leucocytes: "negatif",
  proteine: "negatif",
  cetones: "negatif",
  ph: "6",
  sucre: "",
  perimetreCranien: "",
  perimetreBrachial: "",
  frequenceRespiratoire: "",
  sao2: "",
}

export default function MedicalParametresDetailPage() {
  const params = useParams()
  const router = useRouter()
  const visiteId = params.visiteId as string

  const { data, isPending, error } = useParametrePatientByVisite(visiteId)
  const { upsert } = useParametrePatientMutations()
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    if (!data || hydrated) return
    const p = data.parametre
    if (p) {
      setForm({
        poidsKg: p.poidsKg,
        tailleCm: p.tailleCm,
        pas: String(p.pas),
        pad: String(p.pad),
        pouls: String(p.pouls),
        temperatureC: p.temperatureC,
        nitrite: p.nitrite,
        sang: p.sang,
        leucocytes: p.leucocytes,
        proteine: p.proteine,
        cetones: p.cetones,
        ph: p.ph,
        sucre: p.sucre ?? "",
        perimetreCranien: p.perimetreCranien ?? "",
        perimetreBrachial: p.perimetreBrachial ?? "",
        frequenceRespiratoire:
          p.frequenceRespiratoire != null ? String(p.frequenceRespiratoire) : "",
        sao2: p.sao2 != null ? String(p.sao2) : "",
      })
    }
    setHydrated(true)
  }, [data, hydrated])

  const imcValue = React.useMemo(() => {
    const w = Number.parseFloat(form.poidsKg)
    const h = Number.parseFloat(form.tailleCm)
    if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0) return null
    return computeImc(w, h)
  }, [form.poidsKg, form.tailleCm])

  const imcMeta = imcValue != null ? imcCategory(imcValue) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data?.eligible) {
      toast.error("Visite non éligible.")
      return
    }
    try {
      await upsert.mutateAsync({
        visiteId,
        poidsKg: form.poidsKg,
        tailleCm: form.tailleCm,
        pas: form.pas,
        pad: form.pad,
        pouls: form.pouls,
        temperatureC: form.temperatureC,
        nitrite: form.nitrite,
        sang: form.sang,
        leucocytes: form.leucocytes,
        proteine: form.proteine,
        cetones: form.cetones,
        ph: form.ph,
        sucre: form.sucre || null,
        perimetreCranien: form.perimetreCranien || null,
        perimetreBrachial: form.perimetreBrachial || null,
        frequenceRespiratoire: form.frequenceRespiratoire || null,
        sao2: form.sao2 || null,
        requirePediatrique: data.visite.isPediatrique,
      })
      toast.success("Paramètres enregistrés.")
      router.push("/medical/salle-attente")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d’enregistrement")
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-28">
        <Loader2 className="h-10 w-10 animate-spin text-[#cd3b86]" />
        <p className="text-sm text-gray-500">Chargement des paramètres…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6 pb-10">
        <Button variant="ghost" className="rounded-xl -ml-2" asChild>
          <Link href="/medical/parametres">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
          <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-bold text-gray-800">Visite introuvable</p>
          <Button asChild className="mt-6 rounded-xl bg-[#cd3b86] hover:bg-[#b8307a]">
            <Link href="/medical/parametres">Retour à la liste</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { visite, eligible, parametre } = data
  const busy = upsert.isPending
  const alreadySaved = !!parametre

  return (
    <div className="relative space-y-5 pb-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(205,59,134,0.08),_transparent_60%)]"
      />

      <Button
        variant="ghost"
        className="rounded-xl -ml-2 w-fit text-gray-500 hover:text-gray-800"
        asChild
      >
        <Link href="/medical/parametres">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Paramètres
        </Link>
      </Button>

      {/* Header patient */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="h-1.5 bg-gradient-to-r from-[#cd3b86] via-[#e879b3] to-[#cd3b86]" />
        <div className="px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#cd3b86]/10 text-[#cd3b86]">
                <UserRound className="h-7 w-7" />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#cd3b86]">
                  Médical · Paramètres
                </p>
                <h1 className="font-['DM_Sans',sans-serif] text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug break-words">
                  {visite.patientLabel ?? `Patient #${visite.patientId}`}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                    <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                    {format(new Date(visite.dateVisite), "dd MMM yyyy · HH:mm", {
                      locale: fr,
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                    <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                    {visite.motifLibelle}
                  </span>
                  {visite.patientAge != null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                      {visite.patientAge} an{visite.patientAge > 1 ? "s" : ""}
                    </span>
                  )}
                  {visite.isPediatrique && (
                    <Badge className="rounded-full border-0 bg-[#cd3b86]/10 text-[#cd3b86] hover:bg-[#cd3b86]/10">
                      Pédiatrique
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="shrink-0">
              {alreadySaved ? (
                <Badge className="gap-1.5 rounded-full border-0 bg-[#58a639]/10 text-[#58a639] hover:bg-[#58a639]/10 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Déjà saisis
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="gap-1.5 rounded-full border-0 bg-amber-50 text-amber-700 px-3 py-1.5"
                >
                  À compléter
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {!eligible && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <p>
            Cette visite n’est pas éligible : la part patient (feuille ou facture) doit
            être soldée.
          </p>
        </div>
      )}

      <form
        id="parametres-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5"
      >
          <FormSection
            title="Poids, taille & IMC"
            description="L’IMC se calcule automatiquement"
            icon={Scale}
            accent="green"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Poids" htmlFor="poids" required hint="En kilogrammes">
                <Input
                  id="poids"
                  type="number"
                  step="0.1"
                  min={0}
                  className={cn(fieldInput, "tabular-nums")}
                  value={form.poidsKg}
                  onChange={(e) => setForm((s) => ({ ...s, poidsKg: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Taille" htmlFor="taille" required hint="En cm, ex. 190">
                <Input
                  id="taille"
                  type="number"
                  step="0.1"
                  min={0}
                  placeholder="190"
                  className={cn(fieldInput, "tabular-nums")}
                  value={form.tailleCm}
                  onChange={(e) => setForm((s) => ({ ...s, tailleCm: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <div
              className={cn(
                "rounded-xl border px-4 py-4 flex items-center justify-between gap-4 transition-colors",
                imcValue != null
                  ? "border-[#cd3b86]/20 bg-gradient-to-r from-[#cd3b86]/5 to-transparent"
                  : "border-dashed border-gray-200 bg-gray-50/50",
              )}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  IMC
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">kg/m² · calcul auto</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <span
                  className={cn(
                    "font-['DM_Sans',sans-serif] text-3xl font-extrabold tabular-nums",
                    imcValue != null ? "text-gray-900" : "text-gray-300",
                  )}
                >
                  {imcValue != null ? imcValue.toFixed(1) : "—"}
                </span>
                {imcMeta && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      imcMeta.className,
                    )}
                  >
                    {imcMeta.label}
                  </span>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection
            title="PAS, PAD, pouls & température"
            description="Constantes vitales"
            icon={HeartPulse}
            accent="pink"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="PAS" htmlFor="pas" required hint="mmHg">
                <Input
                  id="pas"
                  type="number"
                  min={1}
                  className={cn(fieldInput, "tabular-nums")}
                  value={form.pas}
                  onChange={(e) => setForm((s) => ({ ...s, pas: e.target.value }))}
                  required
                />
              </Field>
              <Field label="PAD" htmlFor="pad" required hint="mmHg">
                <Input
                  id="pad"
                  type="number"
                  min={1}
                  className={cn(fieldInput, "tabular-nums")}
                  value={form.pad}
                  onChange={(e) => setForm((s) => ({ ...s, pad: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Pouls" htmlFor="pouls" required hint="bpm">
                <Input
                  id="pouls"
                  type="number"
                  min={1}
                  className={cn(fieldInput, "tabular-nums")}
                  value={form.pouls}
                  onChange={(e) => setForm((s) => ({ ...s, pouls: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Température" htmlFor="temp" required hint="°C">
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  min={0}
                  className={cn(fieldInput, "tabular-nums")}
                  value={form.temperatureC}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, temperatureC: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            title="Bandelette urinaire"
            description="Résultats semi-quantitatifs"
            icon={FlaskConical}
            accent="blue"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nitrite" required>
                <Select
                  value={form.nitrite}
                  onValueChange={(v) => setForm((s) => ({ ...s, nitrite: v }))}
                >
                  <SelectTrigger className={fieldSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BANDELETTE_NITRITE_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {bandeletteNitriteLabels[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sang" required>
                <Select
                  value={form.sang}
                  onValueChange={(v) => setForm((s) => ({ ...s, sang: v }))}
                >
                  <SelectTrigger className={fieldSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BANDELETTE_QUALI_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {bandeletteQualiLabels[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Leucocytes" required>
                <Select
                  value={form.leucocytes}
                  onValueChange={(v) => setForm((s) => ({ ...s, leucocytes: v }))}
                >
                  <SelectTrigger className={fieldSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BANDELETTE_QUALI_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {bandeletteQualiLabels[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Protéine" required>
                <Select
                  value={form.proteine}
                  onValueChange={(v) => setForm((s) => ({ ...s, proteine: v }))}
                >
                  <SelectTrigger className={fieldSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BANDELETTE_QUALI_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {bandeletteQualiLabels[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cétones" required>
                <Select
                  value={form.cetones}
                  onValueChange={(v) => setForm((s) => ({ ...s, cetones: v }))}
                >
                  <SelectTrigger className={fieldSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BANDELETTE_QUALI_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {bandeletteQualiLabels[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="pH" required>
                <Select
                  value={form.ph}
                  onValueChange={(v) => setForm((s) => ({ ...s, ph: v }))}
                >
                  <SelectTrigger className={fieldSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BANDELETTE_PH_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sucre" hint="Optionnel">
                <Select
                  value={form.sucre || "none"}
                  onValueChange={(v) =>
                    setForm((s) => ({ ...s, sucre: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger className={fieldSelect}>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">—</SelectItem>
                    {BANDELETTE_SUCRE_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {bandeletteSucreLabels[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FormSection>

          {visite.isPediatrique && (
            <FormSection
              title="Pédiatrique"
              description="Patient de moins de 15 ans"
              icon={Baby}
              accent="amber"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Périmètre crânien" htmlFor="pc" required hint="cm">
                  <Input
                    id="pc"
                    type="number"
                    step="0.1"
                    min={0}
                    className={cn(fieldInput, "tabular-nums")}
                    value={form.perimetreCranien}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, perimetreCranien: e.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Périmètre brachial" htmlFor="pb" required hint="cm">
                  <Input
                    id="pb"
                    type="number"
                    step="0.1"
                    min={0}
                    className={cn(fieldInput, "tabular-nums")}
                    value={form.perimetreBrachial}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, perimetreBrachial: e.target.value }))
                    }
                    required
                  />
                </Field>
                <Field
                  label="Fréquence respiratoire"
                  htmlFor="fr"
                  required
                  hint="cycles/min"
                >
                  <Input
                    id="fr"
                    type="number"
                    min={1}
                    className={cn(fieldInput, "tabular-nums")}
                    value={form.frequenceRespiratoire}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        frequenceRespiratoire: e.target.value,
                      }))
                    }
                    required
                  />
                </Field>
                <Field label="SaO2" htmlFor="sao2" required hint="%">
                  <Input
                    id="sao2"
                    type="number"
                    min={0}
                    max={100}
                    className={cn(fieldInput, "tabular-nums")}
                    value={form.sao2}
                    onChange={(e) => setForm((s) => ({ ...s, sao2: e.target.value }))}
                    required
                  />
                </Field>
              </div>
            </FormSection>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => router.push("/medical/parametres")}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-11 bg-[#cd3b86] hover:bg-[#b8307a] text-white min-w-[160px]"
              disabled={busy || !eligible}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {alreadySaved ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </div>
        </form>
    </div>
  )
}

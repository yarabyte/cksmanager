"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DatePickerFr, DateRangePickerFr, DateTimePickerFr } from "@/components/ui/date-picker-fr"
import { Combobox, MultiCombobox } from "@/components/ui/combobox"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Building2,
  Shield,
  Heart,
  Stethoscope,
  Pill,
  FlaskConical,
  Eye,
  Code2,
  Copy,
  Check,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// ─── Code snippet helper ──────────────────────────────────────────────────────
function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className={cn("relative rounded-md bg-muted text-xs", className)}>
      <button
        onClick={copy}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors"
        aria-label="Copier"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="scrollbar-thin overflow-x-auto p-4 pr-8 font-sans leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  id,
  title,
  description,
  badge,
  children,
}: {
  id: string
  title: string
  description?: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

// ─── Preview + Code tabs ──────────────────────────────────────────────────────
function PreviewCard({
  title,
  code,
  children,
}: {
  title?: string
  code?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      {title && (
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : "pt-6"}>
        {code ? (
          <Tabs defaultValue="preview">
            <TabsList className="mb-4 h-8 text-xs">
              <TabsTrigger value="preview" className="gap-1.5 text-xs">
                <Eye className="h-3.5 w-3.5" /> Apercu
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-1.5 text-xs">
                <Code2 className="h-3.5 w-3.5" /> Code
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview">{children}</TabsContent>
            <TabsContent value="code">
              <CodeBlock code={code} />
            </TabsContent>
          </Tabs>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

// ─── Nav sidebar data ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "date-picker", label: "Date Picker" },
  { id: "date-range", label: "Date Range" },
  { id: "combobox", label: "Combobox (Select2)" },
  { id: "multi-select", label: "Multi-select" },
  { id: "rich-text", label: "Editeur de texte" },
  { id: "phone-input", label: "Telephone" },
  { id: "inputs", label: "Inputs" },
  { id: "selects", label: "Selects" },
  { id: "toggles", label: "Bascules & Cases" },
  { id: "badges", label: "Badges" },
  { id: "alerts", label: "Alertes" },
  { id: "avatars", label: "Avatars" },
  { id: "progress", label: "Progression" },
]

// ─── Combobox options ─────────────────────────────────────────────────────────
const SPECIALITES: import("@/components/ui/combobox").ComboboxOption[] = [
  { value: "gen", label: "Médecine générale", icon: <Stethoscope className="h-4 w-4 text-primary" />, group: "Médecine" },
  { value: "card", label: "Cardiologie", icon: <Heart className="h-4 w-4 text-rose-500" />, group: "Médecine" },
  { value: "oph", label: "Ophtalmologie", icon: <Eye className="h-4 w-4 text-blue-500" />, group: "Médecine" },
  { value: "phar", label: "Pharmacie", icon: <Pill className="h-4 w-4 text-amber-500" />, group: "Paramedical" },
  { value: "bio", label: "Biologie", icon: <FlaskConical className="h-4 w-4 text-purple-500" />, group: "Paramedical" },
]

const ASSUREURS: import("@/components/ui/combobox").ComboboxOption[] = [
  { value: "cnam", label: "CNAM", description: "80% couverture", icon: <Shield className="h-4 w-4 text-blue-500" /> },
  { value: "ghs", label: "GHS Assurance", description: "70% couverture", icon: <Building2 className="h-4 w-4 text-green-500" /> },
  { value: "activa", label: "Activa", description: "75% couverture", icon: <Building2 className="h-4 w-4 text-orange-500" /> },
  { value: "saham", label: "Saham", description: "65% couverture", icon: <Building2 className="h-4 w-4 text-purple-500" /> },
  { value: "nsia", label: "NSIA", description: "72% couverture", icon: <Building2 className="h-4 w-4 text-red-500" /> },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComposantsPage() {
  // Date picker states
  const [date, setDate] = React.useState<Date | undefined>()
  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  // Combobox states
  const [specialite, setSpecialite] = React.useState<string | undefined>()
  const [assureur, setAssureur] = React.useState<string | undefined>()
  const [selectedAssureurs, setSelectedAssureurs] = React.useState<string[]>([])

  // Rich text states
  const [richContent, setRichContent] = React.useState("")
  const [sliderValue, setSliderValue] = React.useState([60])
  const [phone, setPhone] = React.useState("")

  return (
    <div className="flex gap-8 px-6 py-6">
      {/* Sticky sidebar nav */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Composants
          </p>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-12 pb-16">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bibliothèque de composants</h1>
          <p className="mt-1 text-muted-foreground">
            Composants réutilisables pour les formulaires — localisés en français.
          </p>
        </div>

        {/* ── Date Picker ── */}
        <Section
          id="date-picker"
          title="Date Picker"
          description="Sélecteur de date avec calendrier localisé en français, navigation par mois/année."
          badge="date-fns/locale/fr"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <PreviewCard
              title="Standard"
              code={`import { DatePickerFr } from "@/components/ui/date-picker-fr"

const [date, setDate] = useState<Date | undefined>()

<DatePickerFr
  value={date}
  onChange={setDate}
  placeholder="Sélectionner une date"
/>`}
            >
              <div className="space-y-3">
                <Label>Date de naissance</Label>
                <DatePickerFr
                  value={date}
                  onChange={setDate}
                  placeholder="Sélectionner une date"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
                {date && (
                  <p className="text-xs text-muted-foreground">
                    Valeur: <code className="font-sans">{date.toISOString()}</code>
                  </p>
                )}
              </div>
            </PreviewCard>

            <PreviewCard
              title="Désactivé"
            >
              <div className="space-y-3">
                <Label>Date (lecture seule)</Label>
                <DatePickerFr
                  value={new Date("2024-03-15")}
                  disabled
                />
              </div>
            </PreviewCard>
          </div>
        </Section>

        {/* ── Date Range ── */}
        <Section
          id="date-range"
          title="Date Range Picker"
          description="Sélection d'une plage de dates avec affichage sur deux mois."
        >
          <PreviewCard
            code={`import { DateRangePickerFr } from "@/components/ui/date-picker-fr"

const [range, setRange] = useState({ from: undefined, to: undefined })

<DateRangePickerFr
  value={range}
  onChange={setRange}
  placeholder="Sélectionner une période"
/>`}
          >
            <div className="space-y-3">
              <Label>Période de filtrage</Label>
              <DateRangePickerFr
                value={dateRange}
                onChange={setDateRange}
                placeholder="Sélectionner une période"
              />
              {dateRange.from && (
                <p className="text-xs text-muted-foreground">
                  Du <code className="font-sans">{dateRange.from.toLocaleDateString("fr-FR")}</code>
                  {dateRange.to && (
                    <> au <code className="font-sans">{dateRange.to.toLocaleDateString("fr-FR")}</code></>
                  )}
                </p>
              )}
            </div>
          </PreviewCard>
        </Section>

        {/* ── Combobox ── */}
        <Section
          id="combobox"
          title="Combobox (Select2)"
          description="Sélecteur avec recherche intégrée, icônes, groupes et option d'effacement."
          badge="cmdk"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <PreviewCard
              title="Avec groupes et icônes"
              code={`import { Combobox } from "@/components/ui/combobox"

<Combobox
  options={SPECIALITES}
  value={specialite}
  onChange={setSpecialite}
  placeholder="Choisir une spécialité"
  searchPlaceholder="Rechercher..."
/>`}
            >
              <div className="space-y-3">
                <Label>Spécialité médicale</Label>
                <Combobox
                  options={SPECIALITES}
                  value={specialite}
                  onChange={setSpecialite}
                  placeholder="Choisir une spécialité"
                  searchPlaceholder="Rechercher une spécialité..."
                  emptyMessage="Aucune spécialité trouvée."
                />
                {specialite && (
                  <p className="text-xs text-muted-foreground">
                    Valeur: <code className="font-sans">{specialite}</code>
                  </p>
                )}
              </div>
            </PreviewCard>

            <PreviewCard
              title="Avec description"
            >
              <div className="space-y-3">
                <Label>Assureur</Label>
                <Combobox
                  options={ASSUREURS}
                  value={assureur}
                  onChange={setAssureur}
                  placeholder="Choisir un assureur"
                  searchPlaceholder="Rechercher un assureur..."
                  emptyMessage="Aucun assureur trouvé."
                />
              </div>
            </PreviewCard>
          </div>
        </Section>

        {/* ── Multi-select ── */}
        <Section
          id="multi-select"
          title="Multi-select"
          description="Sélection multiple avec badges et suppression individuelle."
        >
          <PreviewCard
            code={`import { MultiCombobox } from "@/components/ui/combobox"

<MultiCombobox
  options={ASSUREURS}
  value={selected}
  onChange={setSelected}
  placeholder="Sélectionner des assureurs"
  maxDisplay={3}
/>`}
          >
            <div className="space-y-3">
              <Label>Assureurs acceptés</Label>
              <MultiCombobox
                options={ASSUREURS}
                value={selectedAssureurs}
                onChange={setSelectedAssureurs}
                placeholder="Sélectionner des assureurs"
                searchPlaceholder="Rechercher..."
                maxDisplay={3}
              />
              {selectedAssureurs.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedAssureurs.length} sélectionné(s) :{" "}
                  <code className="font-sans">{selectedAssureurs.join(", ")}</code>
                </p>
              )}
            </div>
          </PreviewCard>
        </Section>

        {/* ── Rich Text Editor ── */}
        <Section
          id="rich-text"
          title="Editeur de texte riche"
          description="Editeur WYSIWYG avec barre d'outils complète (gras, italique, listes, titres, liens...)."
        >
          <PreviewCard
            code={`import { RichTextEditor } from "@/components/ui/rich-text-editor"

<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="Saisissez les observations..."
  minHeight={200}
/>`}
          >
            <div className="space-y-3">
              <Label>Observations cliniques</Label>
              <RichTextEditor
                value={richContent}
                onChange={setRichContent}
                placeholder="Saisissez vos observations cliniques..."
                minHeight={200}
              />
              {richContent && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Voir le HTML généré
                  </summary>
                  <CodeBlock code={richContent} className="mt-2" />
                </details>
              )}
            </div>
          </PreviewCard>
        </Section>

        {/* ── Phone Input ── */}
        <Section
          id="phone-input"
          title="Champ telephone"
          description="Input telephone avec sélecteur de pays et indicatif, orienté Afrique francophone."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <PreviewCard
              title="Avec sélecteur de pays"
              code={`import { PhoneInput } from "@/components/ui/phone-input"

<PhoneInput
  value={phone}
  onChange={setPhone}
  defaultCountry="CM"
  placeholder="6 xx xx xx xx"
/>`}
            >
              <div className="space-y-3">
                <Label>Numéro de téléphone</Label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  defaultCountry="CM"
                  placeholder="6 xx xx xx xx"
                />
                {phone && (
                  <p className="text-xs text-muted-foreground">
                    Valeur: <code className="font-sans">{phone}</code>
                  </p>
                )}
              </div>
            </PreviewCard>

            <PreviewCard title="Désactivé">
              <div className="space-y-3">
                <Label>Téléphone (lecture seule)</Label>
                <PhoneInput
                  value="+237 699 000 000"
                  defaultCountry="CM"
                  disabled
                />
              </div>
            </PreviewCard>
          </div>
        </Section>

        {/* ── Inputs ── */}
        <Section
          id="inputs"
          title="Champs de saisie"
          description="Variantes de champs texte : standard, avec icône, désactivé, erreur."
        >
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="input-std">Standard</Label>
                  <Input id="input-std" placeholder="Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-disabled">Désactivé</Label>
                  <Input id="input-disabled" value="Valeur fixe" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-error" className="text-destructive">
                    Erreur
                  </Label>
                  <Input
                    id="input-error"
                    placeholder="Champ requis"
                    className="border-destructive focus-visible:ring-destructive"
                  />
                  <p className="text-xs text-destructive">Ce champ est obligatoire.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-textarea">Zone de texte</Label>
                  <Textarea id="input-textarea" placeholder="Observations..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-date">Date (DatePickerFr)</Label>
                  <DatePickerFr id="input-date" placeholder="Choisir une date" />
                </div>
                <div className="space-y-2">
                  <Label>Date et heure (DateTimePickerFr)</Label>
                  <DateTimePickerFr />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-number">Numérique</Label>
                  <Input id="input-number" type="number" placeholder="0" min={0} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ── Selects ── */}
        <Section
          id="selects"
          title="Listes déroulantes"
          description="Select natif shadcn/ui."
        >
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sexe</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Groupe sanguin</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Désactivé" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Actif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ── Toggles & Checkboxes ── */}
        <Section
          id="toggles"
          title="Bascules et cases a cocher"
          description="Switch, checkbox et radio group."
        >
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-8 sm:grid-cols-2">
                {/* Switches */}
                <div className="space-y-4">
                  <p className="text-sm font-medium">Interrupteurs</p>
                  {[
                    { id: "sw1", label: "Notifications activées", defaultChecked: true },
                    { id: "sw2", label: "Mode hors-ligne", defaultChecked: false },
                    { id: "sw3", label: "Accès assurance (désactivé)", defaultChecked: false, disabled: true },
                  ].map((sw) => (
                    <div key={sw.id} className="flex items-center gap-3">
                      <Switch id={sw.id} defaultChecked={sw.defaultChecked} disabled={sw.disabled} />
                      <Label htmlFor={sw.id} className={sw.disabled ? "text-muted-foreground" : ""}>
                        {sw.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Checkboxes */}
                <div className="space-y-4">
                  <p className="text-sm font-medium">Cases a cocher</p>
                  {[
                    { id: "cb1", label: "Hypertension artérielle" },
                    { id: "cb2", label: "Diabète de type 2" },
                    { id: "cb3", label: "Asthme (désactivé)", disabled: true },
                  ].map((cb) => (
                    <div key={cb.id} className="flex items-center gap-3">
                      <Checkbox id={cb.id} disabled={cb.disabled} />
                      <Label htmlFor={cb.id} className={cb.disabled ? "text-muted-foreground" : ""}>
                        {cb.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Radio group */}
                <div className="space-y-4">
                  <p className="text-sm font-medium">Boutons radio</p>
                  <RadioGroup defaultValue="payante">
                    {[
                      { value: "gratuite", label: "Consultation gratuite" },
                      { value: "payante", label: "Consultation payante" },
                      { value: "urgence", label: "Urgence" },
                    ].map((r) => (
                      <div key={r.value} className="flex items-center gap-3">
                        <RadioGroupItem value={r.value} id={`r-${r.value}`} />
                        <Label htmlFor={`r-${r.value}`}>{r.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Slider */}
                <div className="space-y-4">
                  <p className="text-sm font-medium">
                    Curseur — Taux de couverture : <span className="text-primary">{sliderValue[0]}%</span>
                  </p>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ── Badges ── */}
        <Section
          id="badges"
          title="Badges"
          description="Indicateurs de statut pour visites, factures, rôles."
        >
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Variants</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Statuts visites</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "En attente", classes: "bg-amber-100 text-amber-800 border-amber-200" },
                      { label: "En consultation", classes: "bg-blue-100 text-blue-800 border-blue-200" },
                      { label: "Terminée", classes: "bg-emerald-100 text-emerald-800 border-emerald-200" },
                      { label: "Annulée", classes: "bg-rose-100 text-rose-800 border-rose-200" },
                      { label: "Facturée", classes: "bg-purple-100 text-purple-800 border-purple-200" },
                    ].map((s) => (
                      <Badge key={s.label} variant="outline" className={s.classes}>{s.label}</Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Statuts factures</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Brouillon", classes: "bg-slate-100 text-slate-700 border-slate-200" },
                      { label: "En attente", classes: "bg-amber-100 text-amber-800 border-amber-200" },
                      { label: "Payée", classes: "bg-emerald-100 text-emerald-800 border-emerald-200" },
                      { label: "Annulée", classes: "bg-rose-100 text-rose-800 border-rose-200" },
                      { label: "Partiellement payée", classes: "bg-orange-100 text-orange-800 border-orange-200" },
                    ].map((s) => (
                      <Badge key={s.label} variant="outline" className={s.classes}>{s.label}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ── Alerts ── */}
        <Section
          id="alerts"
          title="Alertes"
          description="Messages de retour : information, avertissement, erreur, succès."
        >
          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Le dossier patient a été mis à jour. Les modifications sont enregistrées.
              </AlertDescription>
            </Alert>
            <Alert className="border-amber-200 bg-amber-50 text-amber-800 [&>svg]:text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Avertissement</AlertTitle>
              <AlertDescription>
                Ce patient a une allergie documentée à la pénicilline.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Impossible de sauvegarder. Vérifiez votre connexion et réessayez.
              </AlertDescription>
            </Alert>
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 [&>svg]:text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>
                La facture a été générée et envoyée au patient avec succès.
              </AlertDescription>
            </Alert>
          </div>
        </Section>

        {/* ── Avatars ── */}
        <Section
          id="avatars"
          title="Avatars"
          description="Initiales et tailles différentes."
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-end gap-4">
                {(
                  [
                    { size: "h-8 w-8", text: "text-xs", initials: "AB", bg: "bg-primary/10 text-primary" },
                    { size: "h-10 w-10", text: "text-sm", initials: "CD", bg: "bg-accent/10 text-accent" },
                    { size: "h-12 w-12", text: "text-sm", initials: "EF", bg: "bg-blue-100 text-blue-700" },
                    { size: "h-14 w-14", text: "text-base", initials: "GH", bg: "bg-amber-100 text-amber-700" },
                    { size: "h-16 w-16", text: "text-lg", initials: "IJ", bg: "bg-emerald-100 text-emerald-700" },
                  ] as const
                ).map((a, i) => (
                  <Avatar key={i} className={a.size}>
                    <AvatarFallback className={cn(a.bg, a.text, "font-semibold")}>
                      {a.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ── Progress ── */}
        <Section
          id="progress"
          title="Barres de progression"
          description="Suivi de complétion de formulaires, chargement, taux."
        >
          <Card>
            <CardContent className="pt-6 space-y-6">
              {[
                { label: "Dossier patient complété", value: 80, color: "bg-primary" },
                { label: "Taux de couverture assurance", value: 65, color: "bg-blue-500" },
                { label: "Factures réglées ce mois", value: 48, color: "bg-accent" },
                { label: "Stock médicaments critiques", value: 15, color: "bg-destructive" },
              ].map((p) => (
                <div key={p.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>{p.label}</span>
                    <span className="font-medium">{p.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all", p.color)}
                      style={{ width: `${p.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  )
}

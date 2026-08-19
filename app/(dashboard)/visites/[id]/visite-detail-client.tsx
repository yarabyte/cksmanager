"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  FileText,
  Phone,
  Hash,
  CheckCircle2,
  Edit3,
  AlertTriangle,
  Loader2,
  Activity,
  ScrollText,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { VisiteDetail } from "@/app/actions/visites"
import { updateVisiteStatut } from "@/app/actions/visites"
import {
  formatBirthAge,
  formatCurrency,
  formatPatientIdentityLine,
  getInitials,
} from "@/lib/formatting"
import type { FeuilleListRow } from "@/lib/types/feuille-circulation"
import {
  ALL_STATUTS,
  STATUT_CONFIG,
  VisiteStatutBadge,
  type VisiteStatut,
} from "@/components/visites/visite-statut-badge"
import { cn } from "@/lib/utils"

const STEP_CIRCLE: Record<VisiteStatut, string> = {
  EN_ATTENTE: "border-amber-400 bg-amber-400",
  EN_COURS: "border-blue-500 bg-blue-500",
  TERMINEE: "border-emerald-500 bg-emerald-500",
  FACTUREE: "border-[#cd3b86] bg-[#cd3b86]",
}

const STEP_BORDER: Record<VisiteStatut, string> = {
  EN_ATTENTE: "border-amber-400",
  EN_COURS: "border-blue-500",
  TERMINEE: "border-emerald-500",
  FACTUREE: "border-[#cd3b86]",
}

function StatutStepper({
  current,
  onStep,
  loading,
}: {
  current: string
  onStep: (s: string) => void
  loading: boolean
}) {
  const currentIdx = ALL_STATUTS.indexOf(current as VisiteStatut)

  return (
    <div className="flex w-full items-center">
      {ALL_STATUTS.map((step, idx) => {
        const cfg = STATUT_CONFIG[step]
        const done = idx < currentIdx
        const active = idx === currentIdx
        const next = idx === currentIdx + 1

        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => next && !loading && onStep(step)}
              disabled={(!next && !done && !active) || loading}
              className="group flex flex-1 flex-col items-center gap-2 transition-all"
              title={next ? `Passer à « ${cfg.label} »` : undefined}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-white transition-all",
                  done && "border-emerald-500 bg-emerald-500",
                  active && !done && STEP_CIRCLE[step],
                  next && !active && !done && cn("border-dashed bg-background", STEP_BORDER[step]),
                  !done && !active && !next && "border-muted bg-background",
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : active ? (
                  <Activity className="h-4 w-4" />
                ) : (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      next ? cfg.dot : "bg-muted-foreground/30",
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-center text-[11px] font-semibold leading-tight",
                  done && "text-emerald-600",
                  active && cfg.colHeader,
                  next && cfg.colHeader,
                  !done && !active && !next && "text-muted-foreground/50",
                )}
              >
                {cfg.label}
              </span>
            </button>

            {idx < ALL_STATUTS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1 rounded-full",
                  idx < currentIdx ? "bg-emerald-400" : "bg-muted",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={cn("mt-0.5 text-sm font-medium text-foreground", mono && "font-sans")}>
          {value}
        </p>
      </div>
    </div>
  )
}

function FeuilleStatutBadge({ statut }: { statut: string }) {
  if (statut === "CONFIRMEE") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Confirmée</Badge>
    )
  }
  return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Brouillon</Badge>
}

export function VisiteDetailClient({
  visite,
  feuilles,
}: {
  visite: VisiteDetail
  feuilles: FeuilleListRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentStatut, setCurrentStatut] = useState(visite.statut)
  const [editingComment, setEditingComment] = useState(false)
  const [comment, setComment] = useState(visite.commentaires ?? "")
  const [error, setError] = useState<string | null>(null)

  const dateVisite = new Date(visite.dateVisite)
  const createdAt = visite.createdAt ? new Date(visite.createdAt) : null
  const updatedAt = visite.updatedAt ? new Date(visite.updatedAt) : null

  const medecinPrefix = visite.medecinTitre ? `${visite.medecinTitre} ` : ""
  const medecinFull = `${medecinPrefix}${visite.medecinNom}`

  const patientDisplayName =
    (visite.patientLabel?.trim() ||
      (visite.patient
        ? formatPatientIdentityLine(
            visite.patient.patName,
            visite.patient.patSurname,
            visite.patient.sexe,
            visite.patient.nomJeuneFille,
          ).trim()
        : "")) ||
    null

  const statutCfg = STATUT_CONFIG[currentStatut as VisiteStatut]
  const patientInitials = visite.patient
    ? getInitials(visite.patient.patName, visite.patient.patSurname)
    : patientDisplayName?.slice(0, 2).toUpperCase() ?? "?"

  function handleStatutChange(newStatut: string) {
    setError(null)
    startTransition(async () => {
      const res = await updateVisiteStatut({ id: visite.id, statut: newStatut })
      if (res.ok) setCurrentStatut(newStatut)
      else setError(res.error)
    })
  }

  function handleSaveComment() {
    setError(null)
    startTransition(async () => {
      const res = await updateVisiteStatut({
        id: visite.id,
        statut: currentStatut,
        commentaires: comment,
      })
      if (res.ok) setEditingComment(false)
      else setError(res.error)
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {visite.patient && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/patients/${visite.patient.id}`}>
                <ExternalLink className="h-4 w-4" />
                Dossier patient
              </Link>
            </Button>
          )}
          {currentStatut === "EN_COURS" && feuilles.length > 0 ? (
            <Button asChild size="sm" className="gap-1.5 bg-[#cd3b86] hover:bg-[#b8307a] text-white">
              <Link href={`/feuilles-circulation/${feuilles[0].id}`}>
                <ScrollText className="h-4 w-4" />
                Voir la feuille
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="gap-1.5 bg-[#cd3b86] hover:bg-[#b8307a] text-white">
              <Link href={`/feuilles-circulation/nouvelle?visite=${visite.id}`}>
                <ScrollText className="h-4 w-4" />
                Créer la feuille
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* En-tête */}
      <Card className={cn("overflow-hidden border-t-4 shadow-sm", statutCfg?.colBorder ?? "border-t-muted")}>
        <CardContent className="p-0">
          <div className={cn("px-6 py-5", statutCfg?.colBg)}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-xl border bg-background px-3 py-2 text-center shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {format(dateVisite, "MMM", { locale: fr })}
                    </p>
                    <p className="text-2xl font-extrabold leading-none text-foreground">
                      {format(dateVisite, "dd")}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                      {format(dateVisite, "yyyy")}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                      {patientDisplayName ?? (
                        <span className="text-muted-foreground">
                          Patient <span className="font-sans">#{visite.patientId}</span>
                        </span>
                      )}
                    </h1>
                    <VisiteStatutBadge statut={currentStatut} />
                  </div>

                  {visite.patient?.dob && (
                    <p className="text-sm text-muted-foreground">
                      {formatBirthAge(visite.patient.dob)}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                      {medecinFull}
                    </span>
                    <span className="hidden text-border sm:inline">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {format(dateVisite, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-muted-foreground/70">
                    VIS-{visite.id.padStart(6, "0")}
                  </p>
                </div>
              </div>

              <Badge variant="secondary" className="self-start px-3 py-1.5 text-sm font-medium">
                {visite.motifLibelle}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Progression */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Progression de la visite
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <StatutStepper current={currentStatut} onStep={handleStatutChange} loading={isPending} />
          {isPending && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Mise à jour en cours…
            </p>
          )}
        </CardContent>
      </Card>

      {/* Feuilles de circulation */}
      {currentStatut === "EN_COURS" && feuilles.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ScrollText className="h-4 w-4 text-[#cd3b86]" />
              Feuilles de circulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {feuilles.map((feuille) => (
              <Link
                key={feuille.id}
                href={`/feuilles-circulation/${feuille.id}`}
                className="group flex items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-3 transition-colors hover:border-[#cd3b86]/30 hover:bg-[#cd3b86]/5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-sm font-semibold text-[#cd3b86]">
                      {feuille.numero}
                    </span>
                    <FeuilleStatutBadge statut={feuille.statut} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {feuille.nbLignes} ligne{feuille.nbLignes > 1 ? "s" : ""}
                    {feuille.total > 0 ? ` · Total ${formatCurrency(feuille.total)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(feuille.totalPatient)}</p>
                    <p className="text-[10px] text-muted-foreground">Part patient</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[#cd3b86]" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Grille d'informations */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <User className="h-4 w-4" />
              Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visite.patient ? (
              <>
                <div className="mb-3 flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {patientInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">
                      {formatPatientIdentityLine(
                        visite.patient.patName,
                        visite.patient.patSurname,
                        visite.patient.sexe,
                        visite.patient.nomJeuneFille,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Né(e) le {format(new Date(visite.patient.dob), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                <Separator className="mb-1" />
                <InfoRow icon={Hash} label="N° dossier" value={`#${visite.patient.id}`} mono />
                <InfoRow icon={Phone} label="Téléphone" value={visite.patient.telephone} />
                <Button asChild variant="link" size="sm" className="mt-2 h-auto px-0 text-[#cd3b86]">
                  <Link href={`/patients/${visite.patient.id}`}>
                    Ouvrir le dossier
                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <InfoRow icon={Hash} label="Référence legacy" value={`#${visite.patientId}`} mono />
                <p className="text-xs italic text-muted-foreground">
                  Patient non encore importé dans le système.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Stethoscope className="h-4 w-4" />
              Médecin traitant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {getInitials(visite.medecinNom, "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold leading-tight">{medecinFull}</p>
                {visite.medecinSpecialite && (
                  <p className="text-xs text-muted-foreground">{visite.medecinSpecialite}</p>
                )}
              </div>
            </div>
            {visite.medecinTelephone && (
              <>
                <Separator className="mb-1" />
                <InfoRow icon={Phone} label="Téléphone" value={visite.medecinTelephone} />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <FileText className="h-4 w-4" />
              Commentaires cliniques
            </CardTitle>
            {!editingComment && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-muted-foreground"
                onClick={() => setEditingComment(true)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Modifier
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingComment ? (
              <div className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Notes cliniques, observations, recommandations…"
                  rows={4}
                  className="resize-none bg-muted/30"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveComment}
                    disabled={isPending}
                    className="bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Enregistrer"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComment(visite.commentaires ?? "")
                      setEditingComment(false)
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : comment ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {comment}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">Aucun commentaire renseigné.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métadonnées */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <span>
          Créée par <span className="font-medium text-foreground">{visite.userNom}</span>
        </span>
        {createdAt && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(createdAt, "dd/MM/yyyy 'à' HH:mm")}
          </span>
        )}
        {updatedAt && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Modifiée le {format(updatedAt, "dd/MM/yyyy 'à' HH:mm")}
          </span>
        )}
        <span className="font-sans">VIS-{visite.id.padStart(6, "0")}</span>
      </div>
    </div>
  )
}

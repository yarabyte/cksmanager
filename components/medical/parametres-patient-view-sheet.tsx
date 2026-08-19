"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Baby,
  FlaskConical,
  HeartPulse,
  Loader2,
  Scale,
  Stethoscope,
  ExternalLink,
} from "lucide-react"
import { useParametrePatientByVisite } from "@/hooks/use-parametres-patient"
import {
  bandeletteNitriteLabels,
  bandeletteQualiLabels,
  bandeletteSucreLabels,
  type BandeletteNitrite,
  type BandeletteQuali,
  type BandeletteSucre,
} from "@/lib/medical/bandelette"
import { cn } from "@/lib/utils"

function imcCategory(imc: number): { label: string; className: string } {
  if (imc < 18.5) return { label: "Maigreur", className: "text-sky-700 bg-sky-50" }
  if (imc < 25) return { label: "Normal", className: "text-[#58a639] bg-[#58a639]/10" }
  if (imc < 30) return { label: "Surpoids", className: "text-amber-700 bg-amber-50" }
  return { label: "Obésité", className: "text-red-700 bg-red-50" }
}

function qualiLabel(v: string) {
  return bandeletteQualiLabels[v as BandeletteQuali] ?? v
}

function nitriteLabel(v: string) {
  return bandeletteNitriteLabels[v as BandeletteNitrite] ?? v
}

function sucreLabel(v: string | null) {
  if (!v) return "—"
  return bandeletteSucreLabels[v as BandeletteSucre] ?? v
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string
  value: React.ReactNode
  unit?: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 tabular-nums">
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-normal text-gray-500">{unit}</span>
        ) : null}
      </p>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string
  icon: React.ElementType
  accent: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            accent,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </section>
  )
}

type Props = {
  visiteId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ParametresPatientViewSheet({
  visiteId,
  open,
  onOpenChange,
}: Props) {
  const { data, isLoading, error } = useParametrePatientByVisite(
    open ? visiteId ?? undefined : undefined,
  )

  const p = data?.parametre
  const v = data?.visite
  const imcNum = p ? Number(p.imc) : NaN
  const imcMeta = Number.isFinite(imcNum) ? imcCategory(imcNum) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto px-0"
      >
        <SheetHeader className="px-5 pb-3 border-b border-gray-100">
          <SheetTitle className="font-['DM_Sans',sans-serif] flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#cd3b86]" />
            Paramètres patient
          </SheetTitle>
          <SheetDescription asChild>
            <div className="space-y-1 text-left">
              {v ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">
                    {v.patientLabel ?? `Patient #${v.patientId}`}
                  </p>
                  <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {v.patientAge != null && (
                      <span>
                        {v.patientAge} an{v.patientAge > 1 ? "s" : ""}
                        {v.isPediatrique ? " · Pédiatrique" : ""}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Stethoscope className="h-3 w-3" />
                      {v.motifLibelle}
                    </span>
                  </p>
                </>
              ) : (
                <span>Consultation des constantes saisies</span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 py-5 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement…
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">
              {error instanceof Error
                ? error.message
                : "Impossible de charger les paramètres"}
            </p>
          )}

          {!isLoading && !error && !p && (
            <p className="text-sm text-gray-500 py-8 text-center">
              Aucun paramètre enregistré pour cette visite.
            </p>
          )}

          {p && (
            <>
              {p.updatedAt && (
                <p className="text-[11px] text-gray-400">
                  Saisis le{" "}
                  {format(new Date(p.updatedAt), "dd MMM yyyy à HH:mm", {
                    locale: fr,
                  })}
                </p>
              )}

              <Section
                title="Anthropométrie"
                icon={Scale}
                accent="bg-[#cd3b86]/10 text-[#cd3b86]"
              >
                <Metric label="Poids" value={p.poidsKg} unit="kg" />
                <Metric label="Taille" value={p.tailleCm} unit="cm" />
                <div className="col-span-2">
                  <Metric
                    label="IMC"
                    value={
                      <span className="inline-flex items-center gap-2">
                        {p.imc}
                        {imcMeta && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "rounded-full border-0 text-[10px] font-semibold",
                              imcMeta.className,
                            )}
                          >
                            {imcMeta.label}
                          </Badge>
                        )}
                      </span>
                    }
                  />
                </div>
              </Section>

              <Section
                title="Constantes"
                icon={HeartPulse}
                accent="bg-sky-100 text-sky-700"
              >
                <Metric label="PAS" value={p.pas} unit="mmHg" />
                <Metric label="PAD" value={p.pad} unit="mmHg" />
                <Metric label="Pouls" value={p.pouls} unit="/min" />
                <Metric label="Température" value={p.temperatureC} unit="°C" />
              </Section>

              <Section
                title="Bandelette urinaire"
                icon={FlaskConical}
                accent="bg-[#58a639]/10 text-[#58a639]"
              >
                <Metric label="Nitrites" value={nitriteLabel(p.nitrite)} />
                <Metric label="Sang" value={qualiLabel(p.sang)} />
                <Metric label="Leucocytes" value={qualiLabel(p.leucocytes)} />
                <Metric label="Protéines" value={qualiLabel(p.proteine)} />
                <Metric label="Cétones" value={qualiLabel(p.cetones)} />
                <Metric label="pH" value={p.ph} />
                <Metric label="Sucre" value={sucreLabel(p.sucre)} />
              </Section>

              {v?.isPediatrique && (
                <Section
                  title="Pédiatrie"
                  icon={Baby}
                  accent="bg-amber-100 text-amber-700"
                >
                  <Metric
                    label="Périmètre crânien"
                    value={p.perimetreCranien ?? "—"}
                    unit={p.perimetreCranien ? "cm" : undefined}
                  />
                  <Metric
                    label="Périmètre brachial"
                    value={p.perimetreBrachial ?? "—"}
                    unit={p.perimetreBrachial ? "cm" : undefined}
                  />
                  <Metric
                    label="Fréq. respiratoire"
                    value={p.frequenceRespiratoire ?? "—"}
                    unit={p.frequenceRespiratoire != null ? "/min" : undefined}
                  />
                  <Metric
                    label="SaO₂"
                    value={p.sao2 ?? "—"}
                    unit={p.sao2 != null ? "%" : undefined}
                  />
                </Section>
              )}

              {visiteId && (
                <div className="space-y-2">
                  <Button className="w-full rounded-xl" asChild>
                    <Link href={`/medical/parametres/${visiteId}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ouvrir la fiche paramètres
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    asChild
                  >
                    <Link href={`/visites/${visiteId}`}>
                      Ouvrir la fiche visite
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

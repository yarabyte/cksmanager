"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowLeft, FileDown, Loader2, Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatBirthAge, formatCurrency } from "@/lib/formatting"
import { downloadAvoirFeuillePdf } from "@/app/actions/avoirs-feuilles"
import type { AvoirFeuilleDetail } from "@/lib/types/avoir-feuille"

export type PrintParametres = {
  nomClinique?: string | null
  logo?: string | null
  adresse?: string | null
  telephone?: string | null
  email?: string | null
  niu?: string | null
  registreCommerce?: string | null
  noteBasPage1?: string | null
  noteBasPage2?: string | null
} | null

export function AvoirPrintClient({
  avoir,
  parametres,
}: {
  avoir: AvoirFeuilleDetail
  parametres: PrintParametres
}) {
  const router = useRouter()
  const [pdfPending, setPdfPending] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  async function handlePdf() {
    setPdfPending(true)
    try {
      const res = await downloadAvoirFeuillePdf(avoir.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      const binary = atob(res.base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setPdfPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4">
        <button
          onClick={() => router.push(`/feuilles-circulation/${avoir.feuilleId}`)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void handlePdf()}
            disabled={pdfPending}
            className="gap-2"
          >
            {pdfPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Télécharger PDF
          </Button>
          <Button
            onClick={() => window.print()}
            className="gap-2 bg-[#cd3b86] text-white hover:bg-[#b8307a]"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      <div
        id="print-document"
        className="mx-auto max-w-[210mm] bg-white text-gray-800 shadow-sm print:fixed print:inset-0 print:mx-0 print:max-w-none print:shadow-none"
      >
        <div className="px-[12mm] py-[10mm] text-[13px] print:px-0 print:py-0">
          <div className="flex items-start justify-between gap-6 border-b-2 border-gray-800 pb-4">
            <div className="flex items-start gap-4">
              {parametres?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={parametres.logo}
                  alt="Logo"
                  className="h-16 w-auto object-contain"
                />
              ) : null}
              <div>
                <h1 className="text-lg font-extrabold uppercase tracking-tight text-gray-900">
                  {parametres?.nomClinique ?? "Clinique"}
                </h1>
                {parametres?.adresse && (
                  <p className="text-xs text-gray-600">{parametres.adresse}</p>
                )}
                <p className="text-xs text-gray-600">
                  {[parametres?.telephone, parametres?.email].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase">Avoir comptable</p>
              <p className="font-mono text-base font-semibold">{avoir.numero}</p>
              <p className="text-xs text-gray-600">
                {avoir.createdAt
                  ? format(new Date(avoir.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })
                  : "—"}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-700">Actif</p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase text-gray-400">Patient</p>
              <p className="font-medium">
                {avoir.patientLabel ?? `Patient #${avoir.patientId}`}
              </p>
              {avoir.patientDob && (
                <p className="text-xs text-gray-500">{formatBirthAge(avoir.patientDob)}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-400">Médecin</p>
              <p className="font-medium">{avoir.medecinNom ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-400">Feuille</p>
              <p className="font-medium font-mono">{avoir.feuilleNumero}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-400">Visite</p>
              <p className="font-medium">
                {avoir.dateVisite
                  ? format(new Date(avoir.dateVisite), "d MMMM yyyy à HH:mm", { locale: fr })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Part patient feuille</span>
              <span className="tabular-nums font-medium">
                {formatCurrency(avoir.totalPatientFeuille)}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-gray-500">Part assurance</span>
              <span className="tabular-nums font-medium text-emerald-700">
                {formatCurrency(avoir.totalAssuranceFeuille)}
              </span>
            </div>
            <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base">
              <span className="font-semibold">Montant avoir</span>
              <span className="font-bold tabular-nums text-[#cd3b86]">
                {formatCurrency(avoir.montant)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[11px] uppercase text-gray-400">Motif</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{avoir.motif}</p>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            Créé par {avoir.userName ?? "—"}
          </div>

          <p className="mt-10 text-center text-xs text-gray-400">
            Document comptable — annulation de dette patient (sans encaissement)
          </p>
          {parametres?.noteBasPage1 && (
            <p className="mt-2 text-center text-[11px] text-gray-400">{parametres.noteBasPage1}</p>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}

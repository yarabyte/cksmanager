"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/formatting"
import type { RapportCaResult, RapportVue } from "@/lib/types/rapport"
import { produitSitePharmaLabels } from "@/lib/validations/pharmacie"
import { RAPPORT_PDF_PAGE_WIDTH_MM, RAPPORT_PDF_STYLES } from "./rapport-pdf-styles"

export type PrintParametres = {
  nomClinique?: string | null
  logo?: string | null
  adresse?: string | null
  telephone?: string | null
  email?: string | null
} | null

const VUE_LABEL: Record<RapportVue, string> = {
  patient: "Patient",
  medecin: "Médecin",
  assureur: "Assureur",
  categorie: "Catégorie",
  jour: "Jour",
}

export function RapportPrintClient({
  rapport,
  parametres,
}: {
  rapport: RapportCaResult
  parametres: PrintParametres
}) {
  const router = useRouter()
  const documentRef = React.useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = React.useState(false)
  const hasAutoDownloaded = React.useRef(false)

  const pdfFilename = `rapport-ca-${rapport.vue}-${rapport.site}-${rapport.dateDebut}-${rapport.dateFin}.pdf`

  const handleDownload = React.useCallback(async () => {
    if (!documentRef.current || downloading) return
    setDownloading(true)
    try {
      const { downloadPagesPdf } = await import("@/lib/pdf/download-pages-pdf")
      await downloadPagesPdf({
        root: documentRef.current,
        pageSelector: ".print-rapport-page",
        filename: pdfFilename,
        orientation: "portrait",
        pageWidthMm: RAPPORT_PDF_PAGE_WIDTH_MM,
      })
      toast.success("PDF téléchargé")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléchargement PDF")
    } finally {
      setDownloading(false)
    }
  }, [downloading, pdfFilename])

  React.useEffect(() => {
    if (hasAutoDownloaded.current) return
    hasAutoDownloaded.current = true
    const t = setTimeout(() => void handleDownload(), 600)
    return () => clearTimeout(t)
  }, [handleDownload])

  const countLabel = rapport.vue === "categorie" ? "Lignes" : "Factures"

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <style dangerouslySetInnerHTML={{ __html: RAPPORT_PDF_STYLES }} />

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <button
          type="button"
          onClick={() => router.push("/rapports")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <Button
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {downloading ? "Génération…" : "Télécharger le PDF"}
        </Button>
      </div>

      <div ref={documentRef} id="print-document" className="print-facture-portrait mx-auto w-[210mm]">
        <div className="print-rapport-page">
          <div className="rp-inner">
            <div className="rp-header">
              <div className="rp-header-left">
                {parametres?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={parametres.logo} alt="Logo" className="rp-logo" />
                ) : null}
                <div>
                  <h1 className="rp-clinique">{parametres?.nomClinique ?? "Clinique"}</h1>
                  {parametres?.adresse && <p className="rp-meta">{parametres.adresse}</p>}
                  <p className="rp-meta">
                    {[parametres?.telephone, parametres?.email].filter(Boolean).join(" • ")}
                  </p>
                </div>
              </div>
              <div className="rp-header-right">
                <p className="rp-doc-type">Rapport CA</p>
                <p className="rp-title">Par {VUE_LABEL[rapport.vue].toLowerCase()}</p>
                <p className="rp-periode">
                  {rapport.periodeLabel}
                  {rapport.site !== "all"
                    ? ` · Site ${produitSitePharmaLabels[rapport.site]}`
                    : " · Tous les sites"}
                </p>
              </div>
            </div>

            <div className="rp-kpis">
              <div className="rp-kpi">
                <p className="rp-kpi-label">CA total</p>
                <p className="rp-kpi-value">{formatCurrency(rapport.totaux.total)}</p>
              </div>
              <div className="rp-kpi">
                <p className="rp-kpi-label">Part patient</p>
                <p className="rp-kpi-value">{formatCurrency(rapport.totaux.montantPatient)}</p>
              </div>
              <div className="rp-kpi">
                <p className="rp-kpi-label">Part assurance</p>
                <p className="rp-kpi-value">{formatCurrency(rapport.totaux.montantAssurance)}</p>
              </div>
              <div className="rp-kpi">
                <p className="rp-kpi-label">Factures</p>
                <p className="rp-kpi-value">{rapport.totaux.nbFactures}</p>
              </div>
            </div>

            <table className="rp-table">
              <thead>
                <tr>
                  <th>{VUE_LABEL[rapport.vue]}</th>
                  <th className="rp-center">{countLabel}</th>
                  <th className="rp-right">Part patient</th>
                  <th className="rp-right">Part assurance</th>
                  <th className="rp-right">Total CA</th>
                  <th className="rp-right">%</th>
                </tr>
              </thead>
              <tbody>
                {rapport.lignes.map((l) => (
                  <tr key={l.id}>
                    <td>{l.label}</td>
                    <td className="rp-center">{l.count}</td>
                    <td className="rp-right">{formatCurrency(l.montantPatient)}</td>
                    <td className="rp-right">{formatCurrency(l.montantAssurance)}</td>
                    <td className="rp-right">{formatCurrency(l.total)}</td>
                    <td className="rp-right">{l.partPct.toFixed(1)} %</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>TOTAL</td>
                  <td className="rp-center">{rapport.totaux.nbFactures}</td>
                  <td className="rp-right">{formatCurrency(rapport.totaux.montantPatient)}</td>
                  <td className="rp-right">{formatCurrency(rapport.totaux.montantAssurance)}</td>
                  <td className="rp-right">{formatCurrency(rapport.totaux.total)}</td>
                  <td className="rp-right">100 %</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatFactureNumero } from "@/lib/formatting"
import type { BordereauDetail, BordereauStatut } from "@/lib/types/bordereau"
import { BORDEREAU_PDF_PAGE_WIDTH_MM, BORDEREAU_PDF_STYLES } from "./bordereau-pdf-styles"

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

const STATUT_LABEL: Record<BordereauStatut, string> = {
  BROUILLON: "Brouillon",
  DEPOSE: "Déposé",
  PAYE: "Payé",
}

function formatDateFr(iso: string | null) {
  if (!iso) return "—"
  return format(new Date(iso), "d MMMM yyyy", { locale: fr })
}

export function BordereauPrintClient({
  bordereau,
  parametres,
}: {
  bordereau: BordereauDetail
  parametres: PrintParametres
}) {
  const router = useRouter()
  const documentRef = React.useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = React.useState(false)
  const [downloadingWord, setDownloadingWord] = React.useState(false)
  const hasAutoDownloaded = React.useRef(false)

  const pdfFilename = `bordereau-${bordereau.numero.replace(/\s+/g, "-")}.pdf`

  const handleDownload = React.useCallback(async () => {
    if (!documentRef.current || downloading) return
    setDownloading(true)
    try {
      const { downloadPagesPdf } = await import("@/lib/pdf/download-pages-pdf")
      await downloadPagesPdf({
        root: documentRef.current,
        pageSelector: ".print-bordereau-page",
        filename: pdfFilename,
        orientation: "portrait",
        pageWidthMm: BORDEREAU_PDF_PAGE_WIDTH_MM,
      })
      toast.success("PDF téléchargé")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléchargement PDF")
    } finally {
      setDownloading(false)
    }
  }, [downloading, pdfFilename])

  async function handleDownloadWord() {
    if (downloadingWord) return
    setDownloadingWord(true)
    try {
      const { downloadBordereauDocx } = await import(
        "@/lib/bordereau/build-bordereau-docx"
      )
      await downloadBordereauDocx(bordereau, parametres)
      toast.success("Word téléchargé")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Échec du téléchargement Word",
      )
    } finally {
      setDownloadingWord(false)
    }
  }

  React.useEffect(() => {
    if (hasAutoDownloaded.current) return
    hasAutoDownloaded.current = true
    const t = setTimeout(() => void handleDownload(), 600)
    return () => clearTimeout(t)
  }, [handleDownload])

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <style dangerouslySetInnerHTML={{ __html: BORDEREAU_PDF_STYLES }} />

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <button
          type="button"
          onClick={() => router.push(`/facturation/bordereaux/${bordereau.id}`)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void handleDownloadWord()}
            disabled={downloadingWord}
            className="gap-2"
          >
            {downloadingWord ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {downloadingWord ? "Génération…" : "Télécharger Word"}
          </Button>
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
      </div>

      <div
        ref={documentRef}
        id="print-document"
        className="print-facture-portrait mx-auto w-[210mm]"
      >
        <div className="print-bordereau-page">
          <div className="bp-inner">
            <div className="bp-header">
              <div className="bp-header-left">
                {parametres?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={parametres.logo} alt="Logo" className="bp-logo" />
                ) : null}
                <div>
                  <h1 className="bp-clinique">{parametres?.nomClinique ?? "Clinique"}</h1>
                  {parametres?.adresse && <p className="bp-meta">{parametres.adresse}</p>}
                  <p className="bp-meta">
                    {[parametres?.telephone, parametres?.email].filter(Boolean).join(" • ")}
                  </p>
                  <p className="bp-meta-sm">
                    {[
                      parametres?.niu ? `NIU : ${parametres.niu}` : null,
                      parametres?.registreCommerce
                        ? `RC : ${parametres.registreCommerce}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
              </div>
              <div className="bp-header-right">
                <p className="bp-doc-type">Bordereau assureur</p>
                <p className="bp-numero">{bordereau.numero}</p>
                <p className="bp-statut">{STATUT_LABEL[bordereau.statut]}</p>
              </div>
            </div>

            <div className="bp-info">
              <div>
                <span className="bp-label">Assureur : </span>
                <span className="bp-value">{bordereau.assuranceNom}</span>
              </div>
              <div className="bp-right">
                <span className="bp-label">Factures : </span>
                <span className="bp-value">{bordereau.factures.length}</span>
              </div>
              {bordereau.dateDepot && (
                <div>
                  <span className="bp-label">Date de dépôt : </span>
                  <span className="bp-value">{formatDateFr(bordereau.dateDepot)}</span>
                </div>
              )}
              {bordereau.datePaiement && (
                <div className="bp-right">
                  <span className="bp-label">Paiement : </span>
                  <span className="bp-value">
                    {formatDateFr(bordereau.datePaiement)}
                    {bordereau.refVirement ? ` · ${bordereau.refVirement}` : ""}
                  </span>
                </div>
              )}
            </div>

            <table className="bp-table">
              <thead>
                <tr>
                  <th>N° facture</th>
                  <th>Patient</th>
                  <th>Date visite</th>
                  <th className="bp-right">Part assurance</th>
                </tr>
              </thead>
              <tbody>
                {bordereau.factures.map((f) => (
                  <tr key={f.factureId}>
                    <td>{formatFactureNumero(f.factureNumero)}</td>
                    <td>{f.patientLabel ?? `#${f.patientId}`}</td>
                    <td>{formatDateFr(f.dateVisite)}</td>
                    <td className="bp-right">{formatCurrency(f.montantAssurance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bp-totals">
              <table>
                <tbody>
                  <tr className="bp-total-row">
                    <td>Total à recouvrer</td>
                    <td className="bp-right">{formatCurrency(bordereau.montantTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {bordereau.noteDepot && (
              <div className="bp-notes">
                <span className="bp-label">Note de dépôt : </span>
                {bordereau.noteDepot}
              </div>
            )}

            {(parametres?.noteBasPage1 || parametres?.noteBasPage2) && (
              <div className="bp-footer-notes">
                {parametres?.noteBasPage1 && <p>{parametres.noteBasPage1}</p>}
                {parametres?.noteBasPage2 && <p>{parametres.noteBasPage2}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

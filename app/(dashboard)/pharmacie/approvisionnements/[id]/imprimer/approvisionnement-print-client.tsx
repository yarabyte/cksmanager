"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/formatting"

const STYLES = `
.print-appro-page {
  width: 210mm; min-height: 297mm; box-sizing: border-box;
  background: #fff; color: #1f2937; font-family: Inter, system-ui, sans-serif;
  padding: 12mm 10mm; font-size: 13px;
}
.ap-title { font-size: 18px; font-weight: 800; margin: 0; }
.ap-meta { color: #6b7280; font-size: 12px; margin: 2px 0 0; }
.ap-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.ap-table th, .ap-table td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; text-align: left; }
.ap-table th { background: #f9fafb; font-weight: 600; }
.ap-table .ap-right { text-align: right; }
.ap-table .ap-center { text-align: center; }
.ap-totals { margin-top: 16px; text-align: right; font-weight: 700; }
`

type ApproPrint = {
  id: string
  numero: string
  magasinNom: string
  fournisseurNom: string | null
  userNom: string
  dateReception: string
  note: string | null
  lignes: {
    produitNom: string
    produitDosage: string
    produitForme?: string
    produitConditionnement?: string
    quantite: number
    numeroLot: string
    datePeremption: string
    prixAchatUnitaire: number
  }[]
}

export function ApprovisionnementPrintClient({
  appro,
  parametres,
}: {
  appro: ApproPrint
  parametres: { nomClinique?: string | null } | null
}) {
  const router = useRouter()
  const ref = React.useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = React.useState(false)

  const totalQte = appro.lignes.reduce((s, l) => s + l.quantite, 0)
  const totalAchat = appro.lignes.reduce(
    (s, l) => s + l.quantite * l.prixAchatUnitaire,
    0,
  )

  async function download() {
    if (!ref.current) return
    setDownloading(true)
    try {
      const { downloadPagesPdf } = await import("@/lib/pdf/download-pages-pdf")
      await downloadPagesPdf({
        root: ref.current,
        pageSelector: ".print-appro-page",
        filename: `approvisionnement-${appro.numero}.pdf`,
        orientation: "portrait",
        pageWidthMm: 210,
      })
      toast.success("PDF téléchargé")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur PDF")
    } finally {
      setDownloading(false)
    }
  }

  React.useEffect(() => {
    const t = setTimeout(() => void download(), 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-between px-4">
        <button
          type="button"
          onClick={() => router.push(`/pharmacie/approvisionnements/${appro.id}`)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <Button
          onClick={() => void download()}
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

      <div ref={ref} className="mx-auto w-[210mm]">
        <div className="print-appro-page">
          <p className="ap-meta">{parametres?.nomClinique ?? "Clinique"}</p>
          <h1 className="ap-title">Bon de réception {appro.numero}</h1>
          <p className="ap-meta">Magasin : {appro.magasinNom}</p>
          <p className="ap-meta">
            Fournisseur : {appro.fournisseurNom ?? "—"}
          </p>
          <p className="ap-meta">
            Réception le {formatDate(appro.dateReception)} · Par {appro.userNom}
          </p>
          {appro.note && <p className="ap-meta">Note : {appro.note}</p>}

          <table className="ap-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Forme</th>
                <th>Conditionnement</th>
                <th>Lot</th>
                <th>Péremption</th>
                <th className="ap-center">Qté</th>
                <th className="ap-right">PU achat</th>
                <th className="ap-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {appro.lignes.map((l, i) => (
                <tr key={i}>
                  <td>
                    {l.produitNom}
                    {l.produitDosage ? ` ${l.produitDosage}` : ""}
                  </td>
                  <td>{l.produitForme || "—"}</td>
                  <td>{l.produitConditionnement || "—"}</td>
                  <td>{l.numeroLot}</td>
                  <td>{formatDate(l.datePeremption)}</td>
                  <td className="ap-center">{l.quantite}</td>
                  <td className="ap-right">{formatCurrency(l.prixAchatUnitaire)}</td>
                  <td className="ap-right">
                    {formatCurrency(l.quantite * l.prixAchatUnitaire)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="ap-totals">
            Unités : {totalQte} · Total achat : {formatCurrency(totalAchat)}
          </p>
        </div>
      </div>
    </div>
  )
}
